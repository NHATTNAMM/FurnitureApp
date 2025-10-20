import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StarRating = ({ 
  rating = 0, 
  size = 16, 
  color = '#FFD700', 
  emptyColor = '#E0E0E0',
  style 
}) => {
  // Đảm bảo rating trong khoảng 0-5
  const normalizedRating = Math.max(0, Math.min(5, rating));
  
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= normalizedRating ? 'star' : 'star-outline'}
        size={size}
        color={i <= normalizedRating ? color : emptyColor}
        style={styles.star}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {stars}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
});

export default StarRating;
