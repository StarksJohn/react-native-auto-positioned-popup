// Module load marker - unique ID for tracking code version
// DEBUG FLAG: Set to false to disable all console logs for better performance
const POPUP_DEBUG = false;
const debugLog = (...args: any[]) => {
  if (POPUP_DEBUG) {
    console.log(...args);
  }
};

// Only log module load in debug mode
debugLog('POPUP_MODULE_V17_LOADED at ' + new Date().toISOString());

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
  debugLog('AutoPositionedPopup.tsx emitQueryChange query=', query, ' listeners=', queryChangeListeners.length);
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
      // debugLog('AutoPositionedPopup.tsx ListItem=', {index, item, selectedItem});
      const isSelected = item.id === selectedItem?.id || item.title == selectedItem?.title;
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.commonModalRow,
            {backgroundColor: isSelected ? (themeMode === 'light' ? 'rgba(116, 116, 128, 0.08)' : 'rgba(120, 120, 128, 0.36)') : 'transparent'},
          ]}
          onPress={() => {
            // debugLog('AutoPositionedPopup.tsx ListItem onPress item=', item); // Commented to prevent spam
            // debugLog('AutoPositionedPopup.tsx ListItem onPress rootViews=', rootViewsRef.current); // Commented to prevent spam
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
      debugLog(`AutoPositionedPopupList componentDidMount`);
      //componentWillUnmount
      return () => {
        debugLog(`AutoPositionedPopupList componentWillUnmount`);
        setSearchQuery('');
      };
    }, []);
    useEffect(() => {
      const unsubscribe = subscribeQueryChange((newQuery: string) => {
        debugLog('AutoPositionedPopupList useEffect subscribeQueryChange newQuery=', newQuery);
        ref_searchQuery.current = newQuery;
        if (ref_list.current) {
          ref_list.current.scrollToTop();
          ref_list.current.refresh();
        }
      });
      return unsubscribe;
    }, []);
    const _updateState = (key: string, value: SelectedItem) => {
      debugLog('AutoPositionedPopupList _updateState key=', key, ' value=', value);
      setState((prevState) => ({
        ...prevState,
        [key]: value,
      }));
      debugLog('AutoPositionedPopupList _updateState rootViews=', rootViewsRef.current);
      updateState(key, value);
    };
    const _fetchData = async ({
                                pageIndex,
                                pageSize: currentPageSize,
                              }: FetchDataParams): Promise<ListData | null> => {
      debugLog('AutoPositionedPopupList _fetchData=', {pageIndex, pageSize: currentPageSize, 'state.localData': state.localData, 'ref_searchQuery.current': ref_searchQuery.current, localSearch});
      if (localSearch && state.localData.length > 0) {
        const result: SelectedItem[] = state.localData.filter((item: SelectedItem) => {
          return `${item.title}`?.toLowerCase().includes(ref_searchQuery.current.toLowerCase());
        });
        debugLog('AutoPositionedPopupList _fetchData localSearch result=', result);
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
        debugLog('AutoPositionedPopupList _fetchData res=', res);
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
        debugLog('Error in fetchData:', e);
      }
      debugLog('AutoPositionedPopupList _fetchData res=', null);
      return null;
    };
    const _renderItem = useCallback(
      ({item, index}: { item: SelectedItem; index: number }) => {
        return <ListItem item={item} index={index} updateState={_updateState} selectedItem={state.selectedItem} themeMode={themeMode} />;
      },
      [state.selectedItem, themeMode]
    );
    return useMemo(() => {
      debugLog('AutoPositionedPopupList (global as any)?.$fake=', (global as any)?.$fake);
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
      debugLog('AutoPositionedPopup props=', props);
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
            // debugLog('${NAME} xxx res=', res)
            // res.items = res1
            // res.needLoadMore = res1.length === pageSize
          } catch (e) {
            debugLog('Error in fetch operation:', e);
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
      const {addRootView, setRootViewNativeStyle, updateRootView, removeRootView, rootViews, setSearchQuery} = useRootView();
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
          debugLog('AutoPositionedPopup scrollParentToTrigger: No parentScrollViewRef or triggerBtnRef available');
          return;
        }

        // Use scrollToFocusedInput method from KeyboardAwareScrollView
        // This method scrolls the ScrollView to make the specified node visible
        const scrollView = parentScrollViewRef.current;
        const nodeHandle = findNodeHandle(triggerBtnRef.current);

        if (nodeHandle && scrollView) {
          debugLog('AutoPositionedPopup scrollParentToTrigger: Scrolling to trigger button with extraHeight=', scrollExtraHeight);

          // KeyboardAwareScrollView has a scrollToFocusedInput method that handles this
          // However, it requires a ReactNode. We'll use scrollToPosition as an alternative.
          // First, measure the trigger button position relative to the ScrollView
          triggerBtnRef.current.measureInWindow((x, y, width, height) => {
            if (y === undefined || height === undefined) {
              debugLog('AutoPositionedPopup scrollParentToTrigger: measureInWindow returned undefined');
              return;
            }

            debugLog('AutoPositionedPopup scrollParentToTrigger: trigger position=', { x, y, width, height });

            // Get keyboard height from Keyboard API
            // On keyboard show, scroll to position that keeps trigger above keyboard
            Keyboard.addListener('keyboardDidShow', (event) => {
              const keyboardHeight = event.endCoordinates.height;
              const screenHeight = Dimensions.get('window').height;

              // Calculate if trigger is below keyboard
              const triggerBottom = y + height;
              const visibleAreaBottom = screenHeight - keyboardHeight;

              debugLog('AutoPositionedPopup scrollParentToTrigger: keyboard data=', {
                keyboardHeight,
                screenHeight,
                triggerBottom,
                visibleAreaBottom,
                needsScroll: triggerBottom > visibleAreaBottom
              });

              if (triggerBottom > visibleAreaBottom) {
                // Calculate how much to scroll
                const scrollAmount = triggerBottom - visibleAreaBottom + scrollExtraHeight;
                debugLog('AutoPositionedPopup scrollParentToTrigger: scrolling by', scrollAmount);

                // Use scrollForExtraHeightOnAndroid or scrollToPosition
                if (typeof scrollView.scrollToPosition === 'function') {
                  // scrollToPosition(x, y, animated)
                  scrollView.scrollToPosition(0, scrollAmount, true);
                } else if (typeof scrollView.scrollToEnd === 'function') {
                  // Fallback: scroll to end might help in some cases
                  debugLog('AutoPositionedPopup scrollParentToTrigger: using scrollToEnd fallback');
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
        debugLog('AutoPositionedPopup scrollToTriggerWithMeasure called, tag=', tag, {
          hasParentScrollViewRef: !!parentScrollViewRef?.current,
          hasTriggerPosition: !!triggerPositionRef.current,
          triggerPosition: triggerPositionRef.current
        });

        if (!parentScrollViewRef?.current) {
          debugLog('AutoPositionedPopup scrollToTriggerWithMeasure: parentScrollViewRef not available, tag=', tag);
          return;
        }

        // Use stored trigger position (captured when trigger was clicked)
        const storedPosition = triggerPositionRef.current;
        if (!storedPosition) {
          debugLog('AutoPositionedPopup scrollToTriggerWithMeasure: no stored trigger position, tag=', tag);
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

        debugLog('AutoPositionedPopup scrollToTriggerWithMeasure: calculations=', {
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
          debugLog('AutoPositionedPopup scrollToTriggerWithMeasure: scrolling, amount=', scrollAmount, 'tag=', tag);

          // Use scrollForExtraHeightOnAndroid for KeyboardAwareScrollView
          if (typeof scrollView.scrollForExtraHeightOnAndroid === 'function') {
            scrollView.scrollForExtraHeightOnAndroid(scrollAmount);
          } else if (typeof scrollView.scrollToPosition === 'function') {
            scrollView.scrollToPosition(0, scrollAmount, true);
          } else if ('scrollTo' in scrollView && typeof (scrollView as any).scrollTo === 'function') {
            // Fallback to standard ScrollView method
            (scrollView as any).scrollTo({ y: scrollAmount, animated: true });
          } else {
            debugLog('AutoPositionedPopup scrollToTriggerWithMeasure: no scroll method available on scrollView');
          }
        } else {
          debugLog('AutoPositionedPopup scrollToTriggerWithMeasure: trigger already visible, no scroll needed, tag=', tag);
        }
      }, [parentScrollViewRef, scrollExtraHeight, tag]);

      /**
       * componentDidMount && componentWillUnmount
       */
      useEffect(() => {
        (async () => {
        })();
        debugLog(`AutoPositionedPopup componentDidMount=`, {tag, CustomPopView});
        //componentWillUnmount
        return () => {
          debugLog(`AutoPositionedPopup componentWillUnmount tag=`, tag);
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
        debugLog('AutoPositionedPopup rootViews=', {tag, rootViews});
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
        debugLog('AutoPositionedPopup useEffect [selectedItem, state.selectedItem, tag]=', {tag, selectedItem, 'state.selectedItem': state.selectedItem});
        debugLog('AutoPositionedPopup useEffect state.selectedItem=', state.selectedItem);
        if (state.selectedItem?.id !== selectedItem?.id || state.selectedItem?.title != selectedItem?.title) {
          debugLog('AutoPositionedPopup useEffect selectedItem!=state.selectedItem');
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
        debugLog('AutoPositionedPopup useEffect [isKeyboardFullyShown,\n' +
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
        // CRITICAL FIX: Also allow execution when popup needs initial positioning
        // hasAddedRootView.current = true means popup container exists
        // hasShownRootView.current = false means positioning not done yet
        // We MUST allow execution when popup needs positioning, even if keyboard state unchanged
        if (!keyboardStateChanged && hasAddedRootView.current && hasShownRootView.current) {
          debugLog('AutoPositionedPopup: Skip execution - already positioned and keyboard state unchanged');
          return;
        }

        // Log when we're allowing execution for initial positioning
        if (!keyboardStateChanged && hasAddedRootView.current && !hasShownRootView.current) {
          debugLog('AutoPositionedPopup: ALLOWING execution for initial positioning (popup added but not positioned yet)');
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
              debugLog('AutoPositionedPopup: Keyboard appeared, scrolling parent to keep trigger visible');
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
                // CRITICAL FIX: Measure CURRENT position AFTER keyboard animation completes
                // DO NOT use stored triggerPositionRef because keyboard may have shifted the view up
                // Instead, measure the outer wrapper (refAutoPositionedPopup)
                // which reflects the ACTUAL current position after keyboard shift

                // DEBUG: Log both refs to compare their positions
                debugLog('AutoPositionedPopup DEBUG: refs status=', {
                  hasTextInputRef: !!textInputRef.current,
                  hasRefAutoPositionedPopup: !!refAutoPositionedPopup.current,
                });

                // Measure BOTH refs for comparison
                if (textInputRef.current && refAutoPositionedPopup.current) {
                  textInputRef.current.measureInWindow((tx: number | undefined, ty: number | undefined, tw: number | undefined, th: number | undefined) => {
                    debugLog('AutoPositionedPopup DEBUG: textInputRef position=', {x: tx, y: ty, width: tw, height: th});
                  });
                  refAutoPositionedPopup.current.measureInWindow((rx: number | undefined, ry: number | undefined, rw: number | undefined, rh: number | undefined) => {
                    debugLog('AutoPositionedPopup DEBUG: refAutoPositionedPopup position=', {x: rx, y: ry, width: rw, height: rh});
                  });
                }

                // CRITICAL FIX: Use textInputRef as primary measurement target
                // refAutoPositionedPopup.measureInWindow() returns undefined values
                // because the outer wrapper View uses flex:1/height:100% which makes it unmeasurable
                // textInputRef reliably returns the actual position of the input field
                const measureTarget = textInputRef.current || refAutoPositionedPopup.current;

                if (!measureTarget) {
                  debugLog('AutoPositionedPopup useTextInput: no measureTarget available, using fallback');
                  const screenHeightFallback = Dimensions.get('window').height;
                  const screenWidthFallback = Dimensions.get('window').width;
                  const fallbackY = (screenHeightFallback - listLayout.height) / 2;
                  ref_listPos.current = {x: screenWidthFallback * 0.05, y: fallbackY, width: screenWidthFallback * 0.9};
                  updateRootView(tag, {
                    style: {
                      top: ref_listPos.current?.y,
                      left: popUpViewStyle?.left,
                      width: popUpViewStyle?.width,
                      height: listLayout.height,
                      opacity: 1,
                    }
                  });
                  hasShownRootView.current = true;
                  return;
                }

                // Determine which ref is actually being used (for logging)
                const usingTextInputRef = measureTarget === textInputRef.current;
                debugLog('AutoPositionedPopup useTextInput: using measureTarget=', usingTextInputRef ? 'textInputRef' : 'refAutoPositionedPopup');

                // Measure CURRENT position (after keyboard shifted the view)
                measureTarget.measureInWindow((x: number | undefined, y: number | undefined, width: number | undefined, height: number | undefined) => {
                  debugLog('AutoPositionedPopup useTextInput: measured position for positioning=', {
                    x, y, width, height,
                    measureTarget: usingTextInputRef ? 'textInputRef' : 'refAutoPositionedPopup'
                  });

                  // Handle undefined values (can happen during navigation transitions)
                  if (x === undefined || y === undefined || width === undefined || height === undefined) {
                    debugLog('AutoPositionedPopup useTextInput: measureInWindow returned undefined, using fallback');
                    const screenHeightFallback = Dimensions.get('window').height;
                    const screenWidthFallback = Dimensions.get('window').width;
                    const fallbackY = (screenHeightFallback - listLayout.height) / 2;
                    x = screenWidthFallback * 0.05;
                    y = fallbackY;
                    width = screenWidthFallback * 0.9;
                    height = 50;
                  }

                  // Calculate screen height and popup position
                  const screenHeight = Dimensions.get('window').height;
                  debugLog('AutoPositionedPopup useTextInput positioning data=', {
                    screenHeight,
                    componentY: y,
                    componentHeight: height,
                    listHeight: listLayout.height
                  });

                  // POSITIONING LOGIC (with keyboard):
                  // Simple rule: popup must TOUCH the trigger with NO GAP
                  // 1. Default: show ABOVE trigger (popup bottom touches trigger top)
                  // 2. If ABOVE would overlap status bar: show BELOW (popup top touches trigger bottom)

                  debugLog('AutoPositionedPopup POSITIONING:', {
                    triggerY: y,
                    triggerHeight: height,
                    triggerBottom: y + height,
                    popupHeight: listLayout.height,
                    screenHeight,
                    statusBarHeight
                  });

                  // 1. Default: show popup ABOVE the trigger
                  // Popup has internal padding (12px from autoPositionedPopupList style)
                  // To make popup CONTENT touch trigger (not container), add padding offset
                  // Container bottom at y + POPUP_PADDING, content bottom at y (no gap)
                  const POPUP_PADDING = 12;
                  let popupY = y - listLayout.height + POPUP_PADDING;
                  let position = 'ABOVE';

                  debugLog('AutoPositionedPopup: trying ABOVE position:', {
                    popupY,
                    popupBottom: popupY + listLayout.height,
                    contentBottom: popupY + listLayout.height - POPUP_PADDING,
                    triggerTop: y,
                    paddingOffset: POPUP_PADDING,
                    wouldOverlapStatusBar: popupY < statusBarHeight
                  });

                  // 2. If showing ABOVE would go behind status bar, show BELOW instead
                  if (popupY < statusBarHeight) {
                    // Show BELOW: popup top at trigger bottom
                    // Use trigger's measured height as buffer to account for row padding
                    // The TextInput is only part of the trigger row - row height scales with trigger height
                    const BELOW_BUFFER = height;
                    popupY = y + height + BELOW_BUFFER;
                    position = 'BELOW';

                    debugLog('AutoPositionedPopup: using BELOW position (ABOVE overlaps status bar):', {
                      popupY,
                      triggerBottom: y + height,
                      buffer: BELOW_BUFFER,
                      actualGap: BELOW_BUFFER
                    });

                    // 3. Safety check: if BELOW would go off screen bottom, clamp it
                    const maxY = screenHeight - listLayout.height;
                    if (popupY > maxY) {
                      popupY = maxY;
                      debugLog('AutoPositionedPopup: clamped to screen bottom:', { popupY, maxY });
                    }
                  } else {
                    debugLog('AutoPositionedPopup: using ABOVE position (preferred)');
                  }

                  debugLog('AutoPositionedPopup FINAL POSITION:', { position, popupY, touchesTrigger: true });

                  ref_listPos.current = {x: x, y: popupY, width: width};
                  debugLog('AutoPositionedPopup useTextInput final position=', ref_listPos.current);

                  // Use updateRootView instead of setRootViewNativeStyle for more reliable style updates
                  // setNativeProps may not work correctly when initial style is in an array
                  const newStyle = {
                    top: ref_listPos.current?.y,
                    left: popUpViewStyle?.left,
                    width: popUpViewStyle?.width,
                    height: listLayout.height,
                    opacity: 1,
                  };
                  debugLog('AutoPositionedPopup useTextInput: applying new style via updateRootView=', newStyle);
                  updateRootView(tag, {style: newStyle});
                  hasShownRootView.current = true;
                });
              });
            }, 300) // 300ms is sufficient for keyboard animation, as proven by user testing (even 3000ms didn't fix wrong logic)
          } else if (!isKeyboardFullyShown && ref_isFocus.current && keyboardStateChanged) {
            // Only execute close logic when keyboard state actually changes from true to false
            debugLog(
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
          // V17 SIMPLIFICATION: When useTextInput=false, ALWAYS show popup in CENTER of screen
          // User request: "只要传入的 useTextInput 是 false, 弹框都显示在屏幕中间"
          // This avoids all complex positioning calculations that kept failing
          if (state.isFocus) {
            if (isKeyboardFullyShown) {
              Keyboard.dismiss();
              return;
            }

            debugLog('🟢🟢🟢 POPUP_V17 useTextInput=false, showing popup in CENTER of screen');

            const actualPopupHeight = CustomPopView && CustomPopViewStyle && typeof CustomPopViewStyle.height === 'number'
              ? CustomPopViewStyle.height
              : listLayout.height;

            if (CustomPopView && CustomPopViewStyle) {
              const PopViewComponent = CustomPopView();
              debugLog('🔵🔵🔵 POPUP_V17 CustomPopView centerDisplay=true');
              addRootView({
                id: tag,
                style: { width: popUpViewStyle?.width, ...CustomPopViewStyle },
                component: <PopViewComponent selectedItem={state.selectedItem}></PopViewComponent>,
                useModal: true,
                centerDisplay: true, // V17: Force center display for useTextInput=false
                onModalClose: () => {
                  debugLog('AutoPositionedPopup V17 onModalClose tag=', tag);
                  removeRootView(tag, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
                  setState((prevState) => ({ ...prevState }));
                  setSearchQuery('');
                },
              });
            } else {
              debugLog('🔵🔵🔵 POPUP_V17 List centerDisplay=true, height=', listLayout.height);
              addRootView({
                id: tag,
                style: { width: popUpViewStyle?.width, height: listLayout.height, opacity: 1 },
                component: (
                  <AutoPositionedPopupList
                    tag={tag} updateState={updateState} fetchData={fetchData} pageSize={pageSize}
                    renderItem={renderItem} selectedItem={state.selectedItem} localSearch={localSearch}
                    showListEmptyComponent={showListEmptyComponent} emptyText={emptyText} themeMode={themeMode}
                  />
                ),
                useModal: true,
                centerDisplay: true, // V17: Force center display for useTextInput=false
                onModalClose: () => {
                  debugLog('AutoPositionedPopup V17 onModalClose tag=', tag);
                  removeRootView(tag, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
                  setState((prevState) => ({ ...prevState }));
                  setSearchQuery('');
                },
              });
            }
            return; // V17: Early return after handling !useTextInput case
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

    // V16: All positioning logic is now in the useEffect above (calculateOptimalPosition + processPosition)
    // V16 FIX: Capture position in onPress callback BEFORE setState is called
    // This ensures triggerPositionRef.current is set when useEffect runs
    // Formula: top = componentY - popupHeight (popup bottom touches trigger top exactly)
    debugLog('🟢 POPUP_MODULE_V16_LOADED - capturing position in onPress callback before setState');

    // Imperative handle for parent component access
    useImperativeHandle(
        parentRef,
        () => ({
          clearSelectedItem: () => {
            debugLog('AutoPositionedPopup clearSelectedItem tag=', tag);
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
        debugLog('AutoPositionedPopup updateState=', {key, value});
        setState((prevState) => ({
          ...prevState,
          [key]: value,
        }));
        if (key === 'selectedItem' && onItemSelected) {
          onItemSelected(value);
          debugLog('AutoPositionedPopup updateState onItemSelected rootViewsRef.current=', rootViewsRef.current);
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
          debugLog(`AutoPositionedPopup stableInputStyle: `, {tag, inputStyle, themeMode});
          stableInputStyleRef.current = inputStyle;
        }
        return stableInputStyleRef.current;
      }, [inputStyle, tag, themeMode]);

      const stableTextInputProps = useMemo(() => {
        if (!shallowEqual(stableTextInputPropsRef.current, TextInputProps)) {
          debugLog(`AutoPositionedPopup TextInputProps deep change detected, updating stable reference - tag: ${tag}`);
          stableTextInputPropsRef.current = TextInputProps;
        }
        debugLog('AutoPositionedPopup stableTextInputProps=', {tag, TextInputProps, 'stableTextInputPropsRef.current': stableTextInputPropsRef.current})
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
        debugLog(
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
          debugLog('AutoPositionedPopup onFocus: Skip - event triggered too quickly (< 300ms)');
          return;
        }
        // Skip if keyboard is already open and focus has been handled
        if (isKeyboardFullyShown && hasTriggeredFocus.current) {
          debugLog('AutoPositionedPopup onFocus: Skip - keyboard already open and focus handled');
          return;
        }
        // Prevent concurrent processing
        if (isFocusEventProcessingRef.current) {
          debugLog('AutoPositionedPopup onFocus: Skip - processing another focus event');
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
        debugLog(
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
          debugLog('AutoPositionedPopup onBlur: Skip - keyboard still open, possibly caused by parent component re-render');
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
        debugLog('AutoPositionedPopup memoizedTextInput=', {tag, useTextInput, 'state.isFocus': state.isFocus, stableTextInputProps});
        if (!useTextInput || !state.isFocus) {
          return null;
        }
        return (
          <RNTextInput
            ref={(ref) => {
              // Monitor TextInput mounting and unmounting
              if (ref && !textInputRef.current) {
                debugLog(`AutoPositionedPopup TextInput created/mounted - tag: ${tag}, ref:`, ref);
              } else if (!ref && textInputRef.current) {
                debugLog(`AutoPositionedPopup TextInput unmounted - tag: ${tag}`);
              } else if (ref && textInputRef.current && ref !== textInputRef.current) {
                debugLog(`AutoPositionedPopup TextInput replaced - tag: ${tag}, oldRef:`, textInputRef.current, 'newRef:', ref);
              }
              textInputRef.current = ref;
            }}
            key={`textinput-${tag}`}
            style={[
              styles.inputStyle,
              stableInputStyle,
              (themeMode==='dark' && {color:'#fff'}),
            ]}
            textAlign={stableTextInputProps && stableTextInputProps['textAlign'] || 'left'}
            multiline={stableTextInputProps && stableTextInputProps['multiline'] || false}
            numberOfLines={stableTextInputProps && stableTextInputProps['numberOfLines'] || 1}
            onChangeText={(searchQuery) => {
              ref_searchQuery.current = searchQuery;
              debugLog('AutoPositionedPopup onChangeText rootViews=', rootViews);
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
              debugLog(
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
        debugLog('AutoPositionedPopup render tag=', tag); // Now safe - circular dependency fixed
        return (
          <CustomRow>
            <View style={[styles.contain, style]} ref={refAutoPositionedPopup}>
              {!state.isFocus || !useTextInput ? (
                <TouchableOpacity
                  ref={triggerBtnRef}
                  style={[styles.AutoPositionedPopupBtn, AutoPositionedPopupBtnStyle]}
                  disabled={AutoPositionedPopupBtnDisabled}
                  onPress={() => {
                    debugLog('AutoPositionedPopup onPress=', {
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
                    // IMPORTANT: Always capture position regardless of parentScrollViewRef
                    if (triggerBtnRef.current) {
                      triggerBtnRef.current.measureInWindow((x, y, width, height) => {
                        debugLog('AutoPositionedPopup onPress: captured trigger position=', {tag, x, y, width, height});
                        if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {
                          triggerPositionRef.current = {x, y, width, height};
                        }
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
                      // V17 SIMPLIFICATION: For useTextInput=false, popup will be centered
                      // No need for complex position measurement - just trigger focus
                      debugLog('🔵🔵🔵 POPUP_V17 onPress useTextInput=false, will show centered popup');
                      setState((prevState) => {
                        return {
                          ...prevState,
                          isFocus: true,
                        };
                      });
                    }
                    debugLog('AutoPositionedPopup onPress done')
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
        // �?CRITICAL FIX: Remove all props that may change frequently or are inline functions
        // Changes to these props should not cause the entire component tree to recreate, especially TextInput
        // fetchData,  // �?Removed: inline function
        // renderItem,  // �?Removed: possibly inline function
        // onItemSelected,  // �?Removed: possibly inline function
        // onSubmitEditing,  // �?Removed: possibly inline function
        localSearch,
        // placeholder,  // �?Removed: may change
        // textAlign,  // �?Removed: may change
        pageSize,
        selectedItem,
        // CustomRow,  // �?Removed: inline function, new reference each time
        useTextInput,
        // btwChildren,  // �?Removed: inline function
        // keyExtractor,  // �?Removed: possibly inline function
        // AutoPositionedPopupBtnStyle,  // �?Removed: possibly inline object
        // CustomPopView,  // �?Removed: may change
        // CustomPopViewStyle,  // �?Removed: may change
        forceRemoveAllRootViewOnItemSelected,
        state.isFocus,
        showListEmptyComponent,
        emptyText,
        // �?Removed most dependencies that may cause re-rendering, keeping only core dependencies that truly affect component structure
        // This prevents TextInput recreation due to inline functions/objects during parent component redraws
      ]);
    }
  )
);

export default AutoPositionedPopup;
