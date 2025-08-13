import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import AutoPositionedPopup, { SelectedItem, Data } from './src';

// Example data
const sampleData: SelectedItem[] = [
  { id: '1', title: 'Apple' },
  { id: '2', title: 'Banana' },
  { id: '3', title: 'Cherry' },
  { id: '4', title: 'Date' },
  { id: '5', title: 'Elderberry' },
  { id: '6', title: 'Fig' },
  { id: '7', title: 'Grape' },
  { id: '8', title: 'Honeydew' },
];

const ExampleUsage: React.FC = () => {
  const [selectedFruit, setSelectedFruit] = useState<SelectedItem | undefined>();
  const [selectedColor, setSelectedColor] = useState<SelectedItem | undefined>();
  const popupRef = useRef<any>();

  // Simulate data fetching
  const fetchFruitData = async ({ 
    pageIndex, 
    pageSize, 
    searchQuery 
  }): Promise<Data | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const filteredData = searchQuery 
      ? sampleData.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sampleData;

    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filteredData.slice(startIndex, endIndex);

    return {
      items,
      pageIndex,
      needLoadMore: endIndex < filteredData.length,
    };
  };

  const fetchColorData = async (): Promise<Data | null> => {
    const colors: SelectedItem[] = [
      { id: 'red', title: 'Red' },
      { id: 'blue', title: 'Blue' },
      { id: 'green', title: 'Green' },
      { id: 'yellow', title: 'Yellow' },
      { id: 'purple', title: 'Purple' },
    ];

    return {
      items: colors,
      pageIndex: 0,
      needLoadMore: false,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AutoPositionedPopup Examples</Text>
      
      {/* Basic Usage with Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Usage with Search</Text>
        <AutoPositionedPopup
          tag="fruit-selector"
          placeholder="Select a fruit"
          selectedItem={selectedFruit}
          fetchData={fetchFruitData}
          onItemSelected={setSelectedFruit}
          useTextInput={true}
          localSearch={false}
          style={styles.popup}
        />
      </View>

      {/* Simple Dropdown without Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Simple Dropdown</Text>
        <AutoPositionedPopup
          tag="color-selector"
          placeholder="Choose a color"
          selectedItem={selectedColor}
          fetchData={fetchColorData}
          onItemSelected={setSelectedColor}
          useTextInput={false}
          AutoPositionedPopupBtnStyle={styles.colorButton}
          popUpViewStyle={{ left: '10%', width: '80%' }}
        />
      </View>

      {/* Custom Row Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Row Layout</Text>
        <AutoPositionedPopup
          tag="custom-fruit"
          placeholder="Pick your favorite"
          selectedItem={selectedFruit}
          fetchData={fetchFruitData}
          onItemSelected={setSelectedFruit}
          CustomRow={({ children }) => (
            <View style={styles.customRow}>
              <Text style={styles.customRowLabel}>Favorite Fruit:</Text>
              {children}
            </View>
          )}
          AutoPositionedPopupBtnStyle={styles.customButton}
        />
      </View>

      {/* With Custom Item Rendering */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Item Rendering</Text>
        <AutoPositionedPopup
          ref={popupRef}
          tag="fancy-fruit"
          placeholder="Select with style"
          selectedItem={selectedFruit}
          fetchData={fetchFruitData}
          onItemSelected={setSelectedFruit}
          renderItem={({ item, index }) => (
            <View style={styles.customItem}>
              <Text style={styles.customItemText}>🍎 {item.title}</Text>
              <Text style={styles.customItemIndex}>#{index + 1}</Text>
            </View>
          )}
          AutoPositionedPopupBtnStyle={styles.fancyButton}
        />
      </View>

      {selectedFruit && (
        <View style={styles.result}>
          <Text style={styles.resultText}>
            Selected: {selectedFruit.title} (ID: {selectedFruit.id})
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
  },
  colorButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  customRowLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
    color: '#333',
  },
  customButton: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  customItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customItemText: {
    fontSize: 16,
    color: '#333',
  },
  customItemIndex: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fancyButton: {
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: '#9c27b0',
  },
  result: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  resultText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
});

export default ExampleUsage;