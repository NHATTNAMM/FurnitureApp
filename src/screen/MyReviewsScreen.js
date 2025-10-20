import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../Firebase/UserContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';

const { width } = Dimensions.get('window');

const MyReviewsScreen = () => {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Load reviews của user
  useEffect(() => {
    if (!user?.id) return;

    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('userId', '==', user.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      // Sắp xếp theo thời gian mới nhất
      reviewsData.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewsData);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const handleEditReview = (review) => {
    setSelectedReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditModalVisible(true);
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;

    try {
      const reviewRef = doc(db, 'reviews', selectedReview.id);
      await updateDoc(reviewRef, {
        rating: editRating,
        comment: editComment.trim(),
        updatedAt: serverTimestamp(),
      });

      setEditModalVisible(false);
      setSelectedReview(null);
      Alert.alert('Thành công', 'Đánh giá đã được cập nhật');
    } catch (error) {
      console.error('Lỗi khi cập nhật đánh giá:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật đánh giá');
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      'Xóa đánh giá',
      'Bạn có chắc chắn muốn xóa đánh giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'reviews', reviewId));
              Alert.alert('Thành công', 'Đánh giá đã được xóa');
            } catch (error) {
              console.error('Lỗi khi xóa đánh giá:', error);
              Alert.alert('Lỗi', 'Không thể xóa đánh giá');
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating, onPress = null) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={20}
              color={star <= rating ? '#FFD700' : '#D3D3D3'}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.productInfo}>
          {item.furnitureImage && (
            <Image source={{ uri: item.furnitureImage }} style={styles.productImage} />
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.furnitureName || 'Sản phẩm'}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditReview(item)}
          >
            <Ionicons name="pencil" size={18} color="#000d66" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteReview(item.id)}
          >
            <MaterialIcons name="delete-outline" size={22} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        {renderStars(item.rating)}
        <Text style={styles.ratingText}>({item.rating}/5)</Text>
      </View>

      {item.comment && (
        <Text style={styles.commentText}>{item.comment}</Text>
      )}

      {item.updatedAt && (
        <Text style={styles.updatedText}>
          Đã chỉnh sửa: {formatDate(item.updatedAt.toDate())}
        </Text>
      )}
    </View>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={80} color="#D3D3D3" />
      <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa đánh giá sản phẩm nào. Hãy mua sắm và chia sẻ trải nghiệm của bạn!
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#D3D3D3" />
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng đăng nhập để xem đánh giá của bạn
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.iconBack}>
            <Ionicons name="arrow-back" size={22} color="#000D66" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
      </View>
      <Text style={styles.itemCount}>{reviews.length} đánh giá</Text>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyComponent}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa đánh giá</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedReview && (
                <>
                  <View style={styles.productPreview}>
                    {selectedReview.furnitureImage && (
                      <Image
                        source={{ uri: selectedReview.furnitureImage }}
                        style={styles.modalProductImage}
                      />
                    )}
                    <Text style={styles.modalProductName}>
                      {selectedReview.furnitureName}
                    </Text>
                  </View>

                  <View style={styles.ratingSection}>
                    <Text style={styles.sectionLabel}>Đánh giá:</Text>
                    {renderStars(editRating, setEditRating)}
                  </View>

                  <View style={styles.commentSection}>
                    <Text style={styles.sectionLabel}>Nhận xét:</Text>
                    <TextInput
                      style={styles.commentInput}
                      value={editComment}
                      onChangeText={setEditComment}
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateReview}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconBack: {
    borderWidth: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000D66',
    flex: 1,
    textAlign: 'center',
    marginRight: 50,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#fff',
  },
  listContainer: {
    paddingVertical: 10,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  updatedText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  modalProductImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  ratingSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  commentSection: {
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MyReviewsScreen;
