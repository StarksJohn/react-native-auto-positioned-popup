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
      // console.log('AutoPositionedPopup.tsx ListItem=', {index, item, selectedItem});
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
  showListEmptyComponent?: boolean;
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
     pageSize, showListEmptyComponent, emptyText
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
    //   // Listen to TextInput events, refresh list when received, not dependent on global searchQuery
    //   // Sync the latest searchQuery to list-specific ref for _fetchData to use
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
      console.log('AutoPositionedPopupList _fetchData=', {pageIndex, pageSize: currentPageSize, 'state.localData': state.localData, 'ref_searchQuery.current': ref_searchQuery.current, localSearch});
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
      rootViewsRef, showListEmptyComponent, emptyText
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
        TextInputProps = {autoFocus: true},
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
        CustomPopView = undefined, CustomPopViewStyle, showListEmptyComponent = true, emptyText = ''
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
      // Add ref to track previous keyboard state to avoid false triggers during parent component re-renders
      const prevIsKeyboardFullyShownRef = useRef<boolean>(false);
      const prevPropsRef = useRef<{
        CustomPopView?: any;
        CustomPopViewStyle?: any;
        TextInputProps?: any;
      }>({});
      // Add ref to prevent onFocus/onBlur loop triggers during parent component re-renders
      const lastFocusTimeRef = useRef<number>(0);
      const isFocusEventProcessingRef = useRef<boolean>(false);
      // Add ref to stabilize TextInput props reference
      // Only update when deep comparison detects real changes to avoid TextInput recreation due to reference changes during parent component redraws
      const stableInputStyleRef = useRef<any>(inputStyle);
      const stableTextInputPropsRef = useRef<any>(TextInputProps);
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
        console.log(`AutoPositionedPopup componentDidMount=`, {tag, CustomPopView});
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
        console.log('AutoPositionedPopup useEffect [selectedItem, state.selectedItem, tag]=', {tag, selectedItem, 'state.selectedItem': state.selectedItem});
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
        // Detect if keyboard state has actually changed to avoid false triggers during parent component re-renders
        const keyboardStateChanged = prevIsKeyboardFullyShownRef.current !== isKeyboardFullyShown;
        const propsChanged =
          prevPropsRef.current.CustomPopView !== CustomPopView ||
          prevPropsRef.current.CustomPopViewStyle !== CustomPopViewStyle ||
          prevPropsRef.current.TextInputProps !== TextInputProps;
        console.log('AutoPositionedPopup useEffect [isKeyboardFullyShown,\n' +
          '        state.isFocus,\n' +
          '        useTextInput,\n' +
          '        CustomPopView,\n' +
          '        CustomPopViewStyle,\n' +
          '        forceRemoveAllRootViewOnItemSelected,\n' +
          '        tag, TextInputProps,\n' +
          '        state.selectedItem, showListEmptyComponent\n' +
          '      ]=', {
          tag,
          'state.isFocus': state.isFocus,
          isKeyboardFullyShown,
          'ref_isFocus.current': ref_isFocus.current,
          'ref_isKeyboardFullyShown.current': ref_isKeyboardFullyShown.current,
          useTextInput, TextInputProps,
          'hasAddedRootView.current': hasAddedRootView.current,
          'hasShownRootView.current': hasShownRootView.current,
          'keyboardStateChanged': keyboardStateChanged,
          'propsChanged': propsChanged
        });
        // Update ref to record current state
        prevIsKeyboardFullyShownRef.current = isKeyboardFullyShown;
        prevPropsRef.current = {
          CustomPopView,
          CustomPopViewStyle,
          TextInputProps
        };
        // Only execute logic when keyboard state actually changes or user actively operates
        if (!keyboardStateChanged  && hasAddedRootView.current) {
          console.log('AutoPositionedPopup: Skip execution - parent component re-rendered but keyboard state unchanged');
          // if (!ref_isFocus.current) {
          //   textInputRef.current?.focus()
          // }
          return;
        }
        if (useTextInput) {
          if (isKeyboardFullyShown && hasAddedRootView.current && !hasShownRootView.current && state.isFocus) {
            refAutoPositionedPopup.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
              console.log('AutoPositionedPopup useTextInput measureInWindow=', {x, y, width, height});
              // SIMPLE CENTER-BASED POSITIONING STRATEGY
              const screenHeight = Dimensions.get('screen').height;
              const screenCenter = screenHeight / 2;
              console.log('AutoPositionedPopup useTextInput measureInWindow =', {screenHeight, screenCenter, componentY: y});

              // Simple rule: if component Y > screen center, show popup above; otherwise show below
              if (y > screenCenter) {
                console.log('AutoPositionedPopup with keyboard: showing above (Y > center)');
                ref_listPos.current = {x: x, y: y - listLayout.height, width: width};
              } else {
                console.log('AutoPositionedPopup with keyboard: showing below (Y <= center)');
                ref_listPos.current = {x: x, y: y + height, width: width};
              }
              console.log('AutoPositionedPopup useTextInput ref_listPos.current=', ref_listPos.current);
              setRootViewNativeStyle(tag, {
                top: ref_listPos.current?.y,
                left: popUpViewStyle?.left,
                width: popUpViewStyle?.width,
                height: listLayout.height,
                opacity: 1,
              });
              hasShownRootView.current = true;
            });
          } else if (!isKeyboardFullyShown && ref_isFocus.current && keyboardStateChanged) {
            // Only execute close logic when keyboard state actually changes from true to false
            console.log(
              'AutoPositionedPopup isKeyboardFullyShown useEffect removeRootView (keyboard state changed)=',
              {tag, forceRemoveAllRootViewOnItemSelected, keyboardStateChanged}
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
              console.log('AutoPositionedPopup !useTextInput measureInWindow=', {x, y, width, height});
              // INTELLIGENT POSITION CALCULATION - MODIFIED VERSION WITH STATUS BAR SAFETY
              const calculateOptimalPosition = (componentY: number, componentHeight: number, popupHeight: number) => {
                console.log('AutoPositionedPopup 🔥🔥🔥 NEW CALCULATE OPTIMAL POSITION FUNCTION EXECUTING 🔥🔥🔥');

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
                console.log('AutoPositionedPopup 🔥 Cross-platform StatusBar height:', statusBarHeight, 'Platform:', Platform.OS);

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

                  console.log('AutoPositionedPopup 🔥 Advanced spacing calculation:', {
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

                if (isInBottomHalf && usableSpaceAbove >= popupHeight) {
                  // Component in bottom half + enough space above = FORCE ABOVE
                  showAbove = true;
                  finalY = componentY - popupHeight + componentHeight / 2;
                  console.log('AutoPositionedPopup 🔥 AutoPositionedPopup: FORCE ABOVE - bottom half component with enough space, finalY=', finalY);
                } else if (!isInBottomHalf && spaceBelow >= popupHeight) {
                  // Component in top half + enough space below = show below
                  showAbove = false;
                  finalY = componentY + componentHeight * 2;
                  console.log('🔥 AutoPositionedPopup: Showing below - top half component with enough space, finalY=', finalY);
                } else if (usableSpaceAbove >= popupHeight) {
                  // Fallback: enough space above
                  showAbove = true;
                  finalY = componentY - popupHeight;
                  console.log('🔥 AutoPositionedPopup: Showing above - enough space available (fallback), finalY=', finalY);
                } else if (spaceBelow >= popupHeight) {
                  // Fallback: enough space below
                  showAbove = false;
                  finalY = componentY + componentHeight;
                  console.log('🔥 AutoPositionedPopup: Showing below - enough space available (fallback), finalY=', finalY);
                } else {
                  // Emergency fallback: choose larger space
                  if (usableSpaceAbove >= spaceBelow) {
                    showAbove = true;
                    finalY = Math.max(statusBarHeight, componentY - popupHeight);
                    console.log('🔥 AutoPositionedPopup: Emergency above - larger space, finalY=', finalY);
                  } else {
                    showAbove = false;
                    finalY = componentY + componentHeight;
                    console.log('🔥 AutoPositionedPopup: Emergency below - larger space, finalY=', finalY);
                  }
                }

                // Enhanced boundary check with detailed logging
                console.log('AutoPositionedPopup 🔥 Pre-boundary check:', {
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
                  console.log('AutoPositionedPopup 🔥 BOUNDARY : Above display adjusted for status bar:', oldFinalY, '->', finalY);
                }

                if (!showAbove && finalY + popupHeight > windowHeight) {
                  const oldFinalY = finalY;
                  finalY = windowHeight - popupHeight;
                  console.log('AutoPositionedPopup 🔥 BOUNDARY : Below display adjusted to fit window:', oldFinalY, '->', finalY);
                }

                // CRITICAL CHECK: Detect if boundary check is changing display direction
                if (showAbove && finalY + popupHeight > componentY) {
                  console.log('AutoPositionedPopup 🚨 WARNING: Above positioning may overlap with component!');
                }

                if (!showAbove && finalY < componentY + componentHeight) {
                  console.log('AutoPositionedPopup 🚨 WARNING: Below positioning may overlap with component!');
                }

                console.log('AutoPositionedPopup 🔥 Post-boundary check final result:', {
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
              console.log('AutoPositionedPopup 🔥 Using actualPopupHeight for calculation:', {actualPopupHeight, CustomPopView: !!CustomPopView});
              const positionResult = calculateOptimalPosition(y, height, actualPopupHeight);
              console.log('AutoPositionedPopup FINAL position result:', positionResult);
              ref_listPos.current = {x: x, y: positionResult.finalY, width: width};
              console.log('AutoPositionedPopup !useTextInput ref_listPos.current=', ref_listPos.current);
              if (CustomPopView && CustomPopViewStyle) {
                // Position already calculated correctly above, no need to recalculate
                const PopViewComponent = CustomPopView();
                console.log('AutoPositionedPopup !useTextInput addRootView=', {CustomPopViewStyle, PopViewComponent, 'state.selectedItem': state.selectedItem});
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
                console.log('AutoPositionedPopup !useTextInput addRootView tag=', tag);
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
        tag, TextInputProps,
        state.selectedItem, showListEmptyComponent
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
        console.log('AutoPositionedPopup updateState=', {key, value});
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

      // Simple deep comparison function (for style objects only)
      const shallowEqual = (obj1: any, obj2: any): boolean => {
        if (obj1 === obj2) return true;
        if (!obj1 || !obj2) return false;
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
          if (obj1[key] !== obj2[key]) return false;
        }
        return true;
      };

      // Use useMemo to create stable props reference
      // Only update when deep comparison detects real changes to avoid TextInput recreation due to reference changes during parent component redraws
      const stableInputStyle = useMemo(() => {
        if (!shallowEqual(stableInputStyleRef.current, inputStyle)) {
          console.log(`AutoPositionedPopup inputStyle deep change detected, updating stable reference - tag: ${tag}`);
          stableInputStyleRef.current = inputStyle;
        }
        return stableInputStyleRef.current;
      }, [inputStyle, tag]);

      const stableTextInputProps = useMemo(() => {
        if (!shallowEqual(stableTextInputPropsRef.current, TextInputProps)) {
          console.log(`AutoPositionedPopup TextInputProps deep change detected, updating stable reference - tag: ${tag}`);
          stableTextInputPropsRef.current = TextInputProps;
        }
        return stableTextInputPropsRef.current;
      }, [TextInputProps, tag]);

      // Use useCallback to stabilize onFocus and onBlur callback references
      // Prevent creating new callback functions during parent component redraws to avoid TextInput re-triggering focus
      // Use ref to store latest state values to avoid adding frequently changing values to dependencies
      const stateRef = useRef(state);
      stateRef.current = state;

      const handleTextInputFocus = useCallback(() => {
        const currentTime = Date.now();
        const timeSinceLastFocus = currentTime - lastFocusTimeRef.current;
        console.log(
          'AutoPositionedPopup onFocus=',
          {
            tag,
            'state.selectedItem': stateRef.current.selectedItem,
            'hasTriggeredFocus.current=': hasTriggeredFocus.current,
            'textInputRef.current=': textInputRef.current,
            'ref_searchQuery.current=': ref_searchQuery.current,
            'timeSinceLastFocus': timeSinceLastFocus,
            'isKeyboardFullyShown': isKeyboardFullyShown,
            'isFocusEventProcessing': isFocusEventProcessingRef.current
          }
        );
        // Prevent rapid repeated triggers (repeated events within 300ms are ignored)
        if (timeSinceLastFocus < 300) {
          console.log('AutoPositionedPopup onFocus: Skip - event triggered too quickly (< 300ms)');
          return;
        }
        // Skip if keyboard is already open and focus has been handled
        if (isKeyboardFullyShown && hasTriggeredFocus.current) {
          console.log('AutoPositionedPopup onFocus: Skip - keyboard already open and focus handled');
          return;
        }
        // Prevent concurrent processing
        if (isFocusEventProcessingRef.current) {
          console.log('AutoPositionedPopup onFocus: Skip - processing another focus event');
          return;
        }
        isFocusEventProcessingRef.current = true;
        lastFocusTimeRef.current = currentTime;
        if (!hasTriggeredFocus.current) {
          hasTriggeredFocus.current = true;
          ref_isFocus.current = true;
          if (stateRef.current.selectedItem) {
            ref_searchQuery.current = stateRef.current.selectedItem.title;
          }
          if (textInputRef.current && ref_searchQuery.current) {
            textInputRef.current.setNativeProps({
              text: ref_searchQuery.current,
            });
          }
        }
        // Delay resetting processing flag to avoid blocking subsequent legitimate focus events
        setTimeout(() => {
          isFocusEventProcessingRef.current = false;
        }, 100);
      }, [tag, isKeyboardFullyShown]); // Remove state.selectedItem, use stateRef instead

      const handleTextInputBlur = useCallback(() => {
        console.log(
          'AutoPositionedPopup onBlur=',
          {
            tag,
            'textInputRef.current': textInputRef.current,
            'isKeyboardFullyShown': isKeyboardFullyShown,
            'hasTriggeredFocus.current': hasTriggeredFocus.current
          }
        );
        // If keyboard is still open, this is a false trigger caused by parent component re-render, should not reset
        if (isKeyboardFullyShown && hasTriggeredFocus.current) {
          console.log('AutoPositionedPopup onBlur: Skip - keyboard still open, possibly caused by parent component re-render');
          return;
        }

        // Only reset internal state, do not actively close keyboard
        // Keyboard will close naturally when TextInput loses focus, no need to manually call Keyboard.dismiss()
        hasTriggeredFocus.current = false;
        hasAddedRootView.current = false;
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
          // Remove textInputRef.current.blur() - avoid forcing blur causing keyboard to close
        }
        // Remove Keyboard.dismiss() - let keyboard close naturally to avoid triggering keyboardDidHide event
      }, [tag, isKeyboardFullyShown, forceRemoveAllRootViewOnItemSelected]);

      // Wrap TextInput independently in useMemo to recreate only when key props change
      // This avoids repeated ref callback triggers due to other props changes during parent component redraws
      const memoizedTextInput = useMemo(() => {
        console.log(`AutoPositionedPopup useMemo creating TextInput - tag: ${tag}, isFocus: ${state.isFocus}`);
        if (!useTextInput || !state.isFocus) {
          return null;
        }
        return (
          <RNTextInput
            ref={(ref) => {
              // Monitor TextInput mounting and unmounting
              if (ref && !textInputRef.current) {
                console.log(`AutoPositionedPopup TextInput created/mounted - tag: ${tag}, ref:`, ref);
              } else if (!ref && textInputRef.current) {
                console.log(`AutoPositionedPopup TextInput unmounted - tag: ${tag}`);
              } else if (ref && textInputRef.current && ref !== textInputRef.current) {
                console.log(`AutoPositionedPopup TextInput replaced - tag: ${tag}, oldRef:`, textInputRef.current, 'newRef:', ref);
              }
              textInputRef.current = ref;
            }}
            key={`textinput-${tag}`}
            style={[
              styles.inputStyle,
              stableInputStyle,
            ]}
            textAlign={stableTextInputProps['textAlign'] || 'left'}
            multiline={stableTextInputProps['multiline'] || false}
            numberOfLines={stableTextInputProps['numberOfLines'] || 1}
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
            keyboardType={stableTextInputProps['keyboardType'] || 'default'}
            clearButtonMode="while-editing"
            returnKeyType={stableTextInputProps['returnKeyType'] || 'done'}
            maxLength={stableTextInputProps['maxLength'] || 100}
            accessibilityLabel="selectInput"
            accessible={true}
            autoFocus={stableTextInputProps['autoFocus'] || false}
            autoCorrect={false}
            underlineColorAndroid="transparent"
            editable={stableTextInputProps['editable'] || true}
            secureTextEntry={stableTextInputProps['secureTextEntry'] || false}
            defaultValue=""
            caretHidden={false}
            enablesReturnKeyAutomatically
            onFocus={handleTextInputFocus}
            onBlur={handleTextInputBlur}
            selectTextOnFocus={stableTextInputProps['selectTextOnFocus'] || false}
            onSubmitEditing={(e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
              console.log(
                'AutoPositionedPopup.tsx onSubmitEditing e.nativeEvent.text=',
                e.nativeEvent.text
              );
              onSubmitEditing && onSubmitEditing(e);
            }}
          />
        );
      }, [
        tag, // tag 是稳定的
        useTextInput, // useTextInput 是稳定的
        state.isFocus, // isFocus 控制显示/隐藏
        handleTextInputFocus, // useCallback wrapped, reference stable
        handleTextInputBlur, // useCallback wrapped, reference stable
        stableInputStyle, // Use stable inputStyle reference (after deep comparison)
        stableTextInputProps, // Use stable TextInputProps reference (after deep comparison)
        placeholder, // placeholder usually stable
        onSubmitEditing, // onSubmitEditing usually stable
        // No longer use original inputStyle and TextInputProps, use stable references instead
        // Stable references only update when deep comparison detects actual content changes, avoiding frequent TextInput recreation during parent component redraws
      ]);

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
                    console.log('AutoPositionedPopup onPress=', {
                      tag,
                      'state.isFocus': state.isFocus,
                      useTextInput,
                      'hasAddedRootView.current': hasAddedRootView.current,
                      'hasShownRootView.current': hasShownRootView.current,
                      'hasTriggeredFocus.current': hasTriggeredFocus.current,
                      'state.selectedItem': state.selectedItem
                    });
                    setState((prevState) => {
                      return {
                        ...prevState,
                        isFocus: true,
                      };
                    });
                    if (!hasAddedRootView.current && useTextInput) {
                      // TextInput version: hide first, show after keyboard is fully displayed
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
                    console.log('AutoPositionedPopup onPress done')
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
                memoizedTextInput
              )}
            </View>
          </CustomRow>
        );
      }, [
        tag,
        // ✅ CRITICAL FIX: Remove all props that may change frequently or are inline functions
        // Changes to these props should not cause the entire component tree to recreate, especially TextInput
        // fetchData,  // ❌ Removed: inline function
        // renderItem,  // ❌ Removed: possibly inline function
        // onItemSelected,  // ❌ Removed: possibly inline function
        // onSubmitEditing,  // ❌ Removed: possibly inline function
        localSearch,
        // placeholder,  // ❌ Removed: may change
        // textAlign,  // ❌ Removed: may change
        pageSize,
        selectedItem,
        // CustomRow,  // ❌ Removed: inline function, new reference each time
        useTextInput,
        // btwChildren,  // ❌ Removed: inline function
        // keyExtractor,  // ❌ Removed: possibly inline function
        // AutoPositionedPopupBtnStyle,  // ❌ Removed: possibly inline object
        // CustomPopView,  // ❌ Removed: may change
        // CustomPopViewStyle,  // ❌ Removed: may change
        forceRemoveAllRootViewOnItemSelected,
        state.isFocus,
        showListEmptyComponent,
        emptyText,
        // ✅ Removed most dependencies that may cause re-rendering, keeping only core dependencies that truly affect component structure
        // This prevents TextInput recreation due to inline functions/objects during parent component redraws
      ]);
    }
  )
);

export default AutoPositionedPopup;
