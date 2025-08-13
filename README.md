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
import AutoPositionedPopup, { SelectedItem, Data } from 'react-native-auto-positioned-popup';

const MyComponent = () => {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | undefined>();

  const fetchData = async ({ pageIndex, pageSize, searchQuery }): Promise<Data | null> => {
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
      <AutoPositionedPopup
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
import AutoPositionedPopup, { SelectedItem, Data, RootViewProvider } from 'react-native-auto-positioned-popup';

// Sample data type with color support
interface ClinicItem extends SelectedItem {
  code: string;
  textColor: string;
  address?: string;
}

const ClinicSelector = () => {
  const [selectedClinic, setSelectedClinic] = useState<ClinicItem | null>(null);

  const fetchClinics = async ({ pageIndex, pageSize }): Promise<Data | null> => {
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