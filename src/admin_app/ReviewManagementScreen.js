import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import StarRating from '../component/StarRating';
import { 
  getReviewsForAdmin, 
  updateReviewStatus, 
  addStoreReply,
  getReviewsByFurniture 
} from '../Firebase/FirebaseAPI';

const ReviewManagementScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending'); // 'pending', 'approved', 'all'
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadReviews();
  }, [selectedTab]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      let result;
      if (selectedTab === 'pending') {
        result = await getReviewsForAdmin();
      } else {
        // Load all reviews for approved/all tabs
        // You might need to create a different API for this
        result = await getAllReviews(); 
      }
      
      if (result.success) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      const result = await updateReviewStatus(reviewId, 'approved');
      if (result.success) {
        Alert.alert('Thành công', 'Đã duyệt đánh giá');
        loadReviews();
      } else {
        Alert.alert('Lỗi', 'Không thể duyệt đánh giá');
      }
    } catch (error) {
      console.error('Error approving review:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi duyệt đánh giá');
    }
  };

  const handleRejectReview = async (reviewId) => {
    Alert.alert(
      'Xác nhận từ chối',
      'Bạn có chắc chắn muốn từ chối đánh giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await updateReviewStatus(reviewId, 'rejected');
              if (result.success) {
                Alert.alert('Thành công', 'Đã từ chối đánh giá');
                loadReviews();
              } else {
                Alert.alert('Lỗi', 'Không thể từ chối đánh giá');
              }
            } catch (error) {
              console.error('Error rejecting review:', error);
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi từ chối đánh giá');
            }
          },
        },
      ]
    );
  };

  const handleAddReply = (review) => {
    setSelectedReview(review);
    setReplyContent('');
    setShowReplyModal(true);
  };

  const submitReply = async () => {
    if (!replyContent.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      const result = await addStoreReply(selectedReview.id, replyContent.trim());
      if (result.success) {
        Alert.alert('Thành công', 'Đã thêm phản hồi');
        setShowReplyModal(false);
        loadReviews();
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể thêm phản hồi');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm phản hồi');
    }
  };

  const formatDate = (date) => {
    const reviewDate = date?.toDate ? date.toDate() : new Date(date);
    return reviewDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { key: 'pending', label: 'Chờ duyệt', color: '#FF9800' },
    { key: 'approved', label: 'Đã duyệt', color: '#4CAF50' },
    { key: 'all', label: 'Tất cả', color: '#2196F3' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải đánh giá...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý đánh giá</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && { backgroundColor: tab.color }
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reviews List */}
      <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có đánh giá nào</Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* Review Header */}
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Icon name="user" size={16} color="#666" />
                  </View>
                  <View>
                    <Text style={styles.userName}>
                      {review.isAnonymous ? 'Ẩn danh' : review.userName || 'Người dùng'}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {formatDate(review.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(review.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(review.status)}
                  </Text>
                </View>
              </View>

              {/* Product Info */}
              <Text style={styles.productName}>
                Sản phẩm: {review.furnitureName || 'Không xác định'}
              </Text>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                <StarRating rating={review.rating} size={16} />
                <Text style={styles.ratingText}>({review.rating}/5)</Text>
              </View>

              {/* Review Content */}
              {review.title && (
                <Text style={styles.reviewTitle}>{review.title}</Text>
              )}
              <Text style={styles.reviewContent}>{review.content}</Text>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <ScrollView horizontal style={styles.imagesContainer}>
                  {review.images.map((image, index) => (
                    <Image key={index} source={{ uri: image }} style={styles.reviewImage} />
                  ))}
                </ScrollView>
              )}

              {/* Store Reply */}
              {review.storeReply && (
                <View style={styles.storeReply}>
                  <View style={styles.storeReplyHeader}>
                    <Icon name="store" size={14} color="#4CAF50" />
                    <Text style={styles.storeReplyTitle}>Phản hồi từ cửa hàng</Text>
                  </View>
                  <Text style={styles.storeReplyContent}>{review.storeReply.content}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {selectedTab === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApproveReview(review.id)}
                    >
                      <Icon name="check" size={14} color="#FFF" />
                      <Text style={styles.actionButtonText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectReview(review.id)}
                    >
                      <Icon name="times" size={14} color="#FFF" />
                      <Text style={styles.actionButtonText}>Từ chối</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {(selectedTab === 'approved' || (selectedTab === 'all' && review.status === 'approved')) && !review.storeReply && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.replyButton]}
                    onPress={() => handleAddReply(review)}
                  >
                    <Icon name="reply" size={14} color="#FFF" />
                    <Text style={styles.actionButtonText}>Phản hồi</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Report Count */}
              {review.reportCount > 0 && (
                <View style={styles.reportContainer}>
                  <Icon name="flag" size={12} color="#FF5722" />
                  <Text style={styles.reportText}>
                    {review.reportCount} báo cáo vi phạm
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Reply Modal */}
      <Modal visible={showReplyModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phản hồi đánh giá</Text>
              <TouchableOpacity onPress={() => setShowReplyModal(false)}>
                <Icon name="times" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedReview && (
              <View style={styles.originalReview}>
                <Text style={styles.originalReviewTitle}>Đánh giá gốc:</Text>
                <Text style={styles.originalReviewContent}>{selectedReview.content}</Text>
              </View>
            )}

            <Text style={styles.replyLabel}>Nội dung phản hồi:</Text>
            <TextInput
              style={styles.replyInput}
              placeholder="Nhập phản hồi của cửa hàng..."
              value={replyContent}
              onChangeText={setReplyContent}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReplyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitReply}
              >
                <Text style={styles.submitButtonText}>Gửi phản hồi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return '#4CAF50';
    case 'rejected': return '#F44336';
    case 'pending': return '#FF9800';
    default: return '#9E9E9E';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'approved': return 'Đã duyệt';
    case 'rejected': return 'Từ chối';
    case 'pending': return 'Chờ duyệt';
    default: return 'Không xác định';
  }
};

// Mock function - bạn cần implement API này
const getAllReviews = async () => {
  // Implement API to get all reviews
  return { success: true, data: [] };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  reviewsList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  productName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  imagesContainer: {
    marginBottom: 12,
  },
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  storeReply: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  storeReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeReplyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  storeReplyContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  replyButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  reportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportText: {
    fontSize: 10,
    color: '#FF5722',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  originalReview: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  originalReviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  originalReviewContent: {
    fontSize: 14,
    color: '#333',
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
});

export default ReviewManagementScreen;
