import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';
import StarRating from './StarRating';
import RatingDistribution from './RatingDistribution';

const { width, height } = Dimensions.get('window');

const ProductReview = ({ visible, onClose, furnitureId, furnitureName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratings: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  });

  useEffect(() => {
    if (!visible || !furnitureId) return;

    const reviewsRef = collection(db, 'reviews');
    // Tạm thời bỏ orderBy để tránh lỗi index
    const q = query(
      reviewsRef, 
      where('furnitureId', '==', furnitureId)
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
      calculateStats(reviewsData);
      setLoading(false);
    }, (error) => {
      console.error('Lỗi khi tải reviews:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [visible, furnitureId]);

  const calculateStats = (reviewsData) => {
    const totalReviews = reviewsData.length;
    const ratings = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    
    let totalRating = 0;
    reviewsData.forEach(review => {
      const rating = review.rating.toString();
      if (ratings[rating] !== undefined) {
        ratings[rating]++;
        totalRating += review.rating;
      }
    });

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    setReviewStats({
      totalReviews,
      averageRating,
      ratings
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName || 'Người dùng'}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <StarRating rating={item.rating} size={16} />
      </View>
      
      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title} numberOfLines={2}>
          Đánh giá sản phẩm: {furnitureName}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {reviewStats.totalReviews > 0 && (
        <RatingDistribution 
          ratings={reviewStats.ratings}
          totalReviews={reviewStats.totalReviews}
        />
      )}
      
      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>
          Tất cả đánh giá ({reviewStats.totalReviews})
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
      <Text style={styles.emptySubText}>
        Hãy là người đầu tiên đánh giá sản phẩm này
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Đang tải đánh giá...</Text>
          </View>
        ) : reviewStats.totalReviews === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.reviewsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  reviewsHeader: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProductReview;
