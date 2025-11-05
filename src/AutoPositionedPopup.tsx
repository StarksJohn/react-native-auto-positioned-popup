import React, {
  ForwardedRef,
  forwardRef,
  ForwardRefExoticComponent,
  memo,
  MemoExoticComponent, MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {AdvancedFlatList, ListData, FetchDataParams} from 'react-native-advanced-flatlist';
import {TextInputSubmitEditingEventData} from 'react-native/Libraries/Components/TextInput/TextInput';
import {LayoutRectangle, NativeSyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {AutoPositionedPopupProps, Data, SelectedItem} from './AutoPositionedPopupProps';
import styles from './AutoPositionedPopup.style';
import {useRootView} from './RootViewContext';
import {useKeyboardStatus} from './KeyboardManager';

// Lightweight emitter to decouple TextInput and list without re-rendering context
type QueryListener = (query: string) => void;
const queryChangeListeners: QueryListener[] = [];
const emitQueryChange = (query: string) => {
  console.log('AutoPositionedPopup.tsx emitQueryChange query=', query, ' listeners=', queryChangeListeners.length);
  queryChangeListeners.forEach((l) => l(query));
};
const subscribeQueryChange = (listener: QueryListener) => {
  queryChangeListeners.push(listener);
  return () => {
    const idx = queryChangeListeners.indexOf(listener);
    if (idx !== -1) queryChangeListeners.splice(idx, 1);
  };
};

// Default theme colors interface
interface Theme {
  colors: {
    text: string;
    placeholderText: string;
    background: string;
    border: string;
  };
}

// Default light theme
const defaultTheme: Theme = {
  colors: {
    text: '#333333',
    placeholderText: '#999999',
    background: '#FFFFFF',
    border: '#E0E0E0',
  },
};

// List item component for rendering individual items
const ListItem: React.FC<{
  updateState: (key: string, value: SelectedItem) => void;
  item: SelectedItem;
  index: number;
  selectedItem?: SelectedItem;
}> = memo(
  ({
     updateState,
     item,
     index,
     selectedItem,
   }: {
    updateState: (key: string, value: SelectedItem) => void;
    item: SelectedItem;
    index: number;
    selectedItem?: SelectedItem;
  }): React.JSX.Element => {
    const {addRootView, setRootViewNativeStyle, removeRootView, rootViews} = useRootView();
    const rootViewsRef = useRef(rootViews);
    useEffect(() => {
      rootViewsRef.current = rootViews;
    }, [rootViews]);
    return useMemo(() => {
      // console.log('AutoPositionedPopup.tsx ListItem index=', index);
      console.log('AutoPositionedPopup.tsx ListItem item=', item);
      console.log('AutoPositionedPopup.tsx ListItem selectedItem=', selectedItem);
      const isSelected = item.id === selectedItem?.id;
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.commonModalRow,
            {backgroundColor: isSelected ? 'rgba(116, 116, 128, 0.08)' : 'transparent'},
          ]}
          onPress={() => {
            // console.log('AutoPositionedPopup.tsx ListItem onPress item=', item); // Commented to prevent spam
            // console.log('AutoPositionedPopup.tsx ListItem onPress rootViews=', rootViewsRef.current); // Commented to prevent spam
            updateState('selectedItem', item);
          }}
        >
          <Text style={styles.ListItemCode} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    }, [updateState, item, index, selectedItem, rootViewsRef]);
  }
);

// Popup list component with AdvancedFlatList
interface AutoPositionedPopupListProps {
  tag: string;
  updateState: (key: string, value: any) => void;
  fetchData: ({
                pageIndex,
                pageSize,
                searchQuery,
              }: {
    pageIndex: number;
    pageSize: number;
    searchQuery?: string;
  }) => Promise<Data | null>;
  keyExtractor?: (item: SelectedItem) => string; //keyExtractor={item => item?.id}
  renderItem?: ({item, index}: { item: SelectedItem; index: number }) => React.ReactElement;
  selectedItem?: SelectedItem;
  localSearch?: boolean;
  pageSize?: number;
  showListEmptyComponent?:boolean;
  emptyText?: string;
}

const AutoPositionedPopupList: React.FC<AutoPositionedPopupListProps> = memo(
  ({
     tag,
     updateState,
     fetchData,
     keyExtractor = (item) => String(item.id),
     renderItem,
     selectedItem,
     localSearch,
     pageSize,showListEmptyComponent,emptyText
   }: AutoPositionedPopupListProps): React.JSX.Element => {
    const [state, setState] = useState<{
      selectedItem?: SelectedItem;
      localData: SelectedItem[];
    }>({
      selectedItem: selectedItem,
      localData: [],
    });
    // Define an interface that matches the methods we need from CsxFlatList
    const ref_list = useRef<{ scrollToTop: () => void; refresh: () => void } | null>(null);
    const ref_searchQuery = useRef<string>('');
    const {searchQuery, setSearchQuery, rootViews} = useRootView();
    const rootViewsRef = useRef(rootViews);
    useEffect(() => {
      rootViewsRef.current = rootViews;
    }, [rootViews]);
    /**
     * componentDidMount && componentWillUnmount
     */
    useEffect(() => {
      (async () => {
      })();
      console.log(`AutoPositionedPopupList componentDidMount`);
      //componentWillUnmount
      return () => {
        console.log(`AutoPositionedPopupList componentWillUnmount`);
        setSearchQuery('');
      };
    }, []);
    // useEffect(() => {
    //   // 監聽 TextInput 事件，收到就刷新列表，不依賴 global searchQuery
    //   // 將最新的 searchQuery 同步到 list 專用的 ref，供 _fetchData 使用
    //   ref_searchQuery.current = searchQuery;
    //   console.log('AutoPositionedPopupList useEffect searchQuery=', searchQuery);
    //   console.log('AutoPositionedPopupList useEffect state.localData=', state.localData);
    //   console.log('AutoPositionedPopupList useEffect ref_list.current=', ref_list.current);
    //   console.log('AutoPositionedPopupList useEffect localSearch=', localSearch);
    //   if (ref_list.current && (localSearch && state.localData.length > 0 || !localSearch)) {
    //     ref_list.current.scrollToTop();
    //     ref_list.current.refresh();
    //   }
    // }, [searchQuery, state.localData, localSearch]);
    useEffect(() => {
      const unsubscribe = subscribeQueryChange((newQuery: string) => {
        console.log('AutoPositionedPopupList useEffect subscribeQueryChange newQuery=', newQuery);
        ref_searchQuery.current = newQuery;
        if (ref_list.current) {
          ref_list.current.scrollToTop();
          ref_list.current.refresh();
        }
      });
      return unsubscribe;
    }, []);
    const _updateState = (key: string, value: SelectedItem) => {
      console.log('AutoPositionedPopupList _updateState key=', key, ' value=', value);
      setState((prevState) => ({
        ...prevState,
        [key]: value,
      }));
      console.log('AutoPositionedPopupList _updateState rootViews=', rootViewsRef.current);
      updateState(key, value);
    };
    const _fetchData = async ({
                                pageIndex,
                                pageSize: currentPageSize,
                              }: FetchDataParams): Promise<ListData | null> => {
      console.log('AutoPositionedPopupList _fetchData pageIndex=', pageIndex, ' pageSize=', currentPageSize);
      console.log('AutoPositionedPopupList _fetchData state.localData=', state.localData);
      console.log('AutoPositionedPopupList _fetchData ref_searchQuery.current=', ref_searchQuery.current);
      console.log('AutoPositionedPopupList _fetchData localSearch=', localSearch);
      if (localSearch && state.localData.length > 0) {
        const result: SelectedItem[] = state.localData.filter((item: SelectedItem) => {
          return item.title?.toLowerCase().includes(ref_searchQuery.current.toLowerCase());
        });
        console.log('AutoPositionedPopupList _fetchData localSearch result=', result);
        return Promise.resolve({
          items: result,
          pageIndex: 0,
          needLoadMore: false,
        });
      }
      try {
        const res: Data | null = await fetchData({
          pageIndex,
          pageSize: pageSize || 10,
          searchQuery: ref_searchQuery.current,
        });
        console.log('AutoPositionedPopupList _fetchData res=', res);
        if (res?.items && localSearch) {
          setState((prevState) => {
            return {
              ...prevState,
              localData: res.items,
            };
          });
        }
        // Convert Data to ListData if needed
        if (res) {
          return Promise.resolve({
            items: res.items as any[], // Convert to ListItem array
            pageIndex: res.pageIndex,
            needLoadMore: res.needLoadMore,
          });
        }
        return null;
      } catch (e) {
        console.warn('Error in fetchData:', e);
      }
      console.log('AutoPositionedPopupList _fetchData res=', null);
      return null;
    };
    const _renderItem = useCallback(
      ({item, index}: { item: SelectedItem; index: number }) => {
        return <ListItem item={item} index={index} updateState={_updateState} selectedItem={state.selectedItem} />;
      },
      [state.selectedItem]
    );
    return useMemo(() => {
      console.log('AutoPositionedPopupList (global as any)?.$fake=', (global as any)?.$fake);
      // Babel configuration handles the path redirection based on global.$fake
      // No need for conditional import here
      return (
        <View style={[styles.baseModalView, styles.autoPositionedPopupList]}>
          <AdvancedFlatList
            style={[{borderRadius: 0}]}
            {...(ref_list && {ref: ref_list})}
            keyExtractor={(item, index) => keyExtractor ? keyExtractor(item as SelectedItem) : (item as SelectedItem).id}
            keyboardShouldPersistTaps={'always'}
            fetchData={_fetchData}
            renderItem={renderItem ? ({item, index}) => renderItem({item: item as SelectedItem, index}) : ({item, index}) => _renderItem({item: item as SelectedItem, index})}
            showListEmptyComponent={showListEmptyComponent}
            emptyText={emptyText}
          />
        </View>
      );
    }, [tag,
      updateState,
      fetchData,
      keyExtractor,
      renderItem,
      state.selectedItem,
      state.localData,
      searchQuery,
      localSearch,
      pageSize,
      rootViewsRef,showListEmptyComponent,emptyText
    ]);
  }
);

// State interface for AutoPositionedPopup
interface StateProps {
  isFocus?: boolean;
  selectedItem?: SelectedItem | any;
}

// List layout constants
const listLayout = {
  height: 200,
};

// Main AutoPositionedPopup component
const AutoPositionedPopup = memo(
  forwardRef<unknown, AutoPositionedPopupProps>(
    (props: AutoPositionedPopupProps, parentRef: ForwardedRef<unknown>): React.JSX.Element => {
      console.log('AutoPositionedPopup props=', props);
      const {
        tag,
        style,
        AutoPositionedPopupBtnStyle,
        placeholder = 'Please Select',
        onSubmitEditing,
        TextInputProps = {},
        inputStyle,
        labelStyle,
        popUpViewStyle = {left: '5%', width: '90%'},
        fetchData = async ({
                             pageIndex,
                             pageSize,
                             searchQuery,
                           }: {
          pageIndex: number;
          pageSize: number;
          searchQuery?: string;
        }): Promise<Data | null> => {
          const res = {
            items: [] as any[],
            pageIndex,
            needLoadMore: false,
          };
          try {
            // const res1: any[] = await $api.xxx(pageSize)
            // console.log('${NAME} xxx res=', res)
            // res.items = res1
            // res.needLoadMore = res1.length === pageSize
          } catch (e) {
            console.warn('Error in fetch operation:', e);
          }
          return res;
        },
        renderItem,
        onItemSelected,
        localSearch = false,
        pageSize = 20,
        selectedItem,
        useTextInput = false,
        btwChildren,
        CustomRow = ({children}) => <View>{children}</View>,
        keyExtractor = (item: any) => String(item?.id || ''),
        AutoPositionedPopupBtnDisabled = false,
        forceRemoveAllRootViewOnItemSelected = false,
        centerDisplay = false,
        selectedItemBackgroundColor = 'rgba(116, 116, 128, 0.08)',
        textAlign = 'right',
        CustomPopView = undefined, CustomPopViewStyle,showListEmptyComponent=true,emptyText=''
      } = props;
      // State management similar to project implementation
      const [state, setState] = useState<StateProps>({
        isFocus: false,
        selectedItem: selectedItem,
      });
      // Use RootView context
      const {addRootView, setRootViewNativeStyle, removeRootView, rootViews, setSearchQuery} = useRootView();
      const rootViewsRef = useRef(rootViews);
      // Track TextInput focus and RootView states like project implementation
      const hasTriggeredFocus = useRef(false);
      const hasAddedRootView = useRef(false);
      const hasShownRootView = useRef(false);
      // Additional refs for keyboard and position tracking
      const ref_isFocus = useRef<boolean>(false);
      const ref_isKeyboardFullyShown = useRef<boolean>(false);
      const ref_listPos: MutableRefObject<any> = useRef<LayoutRectangle | undefined>(undefined)
      const keyboardVisibleRef = useRef(false);
      const refAutoPositionedPopup = useRef<View>(null);
      const ref_searchQuery = useRef<string>('');
      // Simple keyboard status tracking (alternative to useKeyboardStatus hook)
      // Legacy state for compatibility
      const [isVisible, setIsVisible] = useState(false);
      const [data, setData] = useState<SelectedItem[]>([]);
      const [loading, setLoading] = useState(false);
      const [popupPosition, setPopupPosition] = useState<{
        top: number;
        left: number;
        width: number;
      }>({top: 0, left: 0, width: 0});
      // Refs for performance optimization
      const containerRef = useRef<View>(null);
      const textInputRef = useRef<RNTextInput>(null);
      const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
      const searchQueryRef = useRef<string>(''); // Use ref instead of state to avoid re-renders
      // Refs to store latest values for useEffect without adding to dependency array
      const dataRef = useRef<SelectedItem[]>(data);
      const isKeyboardFullyShown = useKeyboardStatus();
      const theme = defaultTheme;
      /**
       * componentDidMount && componentWillUnmount
       */
      useEffect(() => {
        (async () => {
        })();
        console.log(`AutoPositionedPopup componentDidMount tag=`, tag);
        console.log('AutoPositionedPopup componentDidMount CustomPopView=', CustomPopView);
        //componentWillUnmount
        return () => {
          console.log(`AutoPositionedPopup componentWillUnmount tag=`, tag);
          removeRootView(tag, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
          setSearchQuery('');
          if (textInputRef.current) {
            textInputRef.current.blur();
            hasTriggeredFocus.current = false;
            hasAddedRootView.current = false;
            hasShownRootView.current = false;
            ref_isFocus.current = false;
          }
        };
      }, []);
      useEffect(() => {
        console.log('AutoPositionedPopup rootViews=', rootViews);
        rootViewsRef.current = rootViews;
        if (rootViews.length === 0) {
          hasAddedRootView.current = false;
          hasShownRootView.current = false;
          ref_isFocus.current = false;
          ref_isKeyboardFullyShown.current = false;
          hasTriggeredFocus.current = false;
          setState((prevState) => {
            return {
              ...prevState,
              isFocus: false,
            };
          });
        }
      }, [rootViews]);
      useEffect(() => {
        console.log('AutoPositionedPopup useEffect tag=', tag);
        console.log('AutoPositionedPopup useEffect selectedItem=', selectedItem);
        console.log('AutoPositionedPopup useEffect state.selectedItem=', state.selectedItem);
        if (state.selectedItem?.id !== selectedItem?.id || state.selectedItem?.title !== selectedItem?.title) {
          console.log('AutoPositionedPopup useEffect selectedItem!=state.selectedItem');
          setState((prevState) => {
            return {
              ...prevState,
              selectedItem: selectedItem,
            };
          });
        }
      }, [selectedItem, state.selectedItem, tag]);
      useEffect(() => {
        console.log('AutoPositionedPopup useEffect tag=', tag);
        console.log('AutoPositionedPopup useEffect state.isFocus=', state.isFocus);
        console.log('AutoPositionedPopup useEffect isKeyboardFullyShown=', isKeyboardFullyShown);
        console.log('AutoPositionedPopup useEffect ref_isFocus.current=', ref_isFocus.current);
        console.log(
          'AutoPositionedPopup useEffect ref_isKeyboardFullyShown.current=',
          ref_isKeyboardFullyShown.current
        );
        console.log('AutoPositionedPopup useEffect useTextInput=', useTextInput);
        console.log('AutoPositionedPopup useEffect TextInputProps=', TextInputProps);
        console.log('AutoPositionedPopup useEffect hasAddedRootView.current=', hasAddedRootView.current);
        console.log('AutoPositionedPopup useEffect hasShownRootView.current=', hasShownRootView.current);
        if (useTextInput) {
          if (isKeyboardFullyShown && hasAddedRootView.current && !hasShownRootView.current && state.isFocus) {
            refAutoPositionedPopup.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
              console.log('AutoPositionedPopup measureInWindow x=', x, ' y=', y, ' width=', width, ' height=', height);
              // SIMPLE CENTER-BASED POSITIONING STRATEGY
              const screenHeight = Dimensions.get('screen').height;
              const screenCenter = screenHeight / 2;
              console.log('AutoPositionedPopup screenHeight=', screenHeight, ' screenCenter=', screenCenter, ' componentY=', y);

              // Simple rule: if component Y > screen center, show popup above; otherwise show below
              if (y > screenCenter) {
                console.log('AutoPositionedPopup with keyboard: showing above (Y > center)');
                ref_listPos.current = {x: x, y: y - listLayout.height, width: width};
              } else {
                console.log('AutoPositionedPopup with keyboard: showing below (Y <= center)');
                ref_listPos.current = {x: x, y: y + height, width: width};
              }
              console.log('AutoPositionedPopup ref_listPos.current=', ref_listPos.current);
              setRootViewNativeStyle(tag, {
                top: ref_listPos.current?.y,
                left: popUpViewStyle?.left,
                width: popUpViewStyle?.width,
                height: listLayout.height,
                opacity: 1,
              });
              hasShownRootView.current = true;
            });
          } else if (!isKeyboardFullyShown && ref_isFocus.current) {
            console.log(
              'AutoPositionedPopup isKeyboardFullyShown useEffect removeRootView tag=',
              tag,
              ' forceRemoveAllRootViewOnItemSelected=',
              forceRemoveAllRootViewOnItemSelected
            );
            removeRootView(tag, forceRemoveAllRootViewOnItemSelected);
            setState((prevState) => {
              return {
                ...prevState,
                isFocus: false,
              };
            });
            setSearchQuery('');
            hasAddedRootView.current = false;
            hasShownRootView.current = false;
          }
        } else {
          if (state.isFocus) {
            refAutoPositionedPopup.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
              console.log('AutoPositionedPopup measureInWindow x=', x, ' y=', y, ' width=', width, ' height=', height);

              // INTELLIGENT POSITION CALCULATION - MODIFIED VERSION WITH STATUS BAR SAFETY
              const calculateOptimalPosition = (componentY: number, componentHeight: number, popupHeight: number) => {
                console.log('🔥🔥🔥 NEW CALCULATE OPTIMAL POSITION FUNCTION EXECUTING 🔥🔥🔥');

                // Use window height (visible area) instead of screen height (includes status bar)
                const windowHeight = Dimensions.get('window').height;
                const visibleAreaCenter = windowHeight / 2;

                // Cross-platform status bar height handling
                const getStatusBarHeight = () => {
                  if (Platform.OS === 'android') {
                    return StatusBar.currentHeight || 24; // Android default
                  } else {
                    // iOS status bar heights vary by device
                    const {height: screenHeight} = Dimensions.get('screen');
                    const {height: windowHeightLocal} = Dimensions.get('window');
                    return screenHeight - windowHeightLocal; // Safe area top
                  }
                };
                const statusBarHeight = getStatusBarHeight();
                console.log('🔥 Cross-platform StatusBar height:', statusBarHeight, 'Platform:', Platform.OS);

                // Calculate component center point as requested
                const componentCenterY = componentY + componentHeight / 2;

                console.log('AutoPositionedPopup positioning data:', {
                  windowHeight,
                  visibleAreaCenter,
                  componentCenterY,
                  componentY,
                  componentHeight,
                  popupHeight,
                  statusBarHeight
                });

                let showAbove = false;
                let finalY = componentY + componentHeight; // Default fallback: show below

                // CORRECTED LOGIC: Calculate actual usable space considering status bar
                const rawSpaceAbove = componentY;
                const spaceBelow = windowHeight - (componentY + componentHeight);
                // Actual usable space above must account for status bar
                const usableSpaceAbove = componentY - statusBarHeight;

                console.log('🔥 AutoPositionedPopup CORRECTED SPACE CALCULATION (pre-spacing):', {
                  rawSpaceAbove,
                  usableSpaceAbove,
                  spaceBelow,
                  popupHeight,
                  componentY,
                  componentHeight,
                  windowHeight,
                  statusBarHeight
                });

                // ULTRA-TIGHT SPACING: Minimal spacing for tight visual connection
                const getOptimalSpacing = (compY: number, compHeight: number, winHeight: number) => {
                  const componentCenter = compY + compHeight / 2;
                  const screenCenter = winHeight / 2;
                  const distanceFromCenter = Math.abs(componentCenter - screenCenter) / screenCenter;

                  // Check if component is in bottom half for ultra-tight spacing
                  const isInBottomHalf = componentCenter > screenCenter;

                  // Base spacing: extremely small for bottom components
                  const baseSpacing = isInBottomHalf ? 0.5 : 3;

                  // Aggressive spacing reduction for edge positions - ultra tight for bottom half
                  const edgeProximityFactor = isInBottomHalf ?
                    Math.max(0.15, 1 - distanceFromCenter * 1.2) :
                    Math.max(0.4, 1 - distanceFromCenter * 0.7);

                  // Minimal component-relative spacing for bottom components
                  const relativeSpacingPercent = isInBottomHalf ? 0.02 : 0.12;
                  const relativeSpacing = Math.min(compHeight * relativeSpacingPercent, isInBottomHalf ? 3 : 10);

                  // Strong platform adjustment - much smaller for Android bottom components
                  const platformMultiplier = Platform.OS === 'ios' ? 1.0 : (isInBottomHalf ? 0.5 : 0.9);

                  const finalSpacing = Math.max(baseSpacing, relativeSpacing) * edgeProximityFactor * platformMultiplier;

                  console.log('🔥 Advanced spacing calculation:', {
                    componentCenter,
                    screenCenter,
                    distanceFromCenter,
                    isInBottomHalf,
                    edgeProximityFactor,
                    baseSpacing,
                    relativeSpacing,
                    relativeSpacingPercent,
                    platformMultiplier,
                    finalSpacing
                  });

                  return finalSpacing;
                };
                // const POPUP_SPACING = getOptimalSpacing(componentY, componentHeight, windowHeight);
                // console.log('🔥 Optimal popup spacing calculated:', POPUP_SPACING, 'for componentHeight:', componentHeight, 'at Y:', componentY);

                // console.log('🔥 AutoPositionedPopup FINAL SPACE CHECK WITH SPACING:', {
                //   POPUP_SPACING,
                //   'usableSpaceAbove >= popupHeight + POPUP_SPACING': usableSpaceAbove >= popupHeight + POPUP_SPACING,
                //   'spaceBelow >= popupHeight + POPUP_SPACING': spaceBelow >= popupHeight + POPUP_SPACING,
                //   'usableSpaceAbove needed': popupHeight + POPUP_SPACING,
                //   'spaceBelow needed': popupHeight + POPUP_SPACING
                // });

                // FORCE ABOVE PRIORITY: If component is in bottom half, always try above first
                const isInBottomHalf = componentCenterY > visibleAreaCenter;

                // console.log('🔥 Position decision factors:', {
                //   isInBottomHalf,
                //   componentCenterY,
                //   visibleAreaCenter,
                //   'spaceBelow >= needed': spaceBelow >= popupHeight + POPUP_SPACING,
                //   'usableSpaceAbove >= needed': usableSpaceAbove >= popupHeight + POPUP_SPACING
                // });

                if (isInBottomHalf && usableSpaceAbove >= popupHeight ) {
                  // Component in bottom half + enough space above = FORCE ABOVE
                  showAbove = true;
                  finalY = componentY - popupHeight +componentHeight/2;
                  console.log('🔥 AutoPositionedPopup: FORCE ABOVE - bottom half component with enough space, finalY=', finalY);
                } else if (!isInBottomHalf && spaceBelow >= popupHeight ) {
                  // Component in top half + enough space below = show below
                  showAbove = false;
                  finalY = componentY + componentHeight*2;
                  console.log('🔥 AutoPositionedPopup: Showing below - top half component with enough space, finalY=', finalY);
                } else if (usableSpaceAbove >= popupHeight ) {
                  // Fallback: enough space above
                  showAbove = true;
                  finalY = componentY - popupHeight ;
                  console.log('🔥 AutoPositionedPopup: Showing above - enough space available (fallback), finalY=', finalY);
                } else if (spaceBelow >= popupHeight ) {
                  // Fallback: enough space below
                  showAbove = false;
                  finalY = componentY + componentHeight ;
                  console.log('🔥 AutoPositionedPopup: Showing below - enough space available (fallback), finalY=', finalY);
                } else {
                  // Emergency fallback: choose larger space
                  if (usableSpaceAbove >= spaceBelow) {
                    showAbove = true;
                    finalY = Math.max(statusBarHeight, componentY - popupHeight );
                    console.log('🔥 AutoPositionedPopup: Emergency above - larger space, finalY=', finalY);
                  } else {
                    showAbove = false;
                    finalY = componentY + componentHeight ;
                    console.log('🔥 AutoPositionedPopup: Emergency below - larger space, finalY=', finalY);
                  }
                }

                // Enhanced boundary check with detailed logging
                console.log('🔥 Pre-boundary check:', {
                  originalFinalY: finalY,
                  showAbove,
                  statusBarHeight,
                  windowHeight,
                  popupHeight,
                  'finalY < statusBarHeight': finalY < statusBarHeight,
                  'finalY + popupHeight > windowHeight': finalY + popupHeight > windowHeight
                });

                if (showAbove && finalY < statusBarHeight) {
                  const oldFinalY = finalY;
                  finalY = statusBarHeight;
                  console.log('🔥 BOUNDARY FIX: Above display adjusted for status bar:', oldFinalY, '->', finalY);
                }

                if (!showAbove && finalY + popupHeight > windowHeight) {
                  const oldFinalY = finalY;
                  finalY = windowHeight - popupHeight;
                  console.log('🔥 BOUNDARY FIX: Below display adjusted to fit window:', oldFinalY, '->', finalY);
                }

                // CRITICAL CHECK: Detect if boundary check is changing display direction
                if (showAbove && finalY + popupHeight > componentY ) {
                  console.log('🚨 WARNING: Above positioning may overlap with component!');
                }

                if (!showAbove && finalY < componentY + componentHeight ) {
                  console.log('🚨 WARNING: Below positioning may overlap with component!');
                }

                console.log('🔥 Post-boundary check final result:', {
                  finalY,
                  showAbove,
                  'popupTop': finalY,
                  'popupBottom': finalY + popupHeight,
                  'componentTop': componentY,
                  'componentBottom': componentY + componentHeight
                });

                return {finalY, showAbove};
              };

              // Calculate position ONCE based on actual popup height
              const actualPopupHeight = CustomPopView && CustomPopViewStyle && typeof CustomPopViewStyle.height === 'number'
                ? CustomPopViewStyle.height
                : listLayout.height;

              console.log('🔥 Using actualPopupHeight for calculation:', actualPopupHeight, 'CustomPopView:', !!CustomPopView);

              const positionResult = calculateOptimalPosition(y, height, actualPopupHeight);
              console.log('AutoPositionedPopup FINAL position result:', positionResult);

              ref_listPos.current = {x: x, y: positionResult.finalY, width: width};
              console.log('AutoPositionedPopup ref_listPos.current=', ref_listPos.current);

              if (CustomPopView && CustomPopViewStyle) {
                console.log('AutoPositionedPopup CustomPopViewStyle=', CustomPopViewStyle);
                // Position already calculated correctly above, no need to recalculate
                const PopViewComponent = CustomPopView();
                console.log('AutoPositionedPopup addRootView PopViewComponent=', PopViewComponent);
                console.log('AutoPositionedPopup addRootView state.selectedItem=', state.selectedItem);
                addRootView({
                  id: tag,
                  style: !centerDisplay
                    ? {
                      top: ref_listPos.current.y,
                      left: popUpViewStyle?.left,
                      width: popUpViewStyle?.width,
                      height: listLayout.height,
                      opacity: 1,
                      ...CustomPopViewStyle,
                    }
                    : {width: popUpViewStyle?.width, height: listLayout.height, ...CustomPopViewStyle},
                  component: <PopViewComponent selectedItem={state.selectedItem}></PopViewComponent>,
                  useModal: true,
                  onModalClose: () => {
                    console.log('AutoPositionedPopup onModalClose');
                    removeRootView(tag, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
                    setState((prevState) => {
                      return {
                        ...prevState,
                        isFocus: false,
                      };
                    });
                    hasAddedRootView.current = false;
                    hasShownRootView.current = false;
                    hasTriggeredFocus.current = false;
                    setSearchQuery('');
                  },
                  centerDisplay,
                });
              } else {
                console.log('AutoPositionedPopup addRootView tag=', tag);
                addRootView({
                  id: tag,
                  style: {
                    top: ref_listPos.current.y,
                    left: popUpViewStyle?.left,
                    width: popUpViewStyle?.width,
                    height: listLayout.height,
                    opacity: 1,
                  },
                  component: (
                    <AutoPositionedPopupList
                      tag={tag}
                      updateState={updateState}
                      fetchData={fetchData}
                      pageSize={pageSize}
                      renderItem={renderItem}
                      selectedItem={state.selectedItem}
                      localSearch={localSearch}
                      showListEmptyComponent={showListEmptyComponent}
                      emptyText={emptyText}
                    />
                  ),
                  useModal: true,
                  onModalClose: () => {
                    console.log('AutoPositionedPopup onModalClose tag=', tag);
                    removeRootView(tag, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
                    setState((prevState) => {
                      return {
                        ...prevState,
                      };
                    });
                    setSearchQuery('');
                  },
                });
              }
            });
          }
        }
        if (isKeyboardFullyShown) {
          ref_isFocus.current = state.isFocus ?? false;
          if (isKeyboardFullyShown !== keyboardVisibleRef.current) {
            keyboardVisibleRef.current = isKeyboardFullyShown;
            if (isKeyboardFullyShown && textInputRef.current) {
              if (ref_searchQuery.current) {
                textInputRef.current.setNativeProps({text: ref_searchQuery.current});
              }
            }
          }
        }
      }, [isKeyboardFullyShown,
        state.isFocus,
        useTextInput,
        CustomPopView,
        CustomPopViewStyle,
        forceRemoveAllRootViewOnItemSelected,
        tag,
        state.selectedItem,showListEmptyComponent
      ]);
      // Imperative handle for parent component access
      useImperativeHandle(
        parentRef,
        () => ({
          clearSelectedItem: () => {
            console.log('AutoPositionedPopup clearSelectedItem tag=', tag);
            setState((prevState) => {
              return {
                ...prevState,
                selectedItem: undefined,
              };
            });
          },
        }),
        []
      );
      const updateState = (key: string, value: SelectedItem) => {
        console.log('AutoPositionedPopup updateState key=', key, ' value=', value);
        setState((prevState) => ({
          ...prevState,
          [key]: value,
        }));
        if (key === 'selectedItem' && onItemSelected) {
          onItemSelected(value);
          console.log('AutoPositionedPopup updateState onItemSelected rootViewsRef.current=', rootViewsRef.current);
          removeRootView(tag, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
          hasAddedRootView.current = false;
          hasShownRootView.current = false;
          hasTriggeredFocus.current = false;
          setState((prevState) => {
            return {
              ...prevState,
              isFocus: false,
            };
          });
          setSearchQuery('');
        }
      };
      // Render the component following project implementation
      return useMemo(() => {
        console.log('AutoPositionedPopup render tag=', tag); // Now safe - circular dependency fixed
        return (
          <CustomRow>
            <View style={[styles.contain, style]} ref={refAutoPositionedPopup}>
              {!state.isFocus || !useTextInput ? (
                <TouchableOpacity
                  style={[styles.AutoPositionedPopupBtn, AutoPositionedPopupBtnStyle]}
                  disabled={AutoPositionedPopupBtnDisabled}
                  onPress={() => {
                    console.log('AutoPositionedPopup onPress tag=', tag);
                    console.log('AutoPositionedPopup onPress state.isFocus=', state.isFocus);
                    console.log('AutoPositionedPopup onPress useTextInput=', useTextInput);
                    console.log(
                      'AutoPositionedPopup onPress hasAddedRootView.current=',
                      hasAddedRootView.current
                    );
                    console.log(
                      'AutoPositionedPopup onPress hasShownRootView.current=',
                      hasShownRootView.current
                    );
                    console.log(
                      'AutoPositionedPopup onPress hasTriggeredFocus.current=',
                      hasTriggeredFocus.current
                    );
                    console.log('AutoPositionedPopup onPress state.selectedItem=', state.selectedItem);
                    setState((prevState) => {
                      return {
                        ...prevState,
                        isFocus: true,
                      };
                    });
                    if (!hasAddedRootView.current && useTextInput) {
                      hasAddedRootView.current = true;
                      hasShownRootView.current = false;
                      addRootView({
                        id: tag,
                        style: {
                          top: 0,
                          left: 0,
                          width: popUpViewStyle?.width,
                          height: listLayout.height,
                          opacity: 0,
                        },
                        component: (
                          <AutoPositionedPopupList
                            tag={tag}
                            updateState={updateState}
                            fetchData={fetchData}
                            pageSize={pageSize}
                            renderItem={renderItem}
                            selectedItem={state.selectedItem}
                            localSearch={localSearch}
                            showListEmptyComponent={showListEmptyComponent}
                            emptyText={emptyText}
                          />
                        ),
                        useModal: false,
                      });
                    }
                  }}
                >
                  {!btwChildren ? (
                    <Text
                      style={[
                        styles.searchQueryTxt,
                        state.selectedItem && {color: theme.colors.text},
                        labelStyle,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode={'tail'}
                    >
                      {state.selectedItem?.title || placeholder}
                    </Text>
                  ) : (
                    btwChildren()
                  )}
                </TouchableOpacity>
              ) : (
                useTextInput &&
                state.isFocus && (
                  <RNTextInput
                    ref={textInputRef}
                    key="fixed-textinput-key"
                    style={[
                      styles.inputStyle,
                      inputStyle,
                    ]}
                    textAlign={TextInputProps['textAlign'] || 'left'}
                    multiline={TextInputProps['multiline'] || false}
                    numberOfLines={TextInputProps['numberOfLines'] || 1}
                    onChangeText={(searchQuery) => {
                      ref_searchQuery.current = searchQuery;
                      console.log('AutoPositionedPopup onChangeText rootViews=', rootViews);
                      if (!localSearch) {
                        if (debounceTimerRef.current) {
                          clearTimeout(debounceTimerRef.current);
                        }
                        debounceTimerRef.current = setTimeout(() => {
                          emitQueryChange(ref_searchQuery.current);
                        }, 500);
                      } else {
                        emitQueryChange(ref_searchQuery.current);
                      }
                    }}
                    placeholderTextColor={theme.colors.placeholderText}
                    placeholder={placeholder}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Enter') {
                        Keyboard.dismiss();
                      }
                    }}
                    keyboardType={TextInputProps['keyboardType'] || 'default'}
                    clearButtonMode="while-editing"
                    returnKeyType={TextInputProps['returnKeyType'] || 'done'}
                    maxLength={TextInputProps['maxLength'] || 100}
                    accessibilityLabel="selectInput"
                    accessible={true}
                    autoFocus={TextInputProps['autoFocus'] || false}
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                    editable={TextInputProps['editable'] || true}
                    secureTextEntry={TextInputProps['secureTextEntry'] || false}
                    defaultValue=""
                    caretHidden={false}
                    enablesReturnKeyAutomatically
                    onFocus={() => {
                      console.log(
                        'AutoPositionedPopup onFocus tag=',
                        tag,
                        ' selectedItem=',
                        state.selectedItem,
                        ' hasTriggeredFocus.current=',
                        hasTriggeredFocus.current,
                        ' textInputRef.current=',
                        textInputRef.current,
                        ' ref_searchQuery.current=',
                        ref_searchQuery.current
                      );
                      if (!hasTriggeredFocus.current) {
                        hasTriggeredFocus.current = true;
                        ref_isFocus.current = true;
                        if (state.selectedItem) {
                          ref_searchQuery.current = state.selectedItem.title;
                        }
                        if (textInputRef.current && ref_searchQuery.current) {
                          textInputRef.current.setNativeProps({
                            text: ref_searchQuery.current,
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      console.log(
                        'AutoPositionedPopup onBlur tag=',
                        tag,
                        'textInputRef.current=',
                        textInputRef.current
                      );
                      hasTriggeredFocus.current = false;
                      hasAddedRootView.current = false; // 重置 RootView 狀態
                      hasShownRootView.current = false;
                      ref_isFocus.current = false;
                      setState((prevState) => {
                        return {
                          ...prevState,
                          isFocus: false,
                        };
                      });
                      removeRootView(tag, forceRemoveAllRootViewOnItemSelected);
                      setSearchQuery('');
                      if (textInputRef.current) {
                        textInputRef.current.setNativeProps({text: ''});
                        ref_searchQuery.current = '';
                        textInputRef.current.blur();
                      }
                      Keyboard.dismiss();
                    }}
                    selectTextOnFocus={TextInputProps['selectTextOnFocus'] || false}
                    onSubmitEditing={(e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
                      console.log(
                        'AutoPositionedPopup.tsx onSubmitEditing e.nativeEvent.text=',
                        e.nativeEvent.text
                      );
                      onSubmitEditing && onSubmitEditing(e);
                    }}
                  />
                )
              )}
            </View>
          </CustomRow>
        );
      }, [tag,
        fetchData,
        renderItem,
        onItemSelected,
        onSubmitEditing,
        localSearch,
        placeholder,
        textAlign,
        pageSize,
        selectedItem,
        CustomRow,
        useTextInput,
        btwChildren,
        selectedItem,
        keyExtractor,
        AutoPositionedPopupBtnStyle,
        CustomPopView,
        CustomPopViewStyle,
        forceRemoveAllRootViewOnItemSelected,
        inputStyle,
        TextInputProps,
        state.isFocus,showListEmptyComponent,emptyText]);
    }
  )
);

export default AutoPositionedPopup;
