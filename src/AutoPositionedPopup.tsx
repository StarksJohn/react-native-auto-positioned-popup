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
  findNodeHandle,
  Keyboard,
  Platform,
  StatusBar,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  UIManager,
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
  themeMode?: string | null | undefined;
}> = memo(
  ({
     updateState,
     item,
     index,
     selectedItem, themeMode
   }: {
    updateState: (key: string, value: SelectedItem) => void;
    item: SelectedItem;
    index: number;
    selectedItem?: SelectedItem;
    themeMode?: string | null | undefined;
  }): React.JSX.Element => {
    const {addRootView, setRootViewNativeStyle, removeRootView, rootViews} = useRootView();
    const rootViewsRef = useRef(rootViews);
    useEffect(() => {
      rootViewsRef.current = rootViews;
    }, [rootViews]);
    return useMemo(() => {
      // console.log('AutoPositionedPopup.tsx ListItem=', {index, item, selectedItem});
      const isSelected = item.id === selectedItem?.id || item.title == selectedItem?.title;
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.commonModalRow,
            {backgroundColor: isSelected ? (themeMode === 'light' ? 'rgba(116, 116, 128, 0.08)' : 'rgba(120, 120, 128, 0.36)') : 'transparent'},
          ]}
          onPress={() => {
            // console.log('AutoPositionedPopup.tsx ListItem onPress item=', item); // Commented to prevent spam
            // console.log('AutoPositionedPopup.tsx ListItem onPress rootViews=', rootViewsRef.current); // Commented to prevent spam
            updateState('selectedItem', item);
          }}
        >
          <Text style={(themeMode === 'light' ? styles.ListItemCode : {...styles.ListItemCode, color: '#fff'})} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    }, [updateState, item, index, selectedItem, rootViewsRef, themeMode]);
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
  themeMode?: string | null | undefined;
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
     pageSize, showListEmptyComponent, emptyText, themeMode
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
          return `${item.title}`?.toLowerCase().includes(ref_searchQuery.current.toLowerCase());
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
        return <ListItem item={item} index={index} updateState={_updateState} selectedItem={state.selectedItem} themeMode={themeMode} />;
      },
      [state.selectedItem, themeMode]
    );
    return useMemo(() => {
      console.log('AutoPositionedPopupList (global as any)?.$fake=', (global as any)?.$fake);
      // Babel configuration handles the path redirection based on global.$fake
      // No need for conditional import here
      return (
        <View style={[styles.baseModalView, styles.autoPositionedPopupList, {backgroundColor: themeMode === 'light' ? '#fff' : 'rgba(44, 44, 46, 1)',}]}>
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
      rootViewsRef, showListEmptyComponent, emptyText, themeMode
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
        TextInputProps,//= {autoFocus: true},
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
        // textAlign = 'right',
        CustomPopView = undefined, CustomPopViewStyle, showListEmptyComponent = true, emptyText = '', onChangeText, themeMode = 'light',
        parentScrollViewRef, scrollExtraHeight = 100,
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
      const ref_listPos: MutableRefObject<any> = useRef<LayoutRectangle | undefined>(undefined)
      const keyboardVisibleRef = useRef(false);
      const refAutoPositionedPopup = useRef<View>(null);
      const ref_searchQuery = useRef<string>('');
      // Store trigger button position when clicked (before it's replaced by TextInput)
      const triggerPositionRef = useRef<{x: number; y: number; width: number; height: number} | null>(null);
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
      // IMPORTANT: Use a separate ref for the actual trigger button to get accurate position
      // The outer View with flex:1/height:100% may report incorrect positions in complex layouts
      const triggerBtnRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
      const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
      const searchQueryRef = useRef<string>(''); // Use ref instead of state to avoid re-renders
      // Refs to store latest values for useEffect without adding to dependency array
      const dataRef = useRef<SelectedItem[]>(data);
      const isKeyboardFullyShown = useKeyboardStatus();
      const ref_isKeyboardFullyShown = useRef<boolean>(isKeyboardFullyShown);
      useEffect(() => {
        ref_isKeyboardFullyShown.current = isKeyboardFullyShown;
      }, [isKeyboardFullyShown])
      const theme = defaultTheme;

      /**
       * Scrolls the parent KeyboardAwareScrollView to make the trigger button visible
       * when keyboard appears and may cover the trigger.
       * Uses the triggerBtnRef to measure position and scrolls parent accordingly.
       */
      const scrollParentToTrigger = useCallback(() => {
        if (!parentScrollViewRef?.current || !triggerBtnRef.current) {
          console.log('AutoPositionedPopup scrollParentToTrigger: No parentScrollViewRef or triggerBtnRef available');
          return;
        }

        // Use scrollToFocusedInput method from KeyboardAwareScrollView
        // This method scrolls the ScrollView to make the specified node visible
        const scrollView = parentScrollViewRef.current;
        const nodeHandle = findNodeHandle(triggerBtnRef.current);

        if (nodeHandle && scrollView) {
          console.log('AutoPositionedPopup scrollParentToTrigger: Scrolling to trigger button with extraHeight=', scrollExtraHeight);

          // KeyboardAwareScrollView has a scrollToFocusedInput method that handles this
          // However, it requires a ReactNode. We'll use scrollToPosition as an alternative.
          // First, measure the trigger button position relative to the ScrollView
          triggerBtnRef.current.measureInWindow((x, y, width, height) => {
            if (y === undefined || height === undefined) {
              console.log('AutoPositionedPopup scrollParentToTrigger: measureInWindow returned undefined');
              return;
            }

            console.log('AutoPositionedPopup scrollParentToTrigger: trigger position=', { x, y, width, height });

            // Get keyboard height from Keyboard API
            // On keyboard show, scroll to position that keeps trigger above keyboard
            Keyboard.addListener('keyboardDidShow', (event) => {
              const keyboardHeight = event.endCoordinates.height;
              const screenHeight = Dimensions.get('window').height;

              // Calculate if trigger is below keyboard
              const triggerBottom = y + height;
              const visibleAreaBottom = screenHeight - keyboardHeight;

              console.log('AutoPositionedPopup scrollParentToTrigger: keyboard data=', {
                keyboardHeight,
                screenHeight,
                triggerBottom,
                visibleAreaBottom,
                needsScroll: triggerBottom > visibleAreaBottom
              });

              if (triggerBottom > visibleAreaBottom) {
                // Calculate how much to scroll
                const scrollAmount = triggerBottom - visibleAreaBottom + scrollExtraHeight;
                console.log('AutoPositionedPopup scrollParentToTrigger: scrolling by', scrollAmount);

                // Use scrollForExtraHeightOnAndroid or scrollToPosition
                if (typeof scrollView.scrollToPosition === 'function') {
                  // scrollToPosition(x, y, animated)
                  scrollView.scrollToPosition(0, scrollAmount, true);
                } else if (typeof scrollView.scrollToEnd === 'function') {
                  // Fallback: scroll to end might help in some cases
                  console.log('AutoPositionedPopup scrollParentToTrigger: using scrollToEnd fallback');
                }
              }
            });
          });
        }
      }, [parentScrollViewRef, scrollExtraHeight]);

      /**
       * Scroll parent KeyboardAwareScrollView to keep trigger visible above keyboard
       * Uses stored trigger position (captured before TextInput replaces the trigger button)
       */
      const scrollToTriggerWithMeasure = useCallback(() => {
        console.log('AutoPositionedPopup scrollToTriggerWithMeasure called, tag=', tag, {
          hasParentScrollViewRef: !!parentScrollViewRef?.current,
          hasTriggerPosition: !!triggerPositionRef.current,
          triggerPosition: triggerPositionRef.current
        });

        if (!parentScrollViewRef?.current) {
          console.log('AutoPositionedPopup scrollToTriggerWithMeasure: parentScrollViewRef not available, tag=', tag);
          return;
        }

        // Use stored trigger position (captured when trigger was clicked)
        const storedPosition = triggerPositionRef.current;
        if (!storedPosition) {
          console.log('AutoPositionedPopup scrollToTriggerWithMeasure: no stored trigger position, tag=', tag);
          return;
        }

        const scrollView = parentScrollViewRef.current;
        const { y: triggerY, height: triggerHeight } = storedPosition;

        // Get keyboard height and screen dimensions
        const screenHeight = Dimensions.get('window').height;

        // Calculate keyboard height (approximate - keyboard typically takes 40-50% of screen on Android)
        // We'll use the trigger position to determine if scrolling is needed
        const keyboardApproxHeight = screenHeight * 0.4; // Conservative estimate
        const visibleAreaBottom = screenHeight - keyboardApproxHeight;
        const triggerBottom = triggerY + triggerHeight;

        console.log('AutoPositionedPopup scrollToTriggerWithMeasure: calculations=', {
          tag,
          triggerY,
          triggerHeight,
          triggerBottom,
          screenHeight,
          visibleAreaBottom,
          needsScroll: triggerBottom > visibleAreaBottom
        });

        // Check if trigger is below the visible area (covered by keyboard)
        if (triggerBottom > visibleAreaBottom) {
          // Calculate scroll amount to bring trigger above keyboard
          const scrollAmount = triggerBottom - visibleAreaBottom + scrollExtraHeight;
          console.log('AutoPositionedPopup scrollToTriggerWithMeasure: scrolling, amount=', scrollAmount, 'tag=', tag);

          // Use scrollForExtraHeightOnAndroid for KeyboardAwareScrollView
          if (typeof scrollView.scrollForExtraHeightOnAndroid === 'function') {
            scrollView.scrollForExtraHeightOnAndroid(scrollAmount);
          } else if (typeof scrollView.scrollToPosition === 'function') {
            scrollView.scrollToPosition(0, scrollAmount, true);
          } else if ('scrollTo' in scrollView && typeof (scrollView as any).scrollTo === 'function') {
            // Fallback to standard ScrollView method
            (scrollView as any).scrollTo({ y: scrollAmount, animated: true });
          } else {
            console.log('AutoPositionedPopup scrollToTriggerWithMeasure: no scroll method available on scrollView');
          }
        } else {
          console.log('AutoPositionedPopup scrollToTriggerWithMeasure: trigger already visible, no scroll needed, tag=', tag);
        }
      }, [parentScrollViewRef, scrollExtraHeight, tag]);

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
        console.log('AutoPositionedPopup rootViews=', {tag, rootViews});
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
        if (state.selectedItem?.id !== selectedItem?.id || state.selectedItem?.title != selectedItem?.title) {
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
          (prevPropsRef.current.TextInputProps !== TextInputProps && useTextInput);
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
          'propsChanged': propsChanged,
          'prevPropsRef.current.CustomPopView !== CustomPopView': prevPropsRef.current.CustomPopView !== CustomPopView,
          'prevPropsRef.current.CustomPopViewStyle !== CustomPopViewStyle': prevPropsRef.current.CustomPopViewStyle !== CustomPopViewStyle,
          'prevPropsRef.current.TextInputProps !== TextInputProps': prevPropsRef.current.TextInputProps !== TextInputProps
        });
        // Update ref to record current state
        prevIsKeyboardFullyShownRef.current = isKeyboardFullyShown;
        prevPropsRef.current = {
          CustomPopView,
          CustomPopViewStyle,
          TextInputProps
        };
        // Only execute logic when keyboard state actually changes or user actively operates
        if (!keyboardStateChanged && hasAddedRootView.current) {
          console.log('AutoPositionedPopup: Skip execution - parent component re-rendered but keyboard state unchanged textInputRef.current=', textInputRef.current);
          // if (!ref_isFocus.current) {
          //   textInputRef.current?.focus()
          // }
          return;
        }
        const getStatusBarHeight = (): number => {
          if (Platform.OS === 'android') {
            // Android: Use StatusBar.currentHeight API
            return StatusBar.currentHeight || 24; // Fallback to 24 if undefined
          } else {
            // iOS: Calculate from screen vs window height difference
            const {height: screenHeightFull} = Dimensions.get('screen');
            const {height: windowHeight} = Dimensions.get('window');
            return screenHeightFull - windowHeight; // Safe area top (status bar)
          }
        };
        // Get accurate status bar height for both iOS and Android
        const statusBarHeight = getStatusBarHeight();
        if (useTextInput) {
          if (isKeyboardFullyShown && hasAddedRootView.current && !hasShownRootView.current && state.isFocus) {
            // KEYBOARD AVOIDANCE FIX: Scroll parent ScrollView to keep trigger visible
            // When keyboard appears, the trigger button may be covered. If parentScrollViewRef
            // is provided, scroll the parent to keep the trigger visible above the keyboard.
            if (parentScrollViewRef?.current) {
              console.log('AutoPositionedPopup: Keyboard appeared, scrolling parent to keep trigger visible');
              // Use a slight delay to ensure keyboard animation has started
              setTimeout(() => {
                scrollToTriggerWithMeasure();
              }, 100);
            }

            // CRITICAL FIX FOR KEYBOARD POSITION CALCULATION
            // Problem: When keyboard appears, the page shifts up but measureInWindow executes too early
            // Solution: Wait for keyboard animation (300ms) + use requestAnimationFrame for next render frame
            //
            // Timing breakdown:
            // 1. Keyboard animation: ~250-300ms (iOS/Android)
            // 2. Page shift animation: ~200-300ms (KeyboardAvoidingView)
            // 3. Layout tree update: ~50-100ms (React Native)
            // Total: ~500-700ms needed for stable layout
            //
            // Strategy: setTimeout(300ms) waits for most animations to complete,
            // then requestAnimationFrame ensures measurement happens after next render frame
            setTimeout(() => {
              requestAnimationFrame(() => {
                // CRITICAL FIX: Use triggerBtnRef (the actual TouchableOpacity) for measurement
                // instead of refAutoPositionedPopup (the outer View with flex:1/height:100%)
                const measureTarget = triggerBtnRef.current || refAutoPositionedPopup.current;
                measureTarget?.measureInWindow((x: number | undefined, y: number | undefined, width: number | undefined, height: number | undefined) => {
                  console.log('AutoPositionedPopup useTextInput measureInWindow (after 300ms + RAF, layout stable)=', {x, y, width, height, usingTriggerRef: !!triggerBtnRef.current});
                  // CRITICAL FIX: Handle undefined values from measureInWindow
                  // This can happen during navigation transitions or when view is not yet mounted
                  if (x === undefined || y === undefined || width === undefined || height === undefined) {
                    console.warn('AutoPositionedPopup useTextInput: measureInWindow returned undefined values, using fallback position');
                    const screenHeightFallback = Dimensions.get('window').height;
                    const screenWidthFallback = Dimensions.get('window').width;
                    const fallbackY = (screenHeightFallback - listLayout.height) / 2;
                    const fallbackX = screenWidthFallback * 0.05;
                    const fallbackWidth = screenWidthFallback * 0.9;
                    x = fallbackX;
                    y = fallbackY;
                    width = fallbackWidth;
                    height = 50;
                  }
                  // CRITICAL FIX: Coordinate system mismatch issue
                  // Problem: measureInWindow returns coordinates relative to window (fixed reference),
                  // but popup uses absolute positioning relative to App container (which shifts when keyboard appears)
                  //
                  // When keyboard appears:
                  // 1. measureInWindow returns y relative to window (e.g., y=400 after shifting)
                  // 2. But popup's absolute positioning is relative to App container
                  // 3. If App container shifted up by 200px, setting top=200 will display at window.y=0 (wrong!)
                  //
                  // Solution: Since popup is rendered at root level and uses absolute positioning,
                  // we should directly use measureInWindow's y value without additional calculations
                  // The popup container is at the same level as the page content
                  const screenHeight = Dimensions.get('window').height; // Use window height, not screen
                  console.log('AutoPositionedPopup useTextInput positioning data=', {
                    screenHeight,
                    componentY: y,
                    componentHeight: height,
                    listHeight: listLayout.height
                  });
                  // FIXED POSITIONING LOGIC (with keyboard):
                  // measureInWindow returns coordinates relative to the window (screen)
                  // The popup uses position: 'absolute' relative to RootViewProvider
                  // So we should NOT add statusBarHeight to the position calculation
                  //
                  // 1. Default: show popup ABOVE the input field
                  // Position popup so that the trigger remains VISIBLE below the popup
                  // Use (y + height * 0.7) as reference to compensate for measurement offset
                  // while still leaving trigger visible (30% of trigger height exposed)
                  let popupY = y + (height * 0.7) - listLayout.height;

                  console.log('AutoPositionedPopup with keyboard: initial calculation for ABOVE position:', {
                    componentY: y,
                    componentHeight: height,
                    popupHeight: listLayout.height,
                    popupY,
                    popupBottom: popupY + listLayout.height,
                    triggerTop: y,
                    statusBarHeight
                  });

                  // 2. Check if showing above would go behind status bar
                  if (popupY < statusBarHeight) {
                    console.log('AutoPositionedPopup with keyboard: would go behind status bar, showing BELOW instead');
                    // Show BELOW the input field
                    // Since y + height represents the trigger's "reference bottom" (accounting for measurement offset),
                    // we need to add another height to position popup BELOW the actual trigger
                    popupY = y + height + height;
                    console.log('AutoPositionedPopup with keyboard: BELOW position calculated:', {
                      formula: 'y + 2*height',
                      y,
                      height,
                      popupY
                    });

                    // 3. Also check if showing below would go off the bottom
                    const maxY = screenHeight - listLayout.height;
                    if (popupY > maxY) {
                      // If both positions are problematic, clamp to visible area
                      console.log('AutoPositionedPopup with keyboard: both positions problematic, clamping to visible area');
                      popupY = Math.min(Math.max(statusBarHeight, y - listLayout.height), maxY);
                    }
                  } else {
                    console.log('AutoPositionedPopup with keyboard: showing ABOVE input field (preferred position)');
                  }
                  ref_listPos.current = {x: x, y: popupY, width: width};
                  console.log('AutoPositionedPopup useTextInput final position=', ref_listPos.current);
                  setRootViewNativeStyle(tag, {
                    top: ref_listPos.current?.y,
                    left: popUpViewStyle?.left,
                    width: popUpViewStyle?.width,
                    height: listLayout.height,
                    opacity: 1,
                  });
                  hasShownRootView.current = true;
                });
              });
            }, 300) // 300ms is sufficient for keyboard animation, as proven by user testing (even 3000ms didn't fix wrong logic)
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
            if (isKeyboardFullyShown) {
              Keyboard.dismiss();
              return;
            }
            // CRITICAL FIX: Use triggerBtnRef (the actual TouchableOpacity) for measurement
            // instead of refAutoPositionedPopup (the outer View with flex:1/height:100%)
            // This ensures accurate position when component is inside complex layouts like KeyboardAwareScrollView
            const measureTarget = triggerBtnRef.current || refAutoPositionedPopup.current;
            measureTarget?.measureInWindow((x: number | undefined, y: number | undefined, width: number | undefined, height: number | undefined) => {
              console.log('AutoPositionedPopup !useTextInput measureInWindow=', {x, y, width, height, usingTriggerRef: !!triggerBtnRef.current});
              // CRITICAL FIX: Handle undefined values from measureInWindow
              // This can happen during navigation transitions or when view is not yet mounted
              if (x === undefined || y === undefined || width === undefined || height === undefined) {
                console.warn('AutoPositionedPopup: measureInWindow returned undefined values, using fallback position');
                // Use screen center as fallback position
                const screenHeight = Dimensions.get('window').height;
                const screenWidth = Dimensions.get('window').width;
                const fallbackY = (screenHeight - listLayout.height) / 2;
                const fallbackX = screenWidth * 0.05; // 5% from left
                const fallbackWidth = screenWidth * 0.9; // 90% width
                ref_listPos.current = { x: fallbackX, y: fallbackY, width: fallbackWidth };
                console.log('AutoPositionedPopup !useTextInput using fallback position=', ref_listPos.current);
                // Proceed with fallback values
                x = fallbackX;
                y = fallbackY;
                width = fallbackWidth;
                height = 50; // Default height for the trigger element
              }
              // CORRECT POSITIONING LOGIC (as per user requirement)
              // Default: show popup ABOVE the input field
              // Only if that goes off the top of screen (considering status bar), show BELOW instead
              const calculateOptimalPosition = (componentY: number, componentHeight: number, popupHeight: number) => {
                console.log('AutoPositionedPopup calculateOptimalPosition executing');
                // Use window height (visible area) instead of screen height
                const screenHeight = Dimensions.get('window').height;
                console.log('AutoPositionedPopup positioning data:', {
                  screenHeight,
                  componentY,
                  componentHeight,
                  popupHeight,
                  statusBarHeight,
                  platform: Platform.OS
                });
                // FIXED POSITIONING LOGIC:
                // The popup uses position: 'absolute' relative to the RootViewProvider container
                // measureInWindow returns coordinates relative to the window (screen)
                // So we should NOT add statusBarHeight to the position calculation
                //
                // 1. Default: show popup ABOVE the trigger element
                // FIX: Use (componentY + componentHeight) as the trigger's bottom edge reference point
                // This compensates for measurement inaccuracies when trigger is inside complex layouts (FlatList, ScrollView)
                // The popup's bottom should be at the trigger's top with minimal gap (≤5px)
                // Formula: popup_top = trigger_bottom - componentHeight - popupHeight
                //          popup_bottom = trigger_bottom - componentHeight = trigger_top
                let popupY = componentY + componentHeight - popupHeight;

                console.log('AutoPositionedPopup: initial calculation for ABOVE position:', {
                  componentY,
                  componentHeight,
                  popupHeight,
                  popupY,
                  triggerBottom: componentY + componentHeight,
                  statusBarHeight
                });

                // 2. Check if showing above would go off the top of screen (behind status bar)
                if (popupY < statusBarHeight) {
                  console.log('AutoPositionedPopup: would go behind status bar, showing BELOW instead');
                  // Show BELOW the trigger element
                  // Since componentY + componentHeight represents the trigger's "reference bottom" (accounting for measurement offset),
                  // we need to add another componentHeight to position popup BELOW the actual trigger
                  // Formula: popup top = componentY + (2 * componentHeight)
                  //   - (componentY + componentHeight) = trigger's actual top (compensated)
                  //   - + componentHeight = skip past trigger height to get to trigger's actual bottom
                  popupY = componentY + componentHeight + componentHeight;
                  console.log('AutoPositionedPopup: BELOW position calculated:', {
                    formula: 'componentY + 2*componentHeight',
                    componentY,
                    componentHeight,
                    popupY
                  });

                  // 3. Also check if showing below would go off the bottom of screen
                  const maxY = screenHeight - popupHeight;
                  if (popupY > maxY) {
                    // If both positions are problematic, clamp to visible area
                    // Prioritize showing as close to trigger as possible
                    console.log('AutoPositionedPopup: both positions problematic, clamping to visible area');
                    popupY = Math.min(Math.max(statusBarHeight, componentY - popupHeight), maxY);
                  }
                } else {
                  console.log('AutoPositionedPopup: showing ABOVE input field (preferred position)');
                }
                console.log('AutoPositionedPopup final position:', {
                  popupY,
                  'showing above': popupY < componentY,
                  'below status bar': popupY >= statusBarHeight
                });
                return {finalY: popupY, showAbove: popupY < componentY};
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
                      themeMode={themeMode}
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
        state.selectedItem, showListEmptyComponent, themeMode
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
                selectedItem: undefined, isFocus: false,
              };
            });
            ref_searchQuery.current = '';
            hasTriggeredFocus.current = false;
            hasAddedRootView.current = false;
            hasShownRootView.current = false;
            ref_isFocus.current = false;
            removeRootView(tag, forceRemoveAllRootViewOnItemSelected);
            setSearchQuery('');
            if (textInputRef.current) {
              textInputRef.current.setNativeProps({text: ''});
            }
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
          console.log(`AutoPositionedPopup stableInputStyle: `, {tag, inputStyle, themeMode});
          stableInputStyleRef.current = inputStyle;
        }
        return stableInputStyleRef.current;
      }, [inputStyle, tag, themeMode]);

      const stableTextInputProps = useMemo(() => {
        if (!shallowEqual(stableTextInputPropsRef.current, TextInputProps)) {
          console.log(`AutoPositionedPopup TextInputProps deep change detected, updating stable reference - tag: ${tag}`);
          stableTextInputPropsRef.current = TextInputProps;
        }
        console.log('AutoPositionedPopup stableTextInputProps=', {tag, TextInputProps, 'stableTextInputPropsRef.current': stableTextInputPropsRef.current})
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
            ref_searchQuery.current = `${stateRef.current.selectedItem.title}`;
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
        console.log('AutoPositionedPopup memoizedTextInput=', {tag, useTextInput, 'state.isFocus': state.isFocus, stableTextInputProps});
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
              (themeMode==='dark' && {color:'#fff'})
            ]}
            textAlign={stableTextInputProps && stableTextInputProps['textAlign'] || 'left'}
            multiline={stableTextInputProps && stableTextInputProps['multiline'] || false}
            numberOfLines={stableTextInputProps && stableTextInputProps['numberOfLines'] || 1}
            onChangeText={(searchQuery) => {
              ref_searchQuery.current = searchQuery;
              console.log('AutoPositionedPopup onChangeText rootViews=', rootViews);
              if (!localSearch) {
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                  emitQueryChange(ref_searchQuery.current);
                  onChangeText && onChangeText(ref_searchQuery.current)
                }, 500);
              } else {
                emitQueryChange(ref_searchQuery.current);
                onChangeText && onChangeText(ref_searchQuery.current)
              }
            }}
            placeholderTextColor={stableTextInputProps && stableTextInputProps['placeholderTextColor'] || theme.colors.placeholderText}
            placeholder={placeholder}
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'Enter') {
                Keyboard.dismiss();
              }
            }}
            keyboardType={stableTextInputProps && stableTextInputProps['keyboardType'] || 'default'}
            clearButtonMode="while-editing"
            returnKeyType={stableTextInputProps && stableTextInputProps['returnKeyType'] || 'done'}
            maxLength={stableTextInputProps && stableTextInputProps['maxLength'] || 100}
            accessibilityLabel="selectInput"
            accessible={true}
            autoFocus={stableTextInputProps && stableTextInputProps['autoFocus'] || true}
            autoCorrect={false}
            underlineColorAndroid="transparent"
            editable={stableTextInputProps && stableTextInputProps['editable'] || true}
            secureTextEntry={stableTextInputProps && stableTextInputProps['secureTextEntry'] || false}
            defaultValue=""
            caretHidden={false}
            enablesReturnKeyAutomatically
            onFocus={handleTextInputFocus}
            onBlur={handleTextInputBlur}
            selectTextOnFocus={stableTextInputProps && stableTextInputProps['selectTextOnFocus'] || false}
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
                  ref={triggerBtnRef}
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
                      'selectedItem': selectedItem,
                      'ref_isKeyboardFullyShown.current': ref_isKeyboardFullyShown.current
                    });

                    // Capture trigger button position BEFORE switching to TextInput
                    // This is critical because triggerBtnRef will become null after isFocus=true
                    if (triggerBtnRef.current && parentScrollViewRef?.current) {
                      triggerBtnRef.current.measureInWindow((x, y, width, height) => {
                        console.log('AutoPositionedPopup onPress: captured trigger position=', {tag, x, y, width, height});
                        triggerPositionRef.current = {x, y, width, height};
                      });
                    }

                    if (useTextInput) {
                      const _addRootView = () => {
                        if (!hasAddedRootView.current) {
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
                                selectedItem={selectedItem}
                                localSearch={localSearch}
                                showListEmptyComponent={showListEmptyComponent}
                                emptyText={emptyText}
                                themeMode={themeMode}
                              />
                            ),
                            useModal: false,
                          });
                        }
                      }
                      if (ref_isKeyboardFullyShown.current) {
                        Keyboard.dismiss();
                        setTimeout(() => {
                          setState((prevState) => {
                            return {
                              ...prevState,
                              isFocus: true,
                            };
                          });
                          _addRootView()
                        }, 500);
                      } else {
                        setState((prevState) => {
                          return {
                            ...prevState,
                            isFocus: true,
                          };
                        });
                        _addRootView()
                      }
                    } else {
                      setState((prevState) => {
                        return {
                          ...prevState,
                          isFocus: true,
                        };
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
