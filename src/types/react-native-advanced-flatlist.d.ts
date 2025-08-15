declare module 'react-native-advanced-flatlist' {
  import { ComponentType } from 'react';
  import { FlatListProps, ListRenderItem } from 'react-native';

  export interface AdvancedFlatListProps<ItemT = any> extends FlatListProps<ItemT> {
    renderItem?: ListRenderItem<ItemT>;
  }

  export const AdvancedFlatList: ComponentType<AdvancedFlatListProps>;
  export default AdvancedFlatList;
}

declare module 'react-native-advanced-flatlist' {
  import { ComponentType } from 'react';
  import { FlatListProps } from 'react-native';

  const AdvancedFlatListSource: ComponentType<FlatListProps<any>>;
  export default AdvancedFlatListSource;
}