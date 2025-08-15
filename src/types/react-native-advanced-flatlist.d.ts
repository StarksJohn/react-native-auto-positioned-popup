declare module 'react-native-advanced-flatlist' {
  import React, { ComponentType, ReactNode } from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface ListItem {
    id: string | number;
    selected?: boolean;
    [key: string]: any;
  }

  export interface ListData {
    items: ListItem[];
    pageIndex?: number;
    needLoadMore?: boolean;
  }

  export interface FetchDataParams {
    pageIndex: number;
    pageSize: number;
  }

  export interface RenderItemParams {
    item: ListItem;
    index: number;
    selected?: boolean;
    onItemPress?: (item: ListItem, index: number) => void;
  }

  export interface AdvancedFlatListProps {
    tag?: string;
    initialData?: Partial<ListData>;
    initPageIndex?: number;
    pageSize?: number;
    fetchData: (params: FetchDataParams) => Promise<ListData | null>;
    renderItem?: (params: RenderItemParams) => React.ReactNode;
    keyExtractor?: (item: ListItem, index: number) => string;
    style?: StyleProp<ViewStyle>;
    ListHeaderComponent?: ReactNode;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement<unknown> | null | undefined;
    autoRefresh?: boolean;
    disabledRefresh?: boolean;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled' | undefined;
    emptyText?: string;
    showListEmptyComponent?: boolean;
    onScrollBeginDrag?: (event: any) => void;
    onScrollEndDrag?: (event: any) => void;
    singleSelect?: boolean;
    onSingleSelectChange?: (selectedItem: ListItem | null) => void;
    onItemPress?: (item: ListItem, index: number) => void;
  }

  export interface AdvancedFlatListRef {
    scrollToTop: () => void;
    refresh: () => void;
    stopRefresh: () => void;
    getItems: () => ListItem[];
    changeItemSelect: (index: number) => void;
    clearSelection: () => void;
  }

  export interface InternalState {
    items: ListItem[];
    pageIndex: number;
    loading: boolean;
    refreshing: boolean;
    needLoadMore: boolean;
    selectedId: string | number | null;
  }

  export const AdvancedFlatList: ComponentType<AdvancedFlatListProps>;
  export default AdvancedFlatList;
}