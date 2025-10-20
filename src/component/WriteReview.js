import React, { useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';
import { UserContext } from '../Firebase/UserContext';
import StarRating from './StarRating';

const { width, height } = Dimensions.get('window');

const WriteReview = ({ 
  visible, 
  onClose, 
  furnitureId, 
  furnitureName,
  onReviewSubmitted 
}) => {
  const { user } = useContext(UserContext);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setRating(5);
    setComment('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitReview = async () => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đánh giá');
      return;
    }

    if (!furnitureId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Lỗi', 'Vui lòng viết ít nhất 10 ký tự cho đánh giá');
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        userId: user.id,
        userName: user.fullName || 'Khách hàng',
        furnitureId,
        furnitureName,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      Alert.alert(
        'Thành công', 
        'Cảm ơn bạn đã đánh giá sản phẩm!',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
              if (onReviewSubmitted) {
                onReviewSubmitted();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi gửi đánh giá:', error);
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Rất tệ';
      case 2: return 'Tệ';
      case 3: return 'Bình thường';
      case 4: return 'Tốt';
      case 5: return 'Rất tốt';
      default: return '';
    }
  };

  const StarSelector = () => (
    <View style={styles.starSelectorContainer}>
      <Text style={styles.ratingLabel}>Đánh giá của bạn:</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {getRatingText(rating)} ({rating}/5)
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Đánh giá sản phẩm</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {furnitureName}
            </Text>
          </View>

          <StarSelector />

          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>
              Chia sẻ trải nghiệm của bạn:
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết đánh giá về sản phẩm này... (tối thiểu 10 ký tự)"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 ký tự
            </Text>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>💡 Gợi ý:</Text>
            <Text style={styles.tipsText}>
              • Chia sẻ về chất lượng sản phẩm{'\n'}
              • Đánh giá về thiết kế và màu sắc{'\n'}
              • Trải nghiệm sử dụng thực tế{'\n'}
              • Dịch vụ giao hàng và đóng gói
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || comment.trim().length < 10) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitReview}
            disabled={loading || comment.trim().length < 10}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  starSelectorContainer: {
    paddingVertical: 25,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  commentSection: {
    paddingVertical: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    height: 120,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  tips: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 15,
    marginLeft: 10,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default WriteReview;
