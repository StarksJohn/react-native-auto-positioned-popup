# React Native 自动定位弹窗组件

一个高度可定制的 React Native 自动定位弹窗组件，具有搜索功能和灵活的样式选项。非常适合用作下拉菜单、自动完成输入框和选择列表。

[English](./README.md) | 中文

## 特性

🚀 **自动定位**: 根据屏幕空间自动调整弹窗位置  
🔍 **搜索功能**: 内置防抖搜索功能  
📱 **跨平台**: 同时支持 iOS 和 Android  
🎨 **可定制**: 丰富的样式和主题选项  
⚡ **性能优化**: 使用 FlatList 高效渲染  
🎯 **TypeScript 支持**: 包含完整的 TypeScript 类型定义  
📦 **零依赖**: 无需额外的外部依赖  

## 安装

```bash
npm install react-native-auto-positioned-popup
```

或者

```bash
yarn add react-native-auto-positioned-popup
```

## 基本用法

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
      totalCount: 3,
      totalPage: 1,
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
  totalCount: number;
  totalPage: number;
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
    totalCount: filteredItems.length,
    totalPage: Math.ceil(filteredItems.length / pageSize),
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