import React, {RefObject} from 'react';
import {StyleProp, TextInputProps, TextStyle, ViewStyle} from 'react-native';
import {TextInputSubmitEditingEventData} from 'react-native/Libraries/Components/TextInput/TextInput';
import {NativeSyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export interface SelectedItem {
  id: string;
  title: string;
}

export interface Data {
  items: SelectedItem[] | any[];
  pageIndex: number;
  needLoadMore: boolean;
}

/**
 * MedicationNotesCustomRow component with local state management
 * Handles search query state and disabled logic for Medication Notes add button
 */
export interface RNAutoPositionedPopupCustomRowProps {
  children?: React.ReactNode;
  selectedItem?: SelectedItem | any | null | undefined;
  selectList?: string | any [];
  onAdded?: (textToAdd: string) => void;
  clearSelectedItem?: () => void;
  disabled?: boolean;
}

/**
 * Props interface for AutoPositionedPopup component
 */
export interface AutoPositionedPopupProps {
  style?: ViewStyle;
  labelStyle?: ViewStyle;
  tag: string;
  tagStyle?: ViewStyle;
  /**
   * const fetchData = useCallback(async ({
   *                                                         pageIndex,
   *                                                         pageSize,
   *                                                         searchQuery
   *                                                       }: {
   *     pageIndex: number;
   *     pageSize: number;
   *     searchQuery?: string
   *   }): Promise<AutoPositionedPopupData | null> => {
   *     try {
   *       const data: SelectedItem[] = await api()
   *       console.log('fetchData data=', data)
   *       if (data) {
   *         return Promise.resolve({
   *           items: data, needLoadMore: false, pageIndex: pageIndex,
   *         })
   *       }
   *     } catch (e) {
   *     }
   *     return Promise.resolve(null)
   *   }, []);
   * fetchData={fetchData}
   * @param pageIndex
   * @param pageSize
   * @param searchQuery
   */
  fetchData?: ({
                 pageIndex,
                 pageSize,
                 searchQuery,
               }: {
    pageIndex: number;
    pageSize: number;
    searchQuery?: string;
  }) => Promise<Data | null>;
  renderItem?: ({item, index}: { item: SelectedItem; index: number }) => React.ReactElement;
  onItemSelected?: (item: SelectedItem & any) => void;
  /**
   * onSubmitEditing={(e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
   *                   if (e.nativeEvent?.text) {
   *                     const searchQuery = e.nativeEvent?.text
   *                     setTimeout(() => {
   *                       emitEvent(AutoPositionedPopupEventNames.searchQueryChange, {
   *                         tag: '',
   *                         searchQuery: searchQuery
   *                       })
   *                     }, 250);
   *                   }
   *                 }}
   * @param e
   */
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  localSearch?: boolean;
  placeholder?: string;
  // textAlign?: 'left' | 'center' | 'right' | undefined;
  pageSize?: number;
  selectedItem?: SelectedItem | any;
  /**
   *  CustomRow={
   *                     ({children}: ViewStyle & { children?: React.ReactNode }) => {
   *                       return (
   *                         <View style={}>
   *                           {children}
   *                         </View>
   *                       );
   *                     }
   *                   }
   */
  CustomRow?: React.ComponentType<ViewStyle & { children?: React.ReactNode }>;
  /**
   * const renderBtChildren = useCallback(() => {
   *     return (
   *       <BtChildren
   *         selectedItem={state.selectedItem}
   *       />
   *     );
   *   }, [state.selectedItem]);
   *
   *   const BtChildren: React.FC<AutoPositionedPopupProps> = memo(({
   *                                                                                          selectedItem,
   *                                                                                        }: AutoPositionedPopupProps) => {
   *   const {uiTheme} = useThemeProvider();
   *   const [searchQuery, setSearchQuery] = useState<string>('');
   *   useGlobalEventListener(
   *     AutoPositionedPopupEventNames.searchQueryChange,
   *     useCallback(({tag, searchQuery: newQuery}: { tag: string; searchQuery: string }): void => {
   *       console.log('BtChildren searchQueryChange event received=', {tag, searchQuery: newQuery});
   *       if (tag === i18n.t('')) {
   *         setSearchQuery(newQuery);
   *       }
   *     }, [])
   *   );
   *   console.log('BtChildren render=', {
   *     selectedItem, searchQuery
   *   })
   *   return (
   *     <>
   *       <Text
   *         style={[styles.selectBtText, ((selectedItem || searchQuery) && {color: uiTheme.colors.$text})]}>{searchQuery ? searchQuery : (selectedItem ? selectedItem.title : i18n.t('Please_enter'))}</Text>
   *     </>
   *   );
   * });
   *
   * btwChildren={
   *                   renderBtChildren
   *                 }
   */
  btwChildren?: () => React.ReactNode;
  useTextInput?: boolean;
  keyExtractor?: (item: SelectedItem) => string;
  /**
   *  CustomPopView={() => {
   *               return (props) => {
   *                 return <></>
   *               }
   *             }}
   * @constructor
   */
  CustomPopView?: () => React.ComponentType<
    ViewStyle & {
    children?: React.ReactNode;
    selectedItem?: SelectedItem | any;
  }
  >;
  CustomPopViewStyle?: ViewStyle;
  forceRemoveAllRootViewOnItemSelected?: boolean;
  /**
   * inputStyle={stableTransparentInputStyle}
   *  const stableTransparentInputStyle = useMemo(() => {
   *     return mode === 'light' ? {backgroundColor: 'transparent'} : false;
   *   }, [mode]);
   */
  inputStyle?: StyleProp<TextStyle>;
  TextInputProps?: TextInputProps;
  popUpViewStyle?: ViewStyle;
  AutoPositionedPopupBtnStyle?: ViewStyle;
  AutoPositionedPopupBtnDisabled?: boolean;
  centerDisplay?: boolean;
  selectedItemBackgroundColor?: string;
  showListEmptyComponent?: boolean;
  emptyText?: string;
  /**
   * onChangeText={(text: string) => {
   *                   console.log('onChangeText=', text)
   *                   emitEvent(AutoPositionedPopupEventNames.searchQueryChange, {
   *                     tag: '',
   *                     searchQuery: text
   *                   })
   *                 }}
   */
  onChangeText?: ((text: string) => void) | undefined;
  themeMode?: string | null | undefined;//light | dark
  /**
   * Reference to parent KeyboardAwareScrollView for auto-scrolling when keyboard appears.
   * When provided, the component will scroll the parent to keep the trigger button visible
   * above the keyboard.
   *
   * Example usage:
   * const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
   * <KeyboardAwareScrollView ref={scrollViewRef}>
   *   <RNAutoPositionedPopup
   *     parentScrollViewRef={scrollViewRef}
   *     ...
   *   />
   * </KeyboardAwareScrollView>
   */
  parentScrollViewRef?: RefObject<KeyboardAwareScrollView>;
  /**
   * Extra height to add when scrolling to make trigger visible.
   * Useful for adding padding between the trigger and keyboard.
   * Default: 100
   */
  scrollExtraHeight?: number;
}
