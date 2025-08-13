import React, {
  ForwardedRef,
  forwardRef,
  ForwardRefExoticComponent,
  memo,
  MemoExoticComponent,
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
  ViewStyle,
} from 'react-native';
import { AdvancedFlatList } from 'react-native-advanced-flatlist';
import { TextInputSubmitEditingEventData } from 'react-native/Libraries/Components/TextInput/TextInput';
import { LayoutRectangle, NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import { AutoPositionedPopupProps, Data, SelectedItem } from './AutoPositionedPopupProps';
import styles from './AutoPositionedPopup.style';
import { useRootView } from './RootViewContext';

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
  item: SelectedItem;
  index: number;
  selectedItem?: SelectedItem;
  onItemPress: (item: SelectedItem) => void;
  theme: Theme;
  rootViewsRef?: React.MutableRefObject<any[]>;
  selectedItemBackgroundColor?: string;
}> = memo(({ item, index, selectedItem, onItemPress, theme, rootViewsRef, selectedItemBackgroundColor = 'rgba(116, 116, 128, 0.08)' }) => {
  const isSelected = item.id === selectedItem?.id;

  return useMemo(() => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.commonModalRow,
        {
          backgroundColor: isSelected ? selectedItemBackgroundColor : 'transparent',
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => {
        console.log('AutoPositionedPopup.tsx ListItem onPress item=', item);
        if (rootViewsRef) {
          console.log('AutoPositionedPopup.tsx ListItem onPress rootViews=', rootViewsRef.current);
        }
        onItemPress(item);
      }}
    >
      <Text
        style={[styles.ListItemCode, { color: theme.colors.text }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  ), [item, index, selectedItem, onItemPress, theme, rootViewsRef, isSelected, selectedItemBackgroundColor]);
});

// Popup list component with AdvancedFlatList
interface PopupListProps {
  data: SelectedItem[];
  selectedItem?: SelectedItem;
  onItemPress: (item: SelectedItem) => void;
  renderItem?: ({ item, index }: { item: SelectedItem; index: number }) => React.ReactElement;
  keyExtractor?: (item: SelectedItem) => string;
  theme: Theme;
  rootViewsRef?: React.MutableRefObject<any[]>;
  fetchData?: (params: { pageIndex: number; pageSize: number; searchQuery?: string }) => Promise<Data | null>;
  localSearch?: boolean;
  pageSize?: number;
  onDataUpdate?: (newData: SelectedItem[]) => void;
  selectedItemBackgroundColor?: string;
}

const PopupList: React.FC<PopupListProps> = memo(({
  data,
  selectedItem,
  onItemPress,
  renderItem,
  keyExtractor = (item: SelectedItem) => String(item.id),
  theme,
  rootViewsRef,
  fetchData,
  localSearch = false,
  pageSize = 20,
  onDataUpdate,
  selectedItemBackgroundColor,
}) => {
  const [internalData, setInternalData] = useState<SelectedItem[]>(data);
  const searchQueryRef = useRef<string>('');

  // Sync external data changes
  useEffect(() => {
    setInternalData(data);
  }, [data]);

  // Listen to search query changes
  useEffect(() => {
    const unsubscribe = subscribeQueryChange(async (newQuery: string) => {
      console.log('PopupList subscribeQueryChange newQuery=', newQuery);
      searchQueryRef.current = newQuery;

      if (fetchData) {
        try {
          const result = await fetchData({
            pageIndex: 0,
            pageSize,
            searchQuery: newQuery,
          });

          if (result?.items) {
            setInternalData(result.items);
            onDataUpdate?.(result.items);
          }
        } catch (error) {
          console.error('PopupList fetchData error:', error);
        }
      } else if (localSearch) {
        // Local filtering
        const filtered = data.filter(item =>
          item.title.toLowerCase().includes(newQuery.toLowerCase())
        );
        setInternalData(filtered);
        onDataUpdate?.(filtered);
      }
    });

    return unsubscribe;
  }, [fetchData, localSearch, pageSize, data, onDataUpdate]);
  const defaultRenderItem = useCallback(
    ({ item, index }: { item: SelectedItem; index: number }) => (
      <ListItem
        item={item}
        index={index}
        selectedItem={selectedItem}
        onItemPress={onItemPress}
        theme={theme}
        rootViewsRef={rootViewsRef}
        selectedItemBackgroundColor={selectedItemBackgroundColor}
      />
    ),
    [selectedItem, onItemPress, theme, rootViewsRef, selectedItemBackgroundColor]
  );

  return (
    <View style={[styles.autoPositionedPopupList, { backgroundColor: theme.colors.background }]}>
      <AdvancedFlatList
        data={internalData}
        keyExtractor={keyExtractor}
        renderItem={renderItem || defaultRenderItem}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
});

// Main AutoPositionedPopup component
const AutoPositionedPopup: MemoExoticComponent<
  ForwardRefExoticComponent<AutoPositionedPopupProps>
> = memo(
  forwardRef<unknown, AutoPositionedPopupProps>(
    (props: AutoPositionedPopupProps, parentRef: ForwardedRef<unknown>): React.JSX.Element => {
      const {
        tag,
        style,
        AutoPositionedPopupBtnStyle,
        placeholder = 'Please Select',
        textAlign = 'right',
        onSubmitEditing,
        TextInputProps = {},
        inputStyle,
        labelStyle,
        popUpViewStyle = { left: '5%', width: '90%' },
        fetchData,
        renderItem,
        onItemSelected,
        localSearch = false,
        pageSize = 20,
        selectedItem,
        useTextInput = false,
        btwChildren,
        CustomRow = ({ children }) => <View>{children}</View>,
        keyExtractor = (item: any) => item?.id,
        AutoPositionedPopupBtnDisabled = false,
        forceRemoveAllRootViewOnItemSelected = false,
        centerDisplay = false,
        selectedItemBackgroundColor = 'rgba(116, 116, 128, 0.08)',
      } = props;

      // Use RootView context
      const { addRootView, removeRootView, rootViews, searchQuery: contextSearchQuery, setSearchQuery: setContextSearchQuery } = useRootView();
      const rootViewsRef = useRef(rootViews);

      useEffect(() => {
        rootViewsRef.current = rootViews;
      }, [rootViews]);

      // State management
      const [isVisible, setIsVisible] = useState(false);
      const [data, setData] = useState<SelectedItem[]>([]);
      const [loading, setLoading] = useState(false);
      const [popupPosition, setPopupPosition] = useState<{
        top: number;
        left: number;
        width: number;
      }>({ top: 0, left: 0, width: 0 });
      const popupId = useRef(`popup-${tag}-${Date.now()}`);

      // Refs for performance optimization
      const containerRef = useRef<View>(null);
      const textInputRef = useRef<RNTextInput>(null);
      const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
      const searchQueryRef = useRef<string>(''); // Use ref instead of state to avoid re-renders

      // Constants
      const LIST_HEIGHT = 200;
      const theme = defaultTheme;

      // Fetch data function
      const loadData = useCallback(async (query: string = '') => {
        if (!fetchData) return;

        setLoading(true);
        try {
          const result = await fetchData({
            pageIndex: 0,
            pageSize,
            searchQuery: query,
          });

          if (result?.items) {
            setData(result.items);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      }, [fetchData, pageSize]);

      // Handle search query change with debounce and event emission
      const handleSearchChange = useCallback((query: string) => {
        // Store in ref to avoid re-renders
        searchQueryRef.current = query;

        // Update TextInput value directly if needed
        if (textInputRef.current) {
          // The TextInput's value will be controlled by its own state
        }

        // Clear previous debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Use debounce for performance optimization
        debounceTimerRef.current = setTimeout(() => {
          // Emit query change event to decouple components and avoid context re-rendering
          emitQueryChange(searchQueryRef.current);
        }, 300); // Use 300ms debounce like the original
      }, []);

      // Calculate popup position
      const calculatePosition = useCallback(() => {
        if (!containerRef.current) return;

        containerRef.current.measureInWindow((x, y, width, height) => {
          const screenHeight = Dimensions.get('screen').height;
          const screenWidth = Dimensions.get('screen').width;

          let top = y + height;
          let left = x;
          let popupWidth = width;

          // Check if popup should appear above the input
          if (y + height + LIST_HEIGHT > screenHeight) {
            top = y - LIST_HEIGHT;
          }

          // Adjust horizontal position if needed
          if (popUpViewStyle?.left && popUpViewStyle?.width) {
            const leftPercent = parseFloat(String(popUpViewStyle.left).replace('%', '')) / 100;
            const widthPercent = parseFloat(String(popUpViewStyle.width).replace('%', '')) / 100;
            left = screenWidth * leftPercent;
            popupWidth = screenWidth * widthPercent;
          }

          setPopupPosition({ top, left, width: popupWidth });
        });
      }, [popUpViewStyle]);

      // Hide popup using RootView
      const hidePopup = useCallback(() => {
        setIsVisible(false);
        // Reset search query
        searchQueryRef.current = '';
        if (textInputRef.current) {
          textInputRef.current.blur();
          textInputRef.current.clear?.(); // Clear the TextInput
        }
        removeRootView(popupId.current, forceRemoveAllRootViewOnItemSelected, rootViewsRef.current);
      }, [removeRootView, forceRemoveAllRootViewOnItemSelected]);

      // Handle data updates from PopupList
      const handleDataUpdate = useCallback((newData: SelectedItem[]) => {
        setData(newData);
      }, []);

      // Handle item selection
      const handleItemPress = useCallback((item: SelectedItem) => {
        onItemSelected?.(item);
        hidePopup();
      }, [onItemSelected, hidePopup]);

      // Show popup using RootView
      const showPopup = useCallback(() => {
        calculatePosition();
        setIsVisible(true);
        loadData(searchQueryRef.current);

        // Wait for position to be calculated
        setTimeout(() => {
          const popupComponent = (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              }}
              activeOpacity={1}
              onPress={hidePopup}
            >
              <View
                style={{
                  position: 'absolute',
                  top: popupPosition.top,
                  left: popupPosition.left,
                  width: popupPosition.width,
                  height: LIST_HEIGHT,
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                {useTextInput && (
                  <RNTextInput
                    ref={textInputRef}
                    style={[
                      styles.inputStyle,
                      {
                        height: 40,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        paddingHorizontal: 12,
                        color: theme.colors.text,
                      },
                      inputStyle,
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.placeholderText}
                    defaultValue={searchQueryRef.current}
                    onChangeText={handleSearchChange}
                    onSubmitEditing={(e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
                      onSubmitEditing?.(e);
                      Keyboard.dismiss();
                    }}
                    returnKeyType="done"
                    {...TextInputProps}
                  />
                )}

                <PopupList
                  data={data}
                  selectedItem={selectedItem}
                  onItemPress={handleItemPress}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  theme={theme}
                  rootViewsRef={rootViewsRef}
                  fetchData={fetchData}
                  localSearch={localSearch}
                  pageSize={pageSize}
                  onDataUpdate={handleDataUpdate}
                  selectedItemBackgroundColor={selectedItemBackgroundColor}
                />
              </View>
            </TouchableOpacity>
          );

          addRootView({
            id: popupId.current,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            component: popupComponent,
            useModal: true,
            onModalClose: hidePopup,
            centerDisplay: centerDisplay,
          });
        }, 100);
      }, [calculatePosition, loadData, popupPosition, useTextInput, placeholder, theme, inputStyle, TextInputProps, data, selectedItem, renderItem, keyExtractor, centerDisplay, addRootView, hidePopup, handleSearchChange, handleItemPress, LIST_HEIGHT, selectedItemBackgroundColor]);

      // Handle button press
      const handleButtonPress = useCallback(() => {
        if (AutoPositionedPopupBtnDisabled) return;

        if (useTextInput) {
          showPopup();
          // Focus text input after a short delay
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 100);
        } else {
          showPopup();
        }
      }, [AutoPositionedPopupBtnDisabled, useTextInput, showPopup]);

      // Imperative handle for parent component access
      useImperativeHandle(
        parentRef,
        () => ({
          clearSelectedItem: () => {
            // Clear selection logic can be implemented here
            console.log('Clearing selected item for:', tag);
          },
          showPopup,
          hidePopup,
        }),
        [tag, showPopup, hidePopup]
      );

      // Cleanup
      useEffect(() => {
        return () => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
        };
      }, []);

      // Render the component
      return (
        <CustomRow>
          <View style={[styles.contain, style]} ref={containerRef}>
            <TouchableOpacity
              style={[styles.AutoPositionedPopupBtn, AutoPositionedPopupBtnStyle]}
              disabled={AutoPositionedPopupBtnDisabled}
              onPress={handleButtonPress}
            >
              {btwChildren ? (
                btwChildren()
              ) : (
                <Text
                  style={[
                    styles.searchQueryTxt,
                    selectedItem && { color: theme.colors.text },
                    labelStyle,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedItem?.title || placeholder}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </CustomRow>
      );
    }
  )
);

export default AutoPositionedPopup;
