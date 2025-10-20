import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StarRating from './StarRating';

const RatingDistribution = ({ ratings, totalReviews }) => {
  // Tính phần trăm cho mỗi mức sao
  const getPercentage = (count) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  // Tính điểm trung bình
  const averageRating = ratings && totalReviews > 0 
    ? ((ratings['5'] || 0) * 5 + 
       (ratings['4'] || 0) * 4 + 
       (ratings['3'] || 0) * 3 + 
       (ratings['2'] || 0) * 2 + 
       (ratings['1'] || 0) * 1) / totalReviews
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.summarySection}>
        <View style={styles.averageContainer}>
          <Text style={styles.averageScore}>
            {averageRating.toFixed(1)}
          </Text>
          <StarRating rating={Math.round(averageRating)} size={20} />
          <Text style={styles.totalReviews}>
            từ {totalReviews} đánh giá
          </Text>
        </View>
      </View>

      <View style={styles.distributionSection}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratings?.[star.toString()] || 0;
          const percentage = getPercentage(count);
          
          return (
            <View key={star} style={styles.distributionRow}>
              <View style={styles.starLabel}>
                <Text style={styles.starText}>{star}</Text>
                <StarRating rating={1} size={12} />
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
              </View>
              
              <Text style={styles.countText}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summarySection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  distributionSection: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    gap: 4,
  },
  starText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  countText: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
});

export default RatingDistribution;
