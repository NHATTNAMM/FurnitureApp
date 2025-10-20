import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InventoryRestoreDetail = ({ restoredItems }) => {
  if (!restoredItems || restoredItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="refresh-circle" size={20} color="#28a745" />
        <Text style={styles.title}>Chi tiết hoàn trả tồn kho</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {restoredItems.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.furnitureName}</Text>
              <Text style={styles.itemQuantity}>+{item.quantity} sản phẩm</Text>
            </View>
            <Text style={styles.newStock}>Tổng: {item.newStock}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 6,
  },
  scrollView: {
    maxHeight: 120,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  newStock: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
});

export default InventoryRestoreDetail;
