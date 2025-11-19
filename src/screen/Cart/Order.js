import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadOrdersRealTime, cancelOrder } from '../../Firebase/FirebaseAPI';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import InventoryRestoreNotification from '../../component/InventoryRestoreNotification';
import WriteReview from '../../component/WriteReview';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../Firebase/FirebaseConfig';

const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';

const Order = ({ navigation }) => {
  const route = useRoute();
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(route.params?.initialStatus || 'Chờ giao hàng');
  const statusList = ['Chờ giao hàng', 'Đang giao', 'Đã đặt', 'Đã hủy'];
  const [notification, setNotification] = useState({
    visible: false,
    message: ''
  });
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null); // { furnitureId, furnitureName }
  const [reviewedFurnitureIds, setReviewedFurnitureIds] = useState(new Set());

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadOrdersRealTime(user.id, (orderData) => {
        if (orderData) {
          // Sắp xếp đơn hàng mới nhất lên trên
          const sortedOrders = orderData.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || a.addedAt || 0;
            const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || b.addedAt || 0;
            return timeB - timeA; // Sắp xếp giảm dần (mới nhất trước)
          });
          setOrders(sortedOrders);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Subscribe to user's reviews to know which products were already reviewed
  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'reviews'),
      where('userId', '==', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextSet = new Set();
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data?.furnitureId) {
          nextSet.add(String(data.furnitureId));
        }
      });
      setReviewedFurnitureIds(nextSet);
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    if (route.params?.initialStatus) {
      setSelectedStatus(route.params.initialStatus);
    }
  }, [route.params?.initialStatus]);

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      "Xác nhận hủy đơn",
      "Bạn có chắc chắn muốn hủy đơn hàng này?",
      [
        {
          text: "Không",
          style: "cancel"
        },
        {
          text: "Có",
          onPress: async () => {
            const result = await cancelOrder(orderId);
            if (result.success) {
              setNotification({
                visible: true,
                message: result.message
              });
              // Tự động ẩn thông báo sau 5 giây
              setTimeout(() => {
                setNotification({ visible: false, message: '' });
              }, 5000);
            } else {
              Alert.alert("Lỗi", result.message);
            }
          }
        }
      ]
    );
  };

  const closeNotification = () => {
    setNotification({ visible: false, message: '' });
  };

  const openReviewModal = (furniture) => {
    const furnitureIdRaw = furniture.furnitureItem?.id || furniture.furnitureItem?.furnitureId || furniture.furnitureItem?.docId;
    const furnitureId = furnitureIdRaw ? String(furnitureIdRaw) : undefined;
    const furnitureName = furniture.furnitureItem?.furnitureName || 'Sản phẩm';
    if (furnitureId && reviewedFurnitureIds.has(furnitureId)) {
      return;
    }
    setSelectedReviewItem({ furnitureId, furnitureName });
    setReviewModalVisible(true);
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedReviewItem(null);
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt?.toDate()).toLocaleDateString('vi-VN')}
        </Text>
        <Text style={[styles.orderStatus, { color: PRIMARY }]}>{item.status}</Text>
      </View>
      {item.items && item.items.map((furniture, index) => (
        <View key={index} style={styles.furniItem}>
          <Text style={styles.furniName}>{furniture.furnitureItem?.furnitureName || 'Tên sản phẩm'}</Text>
          <View style={styles.furniDetails}>
            <Text style={styles.furniQuantity}>Số lượng: {furniture.soLuong || 0}</Text>
            <Text style={styles.furniPrice}>
              {(furniture.tongGia || 0).toLocaleString('vi-VN')} đ
            </Text>
          </View>
          {item.status === 'Đã đặt' && (() => {
            const furnitureIdRaw = furniture.furnitureItem?.id || furniture.furnitureItem?.furnitureId || furniture.furnitureItem?.docId;
            const furnitureId = furnitureIdRaw ? String(furnitureIdRaw) : undefined;
            const alreadyReviewed = furnitureId ? reviewedFurnitureIds.has(furnitureId) : false;
            if (alreadyReviewed) {
              return (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedBadgeText}>Đã đánh giá</Text>
                </View>
              );
            }
            return (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => openReviewModal(furniture)}
              >
                <Text style={styles.reviewButtonText}>Đánh giá</Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      ))}
      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>
          Tổng: <Text style={{ color: PRIMARY }}>{(item.totalAmount || 0).toLocaleString('vi-VN')} đ</Text>
        </Text>
        <Text style={styles.deliveryAddress}>
          <MaterialIcons name="location-on" size={16} color={PRIMARY} /> Địa chỉ: {item.deliveryAddress}
        </Text>
        {item.status === 'Chờ giao hàng' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(item.id)}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <InventoryRestoreNotification
        visible={notification.visible}
        message={notification.message}
        onClose={closeNotification}
      />
      <WriteReview
        visible={reviewModalVisible}
        onClose={closeReviewModal}
        furnitureId={selectedReviewItem?.furnitureId}
        furnitureName={selectedReviewItem?.furnitureName}
        onReviewSubmitted={() => {
          if (selectedReviewItem?.furnitureId) {
            setReviewedFurnitureIds(prev => {
              const next = new Set(prev);
              next.add(String(selectedReviewItem.furnitureId));
              return next;
            });
          }
          closeReviewModal();
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Kiểm tra xem có thể goBack không, nếu không thì navigate về Home
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }]
            });
          }
        }}>
          <View style={styles.backButton}>
            <Icon name="arrow-back" size={22} color={PRIMARY} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        {/* Thêm nút Home để chắc chắn */}
        <TouchableOpacity 
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }]
            });
          }}
          style={styles.homeButton}
        >
          <Icon name="home" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <FlatList
          data={statusList}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedStatus(item)}
              style={[
                styles.statusTab,
                selectedStatus === item && styles.activeStatusTab,
              ]}
            >
              <Text
                style={[
                  styles.statusTabText,
                  selectedStatus === item && styles.activeStatusTabText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={orders.filter(order => order.status === selectedStatus)}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có đơn hàng nào trong trạng thái này</Text>
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
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
    color: PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  homeButton: {
    borderWidth: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: SECONDARY,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeStatusTab: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  statusTabText: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '500',
  },
  activeStatusTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  orderItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderDate: {
    fontSize: 14,
    color: '#4B5563',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  furniItem: {
    marginVertical: 5,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  furniName: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },
  furniDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  furniQuantity: {
    fontSize: 14,
    color: '#4B5563',
  },
  furniPrice: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '500',
  },
  orderFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 5,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#E6E8F0',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000D66',
  },
  cancelButtonText: {
    color: '#000D66',
    fontWeight: '500',
    fontSize: 14,
  },
  reviewButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewedBadge: {
    backgroundColor: '#E6E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  reviewedBadgeText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Order;