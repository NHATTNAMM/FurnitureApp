import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../Firebase/UserContext';
import { loadOrdersRealTime } from '../Firebase/FirebaseAPI';

const ShipperHistory = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadOrdersRealTime(null, (orderData) => {
        if (orderData) {
          // Lọc các đơn hàng đã hoàn thành và sắp xếp theo thời gian mới nhất
          const completed = orderData
            .filter(order => order.status === 'Đã đặt')
            .sort((a, b) => {
              const timeA = a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(a.createdAt);
              const timeB = b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(b.createdAt);
              return timeB - timeA; // Đơn mới nhất lên trên
            });
          
          setCompletedOrders(completed);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFullDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${formatDate(timestamp)} lúc ${formatTime(timestamp)}`;
  };

  const getTotalEarnings = () => {
    return completedOrders.reduce((total, order) => {
      // Chỉ tính tiền từ đơn COD (chưa thanh toán online)
      if (order.paymentStatus === 'pending') {
        return total + (order.totalAmount || 0);
      }
      return total;
    }, 0);
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.statusBadge}>
          <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.orderStatus}>Đã giao thành công</Text>
        </View>
        <Text style={styles.orderTotal}>
          {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
        </Text>
      </View>

      {item.paymentStatus === 'completed' && (
        <View style={styles.paidBadge}>
          <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
          <Text style={styles.paidText}>Khách đã thanh toán online</Text>
        </View>
      )}

      {item.paymentStatus === 'pending' && (
        <View style={styles.codBadge}>
          <MaterialIcons name="money" size={14} color="#FF9800" />
          <Text style={styles.codText}>Đã thu: {(item.totalAmount || 0).toLocaleString('vi-VN')} đ</Text>
        </View>
      )}

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="shopping-bag" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.items?.length || 0} sản phẩm
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatDate(item.updatedAt || item.createdAt)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatTime(item.updatedAt || item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.addressPreview}>
        <Ionicons name="location" size={16} color="#000D66" />
        <Text style={styles.addressText} numberOfLines={1}>
          {item.deliveryAddress}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao hàng</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="assignment-turned-in" size={28} color="#4CAF50" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Đơn đã giao</Text>
            <Text style={styles.statValue}>{completedOrders.length}</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="account-balance-wallet" size={28} color="#FF9800" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Đã thu (COD)</Text>
            <Text style={styles.statValue}>
              {getTotalEarnings().toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={completedOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtext}>
              Các đơn hàng bạn đã giao thành công sẽ hiện ở đây
            </Text>
          </View>
        }
      />

      {/* Modal chi tiết đơn hàng */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close-circle" size={28} color="#000D66" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedOrder && (
                <>
                  {/* Success Badge */}
                  <View style={styles.successBanner}>
                    <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
                    <Text style={styles.successText}>Đã giao thành công</Text>
                    <Text style={styles.successDate}>
                      {formatFullDateTime(selectedOrder.updatedAt || selectedOrder.createdAt)}
                    </Text>
                  </View>

                  {/* Payment Info */}
                  <View style={[styles.paymentCard, selectedOrder.paymentStatus === 'completed' ? styles.paidCard : styles.unpaidCard]}>
                    <MaterialIcons 
                      name={selectedOrder.paymentStatus === 'completed' ? 'check-circle' : 'money'} 
                      size={28} 
                      color={selectedOrder.paymentStatus === 'completed' ? '#4CAF50' : '#FF9800'} 
                    />
                    <View style={styles.paymentContent}>
                      <Text style={[styles.paymentTitle, selectedOrder.paymentStatus === 'completed' ? styles.paidTitle : styles.unpaidTitle]}>
                        {selectedOrder.paymentStatus === 'completed' 
                          ? (selectedOrder.paymentMethod === 'ewallet' 
                              ? `Khách đã thanh toán qua ${selectedOrder.walletProvider?.toUpperCase() || 'Ví điện tử'}` 
                              : 'Khách đã thanh toán online')
                          : 'Đã thu tiền COD'}
                      </Text>
                      <Text style={[styles.paymentAmount, selectedOrder.paymentStatus === 'completed' ? styles.paidAmount : styles.unpaidAmount]}>
                        {selectedOrder.paymentStatus === 'completed' ? '0 đ' : `${(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ`}
                      </Text>
                    </View>
                  </View>

                  {/* Address */}
                  <View style={styles.addressCard}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="location" size={22} color="#000D66" />
                      <Text style={styles.cardTitle}>Địa chỉ đã giao</Text>
                    </View>
                    <Text style={styles.addressTextFull}>{selectedOrder.deliveryAddress}</Text>
                  </View>

                  {/* Products */}
                  <View style={styles.productsCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="inventory" size={22} color="#000D66" />
                      <Text style={styles.cardTitle}>Sản phẩm ({selectedOrder.items?.length || 0})</Text>
                    </View>
                    {selectedOrder.items && selectedOrder.items.map((furnitureItem, index) => (
                      <View key={index} style={styles.productItem}>
                        <Image 
                          source={{ 
                            uri: furnitureItem.furnitureItem?.image || 
                                 furnitureItem.furnitureItem?.productImage || 
                                 furnitureItem.furnitureItem?.furnitureImage || 
                                 'https://via.placeholder.com/80' 
                          }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={2}>
                            {furnitureItem.furnitureItem?.furnitureName || 'Tên sản phẩm'}
                          </Text>
                          <View style={styles.productBottomRow}>
                            <Text style={styles.productQuantity}>SL: x{furnitureItem.soLuong || 0}</Text>
                            <Text style={styles.productPrice}>
                              {(furnitureItem.tongGia || 0).toLocaleString('vi-VN')} đ
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Total */}
                  <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Tổng đơn hàng</Text>
                    <Text style={styles.totalValue}>
                      {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    height: 60,
    backgroundColor: '#000D66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 40,
  },
  statsCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000D66',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  statDivider: {
    width: 1,
    height: 70,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: '#FFF',
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    gap: 6,
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000D66',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  paidText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  codText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000D66',
  },
  modalBody: {
    padding: 20,
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 12,
    marginBottom: 8,
  },
  successDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    borderWidth: 2,
  },
  paidCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  unpaidCard: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  paidTitle: {
    color: '#2E7D32',
  },
  unpaidTitle: {
    color: '#E65100',
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  paidAmount: {
    color: '#4CAF50',
  },
  unpaidAmount: {
    color: '#FF9800',
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000D66',
  },
  addressTextFull: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  productsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 16,
    color: '#000D66',
    fontWeight: 'bold',
  },
  totalCard: {
    backgroundColor: '#000D66',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default ShipperHistory;
