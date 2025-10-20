import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OutOfStockBadge = ({ quantity }) => {
  const stockQuantity = quantity || 0;
  const isOutOfStock = stockQuantity <= 0;

  return (
    <View style={[styles.overlay, isOutOfStock ? styles.outBg : styles.inBg]}>
      <Text style={styles.text}>
        {isOutOfStock ? 'Hết hàng' : `Còn lại: ${stockQuantity}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inBg: {
    // Semi-transparent gray (glass-like) so image is still visible
    backgroundColor: 'rgba(107,114,128,0.55)',
  },
  outBg: {
    // Slightly lighter red when out of stock
    backgroundColor: 'rgba(220,53,69,0.7)',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OutOfStockBadge;
