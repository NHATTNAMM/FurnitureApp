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

  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleExpanded = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const renderReviewItem = ({ item }) => {
    const isExpanded = expandedReviews[item.id];
    const shouldShowToggle = item.comment && item.comment.length > 150;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#666" />
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.userName || 'Khách hàng'}
              </Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        {item.comment && (
          <>
            <Text 
              style={styles.reviewComment} 
              numberOfLines={isExpanded ? undefined : 3}
            >
              {item.comment}
            </Text>
            {shouldShowToggle && (
              <TouchableOpacity 
                onPress={() => toggleExpanded(item.id)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    marginRight: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 46,
  },
  toggleButton: {
    marginLeft: 46,
    marginTop: 6,
  },
  toggleText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
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
