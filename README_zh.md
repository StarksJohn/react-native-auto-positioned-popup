# React Native 自动定位弹窗组件

一个高度可定制的 React Native 自动定位弹窗组件，具有搜索功能和灵活的样式选项。非常适合用作下拉菜单、自动完成输入框和选择列表。

[English](./README.md) | 中文

## 特性

🚀 **自动定位**: 根据屏幕空间自动调整弹窗位置  
🔍 **搜索功能**: 内置防抖搜索功能  
📱 **跨平台**: 同时支持 iOS 和 Android  
🎨 **可定制**: 丰富的样式和主题选项  
⚡ **性能优化**: 使用 AdvancedFlatList 高效渲染  
🎯 **TypeScript 支持**: 包含完整的 TypeScript 类型定义  
🔄 **动态视图管理**: 基于 RootView 的弹窗系统  

## 安装

```bash
npm install react-native-auto-positioned-popup
```

或者

```bash
yarn add react-native-auto-positioned-popup
```

## 基本用法

首先，使用 `RootViewProvider` 包裹你的应用：

```tsx
import { RootViewProvider } from 'react-native-auto-positioned-popup';

const App = () => {
  return (
    <RootViewProvider>
      {/* 你的应用内容 */}
    </RootViewProvider>
  );
};
```

然后使用 `AutoPositionedPopup` 组件：

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import AutoPositionedPopup, { SelectedItem, Data } from 'react-native-auto-positioned-popup';

const MyComponent = () => {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | undefined>();

  const fetchData = async ({ pageIndex, pageSize, searchQuery }): Promise<Data | null> => {
    // 你的数据获取逻辑
    return {
      items: [
        { id: '1', title: '选项 1' },
        { id: '2', title: '选项 2' },
        { id: '3', title: '选项 3' },
      ],
      pageIndex: 0,
      needLoadMore: false,
    };
  };

  return (
    <View style={{ padding: 20 }}>
      <AutoPositionedPopup
        tag="example-popup"
        placeholder="请选择一个选项"
        selectedItem={selectedItem}
        fetchData={fetchData}
        onItemSelected={(item) => setSelectedItem(item)}
        useTextInput={true}
      />
    </View>
  );
};

export default MyComponent;
```

## 高级用法

### 自定义行组件

```tsx
<AutoPositionedPopup
  tag="custom-popup"
  CustomRow={({ children }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <Text style={{ marginRight: 10 }}>选择:</Text>
      {children}
    </View>
  )}
  // ... 其他属性
/>
```

### 自定义项目渲染

```tsx
<AutoPositionedPopup
  tag="custom-items"
  renderItem={({ item, index }) => (
    <View style={{ padding: 15, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text style={{ color: '#666', fontSize: 12 }}>ID: {item.id}</Text>
    </View>
  )}
  // ... 其他属性
/>
```

### 自定义样式

```tsx
<AutoPositionedPopup
  tag="styled-popup"
  style={{ backgroundColor: '#f5f5f5', borderRadius: 8 }}
  AutoPositionedPopupBtnStyle={{
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
  }}
  inputStyle={{
    fontSize: 16,
    color: '#333',
  }}
  popUpViewStyle={{
    left: '10%',
    width: '80%',
  }}
  // ... 其他属性
/>
```

### 完整下拉选择示例 (useTextInput=false)

此示例展示了无搜索输入的完整实现，适用于下拉选择器：

```tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import AutoPositionedPopup, { SelectedItem, Data, RootViewProvider } from 'react-native-auto-positioned-popup';

// 支持颜色的数据类型示例
interface ClinicItem extends SelectedItem {
  code: string;
  textColor: string;
  address?: string;
}

const ClinicSelector = () => {
  const [selectedClinic, setSelectedClinic] = useState<ClinicItem | null>(null);

  const fetchClinics = async ({ pageIndex, pageSize }): Promise<Data | null> => {
    // 模拟 API 调用
    const mockClinics = [
      { id: '1', title: '主诊所', code: 'MC001', textColor: '#4CAF50', address: '主街123号' },
      { id: '2', title: '市中心诊所', code: 'DC002', textColor: '#2196F3', address: '市中心大道456号' },
      { id: '3', title: '郊区诊所', code: 'SC003', textColor: '#FF9800', address: '郊区路789号' },
    ];

    return {
      items: mockClinics.map(clinic => ({
        title: clinic.code,
        ...clinic,
      })),
      pageIndex,
      needLoadMore: false,
    };
  };

  return (
    <RootViewProvider>
      <View style={styles.container}>
        <AutoPositionedPopup
          tag="clinic-selector"
          useTextInput={false}
          localSearch={false}
          forceRemoveAllRootViewOnItemSelected={true}
          selectedItem={selectedClinic ? {
            title: selectedClinic.code,
            ...selectedClinic,
          } : undefined}
          CustomRow={({ children }) => (
            <View style={styles.sectionRow}>
              <Text style={styles.sectionRowLabel}>诊所</Text>
              {children}
              <Image
                source={require('./assets/arrow-down.png')}
                style={styles.selectArrow}
              />
            </View>
          )}
          AutoPositionedPopupBtnStyle={styles.selectorButton}
          btwChildren={() => (
            <>
              {!selectedClinic ? (
                <Text style={styles.placeholderText} numberOfLines={1}>
                  请选择
                </Text>
              ) : (
                <View style={styles.selectedItemContainer}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: selectedClinic.textColor }
                    ]}
                  />
                  <Text style={styles.selectedText} numberOfLines={1}>
                    {selectedClinic.code}
                  </Text>
                </View>
              )}
            </>
          )}
          fetchData={fetchClinics}
          onItemSelected={(item: ClinicItem) => {
            console.log('选中的诊所:', item);
            setSelectedClinic(item);
          }}
        />
      </View>
    </RootViewProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
    minWidth: 60,
  },
  selectorButton: {
    flex: 1,
    alignItems: 'flex-start',
  },
  selectArrow: {
    width: 12,
    height: 12,
    marginLeft: 8,
  },
  placeholderText: {
    fontSize: 15,
    color: '#999',
  },
  selectedItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
});

export default ClinicSelector;
```

## API 参考

### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|---------|-------------|
| `tag` | `string` | **必需** | 弹窗的唯一标识符 |
| `fetchData` | `function` | `undefined` | 获取弹窗列表数据的函数 |
| `selectedItem` | `SelectedItem` | `undefined` | 当前选中的项目 |
| `onItemSelected` | `function` | `undefined` | 选中项目时的回调函数 |
| `placeholder` | `string` | `'Please Select'` | 占位符文本 |
| `useTextInput` | `boolean` | `false` | 启用搜索输入功能 |
| `localSearch` | `boolean` | `false` | 启用本地数据过滤 |
| `pageSize` | `number` | `20` | 每页项目数量 |
| `textAlign` | `'left' \| 'center' \| 'right'` | `'right'` | 文本对齐方式 |
| `AutoPositionedPopupBtnDisabled` | `boolean` | `false` | 禁用弹窗触发按钮 |
| `style` | `ViewStyle` | `undefined` | 容器样式 |
| `AutoPositionedPopupBtnStyle` | `ViewStyle` | `undefined` | 按钮样式 |
| `inputStyle` | `TextStyle` | `undefined` | 输入框样式 |
| `labelStyle` | `ViewStyle` | `undefined` | 标签文本样式 |
| `popUpViewStyle` | `ViewStyle` | `{ left: '5%', width: '90%' }` | 弹窗容器定位 |

### 数据结构

#### SelectedItem
```typescript
interface SelectedItem {
  id: string;
  title: string;
}
```

#### Data（fetchData 返回值）
```typescript
interface Data {
  items: SelectedItem[];
  pageIndex: number;
  needLoadMore: boolean;
}
```

### 方法（通过 ref）

```typescript
const popupRef = useRef();

// 清除选中的项目
popupRef.current?.clearSelectedItem();

// 以编程方式显示弹窗
popupRef.current?.showPopup();

// 以编程方式隐藏弹窗
popupRef.current?.hidePopup();
```

## 自定义示例

### 主题定制

组件支持通过覆盖默认样式来自定义主题：

```tsx
const customTheme = {
  colors: {
    text: '#2c3e50',
    placeholderText: '#95a5a6',
    background: '#ecf0f1',
    border: '#bdc3c7',
  },
};
```

### 自定义搜索逻辑

```tsx
const fetchDataWithSearch = async ({ pageIndex, pageSize, searchQuery }) => {
  const allItems = [
    { id: '1', title: '苹果' },
    { id: '2', title: '香蕉' },
    { id: '3', title: '樱桃' },
    // ... 更多项目
  ];

  const filteredItems = searchQuery
    ? allItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems;

  return {
    items: filteredItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    pageIndex,
    needLoadMore: (pageIndex + 1) * pageSize < filteredItems.length,
  };
};
```

## 性能优化建议

1. **使用 keyExtractor**: 为列表项提供稳定的键
   ```tsx
   keyExtractor={(item) => item.id}
   ```

2. **优化 renderItem**: 对自定义项组件使用 React.memo
   ```tsx
   const CustomItem = React.memo(({ item }) => (
     <View>{/* 你的自定义项目 */}</View>
   ));
   ```

3. **防抖搜索**: 组件内置防抖搜索功能（300ms 延迟）

4. **本地 vs 远程搜索**: 对于小数据集使用 `localSearch={true}`，对于服务器端过滤使用 `false`

## 系统要求

- React Native >= 0.60.0
- React >= 16.8.0 (支持 Hooks)

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

MIT © [Stark](https://github.com/your-username)

## 更新日志

### 1.0.0
- 初始发布
- 自动定位功能
- 搜索支持
- TypeScript 定义
- 跨平台兼容性