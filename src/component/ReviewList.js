import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';
import StarRating from './StarRating';

const ReviewList = ({ 
  furnitureId, 
  limit: reviewLimit = 5, 
  showAllButton = false, 
  onShowAll 
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!furnitureId) {
      setLoading(false);
      return;
    }

    const reviewsRef = collection(db, 'reviews');
    // Tạm thời bỏ orderBy để tránh lỗi index
    const q = query(
      reviewsRef,
      where('furnitureId', '==', furnitureId),
      limit(reviewLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      // Sort manually in JavaScript
      reviewsData.sort((a, b) => b.createdAt - a.createdAt);
      
      setReviews(reviewsData);
      setLoading(false);
    }, (error) => {
      console.error('Lỗi khi tải reviews:', error);
      setLoading(false);
    });

    // Get total count for "show all" button
    if (showAllButton) {
      const countQuery = query(reviewsRef, where('furnitureId', '==', furnitureId));
      const countUnsubscribe = onSnapshot(countQuery, (snapshot) => {
        setTotalReviews(snapshot.docs.length);
      });

      return () => {
        unsubscribe();
        countUnsubscribe();
      };
    }

    return () => unsubscribe();
  }, [furnitureId, reviewLimit, showAllButton]);

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays <= 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.userAvatar}>
          <Ionicons name="person-circle" size={28} color="#007AFF" />
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.userName || 'Khách hàng'}
            </Text>
            <View style={styles.ratingContainer}>
              <StarRating rating={item.rating} size={12} />
              <Text style={styles.ratingText}>({item.rating})</Text>
            </View>
          </View>
          <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          
          {item.comment && (
            <Text style={styles.reviewComment} numberOfLines={4}>
              {item.comment}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderShowAllButton = () => {
    if (!showAllButton || totalReviews <= reviewLimit) return null;
    
    return (
      <TouchableOpacity 
        style={styles.showAllButton} 
        onPress={onShowAll}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles-outline" size={18} color="#007AFF" />
        <Text style={styles.showAllText}>
          Xem tất cả {totalReviews} đánh giá
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={32} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          {renderShowAllButton()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  separator: {
    height: 12,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    marginRight: 12,
    marginTop: 2,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  showAllText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
});

export default ReviewList;
