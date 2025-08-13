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
  Modal,
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
}> = memo(({ item, index, selectedItem, onItemPress, theme }) => {
  const isSelected = item.id === selectedItem?.id;
  
  return (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.commonModalRow,
        {
          backgroundColor: isSelected ? 'rgba(116, 116, 128, 0.08)' : 'transparent',
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => onItemPress(item)}
    >
      <Text 
        style={[styles.ListItemCode, { color: theme.colors.text }]} 
        numberOfLines={1} 
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
});

// Popup list component with AdvancedFlatList
interface PopupListProps {
  data: SelectedItem[];
  selectedItem?: SelectedItem;
  onItemPress: (item: SelectedItem) => void;
  renderItem?: ({ item, index }: { item: SelectedItem; index: number }) => React.ReactElement;
  keyExtractor?: (item: SelectedItem) => string;
  theme: Theme;
}

const PopupList: React.FC<PopupListProps> = memo(({
  data,
  selectedItem,
  onItemPress,
  renderItem,
  keyExtractor = (item: SelectedItem) => String(item.id),
  theme,
}) => {
  const defaultRenderItem = useCallback(
    ({ item, index }: { item: SelectedItem; index: number }) => (
      <ListItem 
        item={item} 
        index={index} 
        selectedItem={selectedItem}
        onItemPress={onItemPress}
        theme={theme}
      />
    ),
    [selectedItem, onItemPress, theme]
  );

  return (
    <View style={[styles.autoPositionedPopupList, { backgroundColor: theme.colors.background }]}>
      <AdvancedFlatList
        data={data}
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
      } = props;

      // State management
      const [isVisible, setIsVisible] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const [data, setData] = useState<SelectedItem[]>([]);
      const [loading, setLoading] = useState(false);
      const [popupPosition, setPopupPosition] = useState<{
        top: number;
        left: number;
        width: number;
      }>({ top: 0, left: 0, width: 0 });

      // Refs
      const containerRef = useRef<View>(null);
      const textInputRef = useRef<RNTextInput>(null);
      const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      // Handle search query change with debounce
      const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (localSearch) {
            // Filter local data
            if (fetchData) {
              loadData(query);
            }
          } else {
            // Fetch from remote
            loadData(query);
          }
        }, 300);
      }, [localSearch, loadData]);

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

      // Show popup
      const showPopup = useCallback(() => {
        calculatePosition();
        setIsVisible(true);
        loadData(searchQuery);
      }, [calculatePosition, loadData, searchQuery]);

      // Hide popup
      const hidePopup = useCallback(() => {
        setIsVisible(false);
        setSearchQuery('');
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
      }, []);

      // Handle item selection
      const handleItemPress = useCallback((item: SelectedItem) => {
        onItemSelected?.(item);
        hidePopup();
      }, [onItemSelected, hidePopup]);

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

            {/* Modal for popup display */}
            <Modal
              visible={isVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={hidePopup}
            >
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
                      value={searchQuery}
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
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </CustomRow>
      );
    }
  )
);

export default AutoPositionedPopup;