import React from 'react';
import {StyleProp, TextInputProps, TextStyle, ViewStyle} from 'react-native';
import {TextInputSubmitEditingEventData} from 'react-native/Libraries/Components/TextInput/TextInput';
import {NativeSyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';

export interface Data {
  items: any[];
  pageIndex: number;
  needLoadMore: boolean;
}

export interface SelectedItem {
  id: string;
  title: string;
}

/**
 * Props interface for AutoPositionedPopup component
 */
export interface AutoPositionedPopupProps {
  style?: ViewStyle;
  labelStyle?: ViewStyle;
  tag: string;
  tagStyle?: ViewStyle;
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
  onItemSelected?: (item: SelectedItem) => void;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  localSearch?: boolean;
  placeholder?: string;
  textAlign?: 'left' | 'center' | 'right' | undefined;
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
   *  btwChildren={
   *                     () => {
   *                       return (
   *                         <>
   *                         </>
   *                       );
   *                     }
   *                   }
   */
  btwChildren?: () => React.ReactNode;
  useTextInput?: boolean;
  keyExtractor?: (item: SelectedItem) => string;
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
  onChangeText?: ((text: string) => void) | undefined;
}
