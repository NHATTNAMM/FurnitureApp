import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StockStatus = ({ quantity }) => {
  const stockQuantity = quantity || 0;
  const isOutOfStock = stockQuantity <= 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, isOutOfStock && styles.outOfStockText]}>
        {isOutOfStock ? 'Hết hàng' : `Còn lại: ${stockQuantity}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
  },
  text: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  outOfStockText: {
    color: '#dc3545',
  },
});

export default StockStatus;
