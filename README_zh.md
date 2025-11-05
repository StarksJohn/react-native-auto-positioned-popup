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

## 在开发环境中加载源码

如果你需要调试或直接使用源代码进行开发，而不是使用编译后的库文件，可以配置你的项目来加载 TypeScript 源文件。这在调试或需要临时修改时非常有用。

### 配置 Babel 加载源文件

1. 如果还没有安装，请先安装 babel 模块解析器插件：

```bash
npm install --save-dev babel-plugin-module-resolver
```

2. 更新你的 `babel.config.js`，将导入从编译的 lib 文件重定向到源文件：

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['.', './src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          // 将 react-native-auto-positioned-popup 重定向到源文件
          'react-native-auto-positioned-popup': './node_modules/react-native-auto-positioned-popup/src',
          'react-native-auto-positioned-popup/lib/index': './node_modules/react-native-auto-positioned-popup/src/index.ts',
          'react-native-auto-positioned-popup/lib/AutoPositionedPopup': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.tsx',
          'react-native-auto-positioned-popup/lib/AutoPositionedPopupProps': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopupProps.ts',
          'react-native-auto-positioned-popup/lib/RootViewContext': './node_modules/react-native-auto-positioned-popup/src/RootViewContext.tsx',
          'react-native-auto-positioned-popup/lib/KeyboardManager': './node_modules/react-native-auto-positioned-popup/src/KeyboardManager.tsx',
          'react-native-auto-positioned-popup/lib/AutoPositionedPopup.style': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.style.ts',
          // 如果你也使用 react-native-advanced-flatlist
          'react-native-advanced-flatlist': './node_modules/react-native-advanced-flatlist/src',
          'react-native-advanced-flatlist/lib/index': './node_modules/react-native-advanced-flatlist/src/index.ts',
          'react-native-advanced-flatlist/lib/AdvancedFlatList': './node_modules/react-native-advanced-flatlist/src/AdvancedFlatList.tsx',
        },
      },
    ],
    // ... 其他插件
  ],
};
```

3. 清除 Metro bundler 缓存并重启：

```bash
npx react-native start --reset-cache
```

### 条件加载（高级用法）

如果你想只在特定环境（例如开发环境）中有条件地加载源文件，可以在 babel 配置中添加逻辑：

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const useSourceFiles = process.env.USE_SOURCE_FILES === 'true';

const aliasConfig = (isDevelopment || useSourceFiles) ? {
  // ... 你的源文件别名
} : {
  // ... 你的生产环境别名
};

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['.', './src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: aliasConfig,
      },
    ],
  ],
};
```

#### 通过 global.$fake 动态控制（推荐方式）

更高级的用法是通过项目的全局配置文件动态控制是否加载源码。这种方式允许在运行时切换而无需修改环境变量：

1. 在项目根目录创建或修改 `global.ts` 文件：

```typescript
// global.ts
declare global {
  var $fake: boolean;
  // ... 其他全局变量
}

// 设置为 true 时加载源码（开发模式）
// 设置为 false 时使用编译文件（生产模式）
global.$fake = true; // 或 false

export {};
```

2. 在 `babel.config.js` 中读取 `global.$fake` 的值：

```javascript
const fs = require('fs');
const path = require('path');

// 检查 global.$fake 的值
const checkFakeMode = () => {
  try {
    const globalPath = path.resolve(__dirname, 'global.ts');
    const globalContent = fs.readFileSync(globalPath, 'utf8');
    // 检查 global.$fake 是否为 true
    const fakeMatch = globalContent.match(/\$fake\s*=\s*(true|false)/);
    return fakeMatch && fakeMatch[1] === 'true';
  } catch (error) {
    console.warn('Unable to read global.ts, defaulting to false:', error.message);
    return false;
  }
};

const isFakeMode = checkFakeMode();

// 基础别名配置
const baseAlias = {
  // ... 你的基础别名
};

// 如果是 fake 模式，添加源码重定向
const aliasConfig = isFakeMode ? {
  ...baseAlias,
  // 重定向 react-native-auto-positioned-popup 到源码文件
  'react-native-auto-positioned-popup': './node_modules/react-native-auto-positioned-popup/src',
  'react-native-auto-positioned-popup/lib/index': './node_modules/react-native-auto-positioned-popup/src/index.ts',
  'react-native-auto-positioned-popup/lib/AutoPositionedPopup': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.tsx',
  'react-native-auto-positioned-popup/lib/AutoPositionedPopupProps': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopupProps.ts',
  'react-native-auto-positioned-popup/lib/RootViewContext': './node_modules/react-native-auto-positioned-popup/src/RootViewContext.tsx',
  'react-native-auto-positioned-popup/lib/KeyboardManager': './node_modules/react-native-auto-positioned-popup/src/KeyboardManager.tsx',
  'react-native-auto-positioned-popup/lib/AutoPositionedPopup.style': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.style.ts',
  // 如果你也使用 react-native-advanced-flatlist
  'react-native-advanced-flatlist': './node_modules/react-native-advanced-flatlist/src',
  'react-native-advanced-flatlist/lib/index': './node_modules/react-native-advanced-flatlist/src/index.ts',
  'react-native-advanced-flatlist/lib/AdvancedFlatList': './node_modules/react-native-advanced-flatlist/src/AdvancedFlatList.tsx',
} : baseAlias;

console.log(`Babel Config - Fake Mode: ${isFakeMode ? 'ENABLED' : 'DISABLED'}`);
if (isFakeMode) {
  console.log('✅ Using react-native-auto-positioned-popup SOURCE files (.tsx)');
} else {
  console.log('📦 Using react-native-auto-positioned-popup COMPILED files (.js)');
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['.', './src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: aliasConfig,
      },
    ],
    // ... 其他插件
  ],
};
```

**这种方式的优势**：
- ✅ 无需设置环境变量，只需修改 `global.ts` 文件
- ✅ 可以在运行时动态切换（修改文件后重启 Metro）
- ✅ 更直观的配置方式，所有配置集中在一个文件
- ✅ 适合团队协作，不同开发者可以有不同的本地配置
- ✅ 避免了环境变量在不同操作系统的兼容性问题

### TypeScript 配置

当直接加载源文件时，确保你的 `tsconfig.json` 包含必要的路径：

```json
{
  "compilerOptions": {
    "paths": {
      "react-native-auto-positioned-popup": ["./node_modules/react-native-auto-positioned-popup/src"],
      "react-native-auto-positioned-popup/*": ["./node_modules/react-native-auto-positioned-popup/src/*"]
    }
  }
}
```

### 注意事项

- 直接加载源文件可能会影响构建性能
- 记得在生产构建前恢复这些更改
- 更改 babel 配置后务必清除 Metro 缓存
- 此方法仅建议用于开发和调试目的

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
import RNAutoPositionedPopup from 'react-native-auto-positioned-popup';
import type {SelectedItem as RNSelectedItem, Data as AutoPositionedPopupData} from 'react-native-auto-positioned-popup';

const MyComponent = () => {
  const [selectedItem, setSelectedItem] = useState<RNSelectedItem | undefined>();

  const fetchData = async ({ pageIndex, pageSize, searchQuery }): Promise<AutoPositionedPopupData | null> => {
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
      <RNAutoPositionedPopup
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
import RNAutoPositionedPopup from 'react-native-auto-positioned-popup';
import type {SelectedItem as RNSelectedItem, Data as AutoPositionedPopupData} from 'react-native-auto-positioned-popup';

// 支持颜色的数据类型示例
interface ClinicItem extends RNSelectedItem {
  code: string;
  textColor: string;
  address?: string;
}

const ClinicSelector = () => {
  const [selectedClinic, setSelectedClinic] = useState<ClinicItem | null>(null);

  const fetchClinics = async ({ pageIndex, pageSize }): Promise<AutoPositionedPopupData | null> => {
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
        <RNAutoPositionedPopup
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
