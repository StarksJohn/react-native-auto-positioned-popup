# React Native Auto Positioned Popup

A highly customizable React Native auto-positioned popup component with search functionality and flexible styling options. Perfect for dropdowns, autocomplete inputs, and selection lists.

English | [中文](./README_zh.md)

## Features

🚀 **Auto-positioning**: Automatically adjusts popup position based on screen space  
🔍 **Search functionality**: Built-in search with debounced input  
📱 **Cross-platform**: Works on both iOS and Android  
🎨 **Customizable**: Extensive styling and theming options  
⚡ **Performance optimized**: Efficient rendering with AdvancedFlatList  
🎯 **TypeScript support**: Full TypeScript definitions included  
🔄 **Dynamic view management**: RootView-based popup system  

## Installation

```bash
npm install react-native-auto-positioned-popup
```

or

```bash
yarn add react-native-auto-positioned-popup
```

## Loading Source Code in Development

If you need to debug or develop with the source code directly instead of the compiled library files, you can configure your project to load the TypeScript source files. This is useful for debugging or when you need to make temporary modifications.

### Configure Babel to Load Source Files

1. Install the babel module resolver plugin if you haven't already:

```bash
npm install --save-dev babel-plugin-module-resolver
```

2. Update your `babel.config.js` to redirect imports from the compiled lib files to the source files:

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
          // Redirect react-native-auto-positioned-popup to source files
          'react-native-auto-positioned-popup': './node_modules/react-native-auto-positioned-popup/src',
          'react-native-auto-positioned-popup/lib/index': './node_modules/react-native-auto-positioned-popup/src/index.ts',
          'react-native-auto-positioned-popup/lib/AutoPositionedPopup': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.tsx',
          'react-native-auto-positioned-popup/lib/AutoPositionedPopupProps': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopupProps.ts',
          'react-native-auto-positioned-popup/lib/RootViewContext': './node_modules/react-native-auto-positioned-popup/src/RootViewContext.tsx',
          'react-native-auto-positioned-popup/lib/KeyboardManager': './node_modules/react-native-auto-positioned-popup/src/KeyboardManager.tsx',
          'react-native-auto-positioned-popup/lib/AutoPositionedPopup.style': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.style.ts',
          // If you also use react-native-advanced-flatlist
          'react-native-advanced-flatlist': './node_modules/react-native-advanced-flatlist/src',
          'react-native-advanced-flatlist/lib/index': './node_modules/react-native-advanced-flatlist/src/index.ts',
          'react-native-advanced-flatlist/lib/AdvancedFlatList': './node_modules/react-native-advanced-flatlist/src/AdvancedFlatList.tsx',
        },
      },
    ],
    // ... other plugins
  ],
};
```

3. Clear the Metro bundler cache and restart:

```bash
npx react-native start --reset-cache
```

### Conditional Loading (Advanced)

If you want to conditionally load source files only in certain environments (e.g., during development), you can add logic to your babel config:

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const useSourceFiles = process.env.USE_SOURCE_FILES === 'true';

const aliasConfig = (isDevelopment || useSourceFiles) ? {
  // ... your source file aliases
} : {
  // ... your production aliases
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

#### Dynamic Control via global.$fake (Recommended Approach)

A more advanced approach is to dynamically control source code loading through your project's global configuration file. This method allows runtime switching without modifying environment variables:

1. Create or modify the `global.ts` file in your project root:

```typescript
// global.ts
declare global {
  var $fake: boolean;
  // ... other global variables
}

// Set to true to load source code (development mode)
// Set to false to use compiled files (production mode)
global.$fake = true; // or false

export {};
```

2. Read the `global.$fake` value in your `babel.config.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Check global.$fake value
const checkFakeMode = () => {
  try {
    const globalPath = path.resolve(__dirname, 'global.ts');
    const globalContent = fs.readFileSync(globalPath, 'utf8');
    // Check if global.$fake is true
    const fakeMatch = globalContent.match(/\$fake\s*=\s*(true|false)/);
    return fakeMatch && fakeMatch[1] === 'true';
  } catch (error) {
    console.warn('Unable to read global.ts, defaulting to false:', error.message);
    return false;
  }
};

const isFakeMode = checkFakeMode();

// Base alias configuration
const baseAlias = {
  // ... your base aliases
};

// If in fake mode, add source code redirects
const aliasConfig = isFakeMode ? {
  ...baseAlias,
  // Redirect react-native-auto-positioned-popup to source files
  'react-native-auto-positioned-popup': './node_modules/react-native-auto-positioned-popup/src',
  'react-native-auto-positioned-popup/lib/index': './node_modules/react-native-auto-positioned-popup/src/index.ts',
  'react-native-auto-positioned-popup/lib/AutoPositionedPopup': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.tsx',
  'react-native-auto-positioned-popup/lib/AutoPositionedPopupProps': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopupProps.ts',
  'react-native-auto-positioned-popup/lib/RootViewContext': './node_modules/react-native-auto-positioned-popup/src/RootViewContext.tsx',
  'react-native-auto-positioned-popup/lib/KeyboardManager': './node_modules/react-native-auto-positioned-popup/src/KeyboardManager.tsx',
  'react-native-auto-positioned-popup/lib/AutoPositionedPopup.style': './node_modules/react-native-auto-positioned-popup/src/AutoPositionedPopup.style.ts',
  // If you also use react-native-advanced-flatlist
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
    // ... other plugins
  ],
};
```

**Advantages of this approach**:
- ✅ No need to set environment variables, just modify the `global.ts` file
- ✅ Can switch dynamically at runtime (restart Metro after modifying the file)
- ✅ More intuitive configuration with all settings centralized in one file
- ✅ Suitable for team collaboration, different developers can have different local configs
- ✅ Avoids environment variable compatibility issues across different operating systems

### TypeScript Configuration

When loading source files directly, ensure your `tsconfig.json` includes the necessary paths:

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

### Notes

- Loading source files directly may impact build performance
- Remember to revert these changes before building for production
- Always clear Metro cache after changing babel configuration
- This approach is recommended only for development and debugging purposes

## Basic Usage

First, wrap your app with the `RootViewProvider`:

```tsx
import { RootViewProvider } from 'react-native-auto-positioned-popup';

const App = () => {
  return (
    <RootViewProvider>
      {/* Your app content */}
    </RootViewProvider>
  );
};
```

Then use the `AutoPositionedPopup` component:

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import RNAutoPositionedPopup from 'react-native-auto-positioned-popup';
import type {SelectedItem as RNSelectedItem, Data as AutoPositionedPopupData} from 'react-native-auto-positioned-popup';

const MyComponent = () => {
  const [selectedItem, setSelectedItem] = useState<RNSelectedItem | undefined>();

  const fetchData = async ({ pageIndex, pageSize, searchQuery }): Promise<AutoPositionedPopupData | null> => {
    // Your data fetching logic here
    return {
      items: [
        { id: '1', title: 'Option 1' },
        { id: '2', title: 'Option 2' },
        { id: '3', title: 'Option 3' },
      ],
      pageIndex: 0,
      needLoadMore: false,
    };
  };

  return (
    <View style={{ padding: 20 }}>
      <RNAutoPositionedPopup
        tag="example-popup"
        placeholder="Select an option"
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

## Advanced Usage

### Custom Row Component

```tsx
<AutoPositionedPopup
  tag="custom-popup"
  CustomRow={({ children }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <Text style={{ marginRight: 10 }}>Select:</Text>
      {children}
    </View>
  )}
  // ... other props
/>
```

### Custom Item Rendering

```tsx
<AutoPositionedPopup
  tag="custom-items"
  renderItem={({ item, index }) => (
    <View style={{ padding: 15, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text style={{ color: '#666', fontSize: 12 }}>ID: {item.id}</Text>
    </View>
  )}
  // ... other props
/>
```

### With Custom Styling

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
  // ... other props
/>
```

### Complete Dropdown Example (useTextInput=false)

This example shows a complete implementation without search input, suitable for dropdowns and selectors:

```tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import RNAutoPositionedPopup, { RootViewProvider } from 'react-native-auto-positioned-popup';
import type {SelectedItem as RNSelectedItem, Data as AutoPositionedPopupData} from 'react-native-auto-positioned-popup';

// Sample data type with color support
interface ClinicItem extends RNSelectedItem {
  code: string;
  textColor: string;
  address?: string;
}

const ClinicSelector = () => {
  const [selectedClinic, setSelectedClinic] = useState<ClinicItem | null>(null);

  const fetchClinics = async ({ pageIndex, pageSize }): Promise<AutoPositionedPopupData | null> => {
    // Simulate API call
    const mockClinics = [
      { id: '1', title: 'Main Clinic', code: 'MC001', textColor: '#4CAF50', address: '123 Main St' },
      { id: '2', title: 'Downtown Clinic', code: 'DC002', textColor: '#2196F3', address: '456 Downtown Ave' },
      { id: '3', title: 'Suburb Clinic', code: 'SC003', textColor: '#FF9800', address: '789 Suburb Rd' },
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
              <Text style={styles.sectionRowLabel}>Clinic</Text>
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
                  Please Select
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
            console.log('Selected clinic:', item);
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

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `string` | **Required** | Unique identifier for the popup |
| `fetchData` | `function` | `undefined` | Function to fetch data for the popup list |
| `selectedItem` | `SelectedItem` | `undefined` | Currently selected item |
| `onItemSelected` | `function` | `undefined` | Callback when an item is selected |
| `placeholder` | `string` | `'Please Select'` | Placeholder text |
| `useTextInput` | `boolean` | `false` | Enable search input functionality |
| `localSearch` | `boolean` | `false` | Enable local filtering of data |
| `pageSize` | `number` | `20` | Number of items per page |
| `textAlign` | `'left' \| 'center' \| 'right'` | `'right'` | Text alignment |
| `AutoPositionedPopupBtnDisabled` | `boolean` | `false` | Disable the popup trigger button |
| `style` | `ViewStyle` | `undefined` | Container style |
| `AutoPositionedPopupBtnStyle` | `ViewStyle` | `undefined` | Button style |
| `inputStyle` | `TextStyle` | `undefined` | Input field style |
| `labelStyle` | `ViewStyle` | `undefined` | Label text style |
| `popUpViewStyle` | `ViewStyle` | `{ left: '5%', width: '90%' }` | Popup container positioning |

### Data Structure

#### SelectedItem
```typescript
interface SelectedItem {
  id: string;
  title: string;
}
```

#### Data (for fetchData return)
```typescript
interface Data {
  items: SelectedItem[];
  pageIndex: number;
  needLoadMore: boolean;
}
```

### Methods (via ref)

```typescript
const popupRef = useRef();

// Clear the selected item
popupRef.current?.clearSelectedItem();

// Programmatically show popup
popupRef.current?.showPopup();

// Programmatically hide popup
popupRef.current?.hidePopup();
```

## Customization Examples

### Theming

The component supports custom theming by overriding the default styles:

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

### Custom Search Logic

```tsx
const fetchDataWithSearch = async ({ pageIndex, pageSize, searchQuery }) => {
  const allItems = [
    { id: '1', title: 'Apple' },
    { id: '2', title: 'Banana' },
    { id: '3', title: 'Cherry' },
    // ... more items
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

## Performance Tips

1. **Use keyExtractor**: Provide a stable key for list items
   ```tsx
   keyExtractor={(item) => item.id}
   ```

2. **Optimize renderItem**: Use React.memo for custom item components
   ```tsx
   const CustomItem = React.memo(({ item }) => (
     <View>{/* Your custom item */}</View>
   ));
   ```

3. **Debounced Search**: The component includes built-in debounced search (300ms delay)

4. **Local vs Remote Search**: Use `localSearch={true}` for small datasets, `false` for server-side filtering

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0 (Hooks support)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Stark](https://github.com/your-username)

## Changelog

### 1.0.0
- Initial release
- Auto-positioning functionality
- Search support
- TypeScript definitions
- Cross-platform compatibility