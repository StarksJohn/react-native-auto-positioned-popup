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
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore - Skip type checking for third-party library with type issues
import {AdvancedFlatList as AdvancedFlatListLib} from 'react-native-advanced-flatlist';
// @ts-ignore - Direct import from source when using fake data
import AdvancedFlatListSource from 'react-native-advanced-flatlist/src/AdvancedFlatList.tsx';
import {TextInputSubmitEditingEventData} from 'react-native/Libraries/Components/TextInput/TextInput';
import {LayoutRectangle, NativeSyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {AutoPositionedPopupProps, Data, SelectedItem} from './AutoPositionedPopupProps';
import styles from './AutoPositionedPopup.style';
import {useRootView} from './RootViewContext';
import {useKeyboardStatus} from './KeyboardManager';
import {useSafeAreaInsets} from "react-native-safe-area-context";

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
      // console.log('AutoPositionedPopup.tsx ListItem item=', item);
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
     pageSize,
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
                              }: {
      pageIndex: number;
      pageSize: number;
    }): Promise<Data | null> => {
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
          pageSize,
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
        return Promise.resolve(res);
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
      // Choose AdvancedFlatList version based on global.$fake
      const AdvancedFlatListComponent = (global as any)?.$fake ? AdvancedFlatListSource : AdvancedFlatListLib;

      return (
        <View style={[styles.baseModalView, styles.autoPositionedPopupList]}>
          {/* @ts-ignore - Type assertion to bypass third-party library type issues */}
          <AdvancedFlatListComponent
            style={[{borderRadius: 0}]}
            {...(ref_list && { ref: ref_list })}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps={'always'}
            {...({ fetchData: _fetchData })}
            renderItem={renderItem || _renderItem}
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
      rootViewsRef,
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
const AutoPositionedPopup: MemoExoticComponent<
  ForwardRefExoticComponent<AutoPositionedPopupProps>
> = memo(
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
        CustomPopView = undefined, CustomPopViewStyle
      } = props;
      // State management similar to project implementation
      const [state, setState] = useState<StateProps>({
        isFocus: false,
        selectedItem: selectedItem,
      });
      // Use RootView context
      const {addRootView, setRootViewNativeStyle, removeRootView, rootViews, setSearchQuery} = useRootView();
      const insets = useSafeAreaInsets();
      const rootViewsRef = useRef(rootViews);
      // Track TextInput focus and RootView states like project implementation
      const hasTriggeredFocus = useRef(false);
      const hasAddedRootView = useRef(false);
      const hasShownRootView = useRef(false);
      // Additional refs for keyboard and position tracking
      const ref_isFocus = useRef<boolean>();
      const ref_isKeyboardFullyShown = useRef<boolean>();
      const ref_listPos: MutableRefObject<any> = useRef<LayoutRectangle>()
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
              // SIMPLE CENTER-BASED POSITIONING STRATEGY
              const screenHeight = Dimensions.get('screen').height;
              const screenCenter = screenHeight / 2;
              console.log('AutoPositionedPopup screenHeight=', screenHeight, ' screenCenter=', screenCenter, ' componentY=', y);

              // Simple rule: if component Y > screen center, show popup above; otherwise show below
              if (y+insets. top > screenCenter) {
                console.log('AutoPositionedPopup: showing above (Y > center)');
                ref_listPos.current = {x: x, y: y - listLayout.height, width: width};
              } else {
                console.log('AutoPositionedPopup: showing below (Y <= center)');
                ref_listPos.current = {x: x, y: y + height+insets.top, width: width};
              }
              console.log('AutoPositionedPopup ref_listPos.current=', ref_listPos.current);
              if (CustomPopView && CustomPopViewStyle) {
                console.log('AutoPositionedPopup CustomPopViewStyle=', CustomPopViewStyle);
                // Ensure CustomPopViewStyle.height is a number before using it in calculations
                const customHeight =
                  typeof CustomPopViewStyle.height === 'number' ? CustomPopViewStyle.height : listLayout.height;

                // Apply same simple center-based strategy for CustomPopView
                console.log('AutoPositionedPopup CustomPopView using center-based positioning, customHeight=', customHeight);

                // Simple rule: if component Y > screen center, show popup above; otherwise show below
                if (y > screenCenter) {
                  console.log('AutoPositionedPopup CustomPopView: showing above (Y > center), tag=', tag);
                  ref_listPos.current = {x: x, y: y - customHeight, width: width};
                } else {
                  console.log('AutoPositionedPopup CustomPopView: showing below (Y <= center), tag=', tag);
                  ref_listPos.current = {x: x, y: y + height, width: width};
                }
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
          ref_isFocus.current = state.isFocus;
          if (isKeyboardFullyShown !== keyboardVisibleRef.current) {
            keyboardVisibleRef.current = isKeyboardFullyShown;
            if (isKeyboardFullyShown && textInputRef.current) {
              if (ref_searchQuery.current) {
                textInputRef.current.setNativeProps({text: ref_searchQuery.current});
              }
            }
          }
        }
      }, [insets,
        isKeyboardFullyShown,
        state.isFocus,
        useTextInput,
        CustomPopView,
        CustomPopViewStyle,
        forceRemoveAllRootViewOnItemSelected,
        tag,
        state.selectedItem,
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
        state.isFocus,]);
    }
  )
);

export default AutoPositionedPopup;
