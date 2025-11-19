import React, { useEffect, useState, useContext, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Image, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadOrdersRealTime, updateOrderStatus, LogOut } from '../Firebase/FirebaseAPI';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { UserContext } from '../Firebase/UserContext';
import NewOrderNotification from '../component/NewOrderNotification';

const HomeShipper = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showNotification, setShowNotification] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const previousPendingCount = useRef(0);

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadOrdersRealTime(null, (orderData) => {
        if (orderData) {
          const pending = orderData
            .filter(order => order.status === 'Chờ giao hàng')
            .sort((a, b) => {
              const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return timeA - timeB; // Đơn cũ nhất lên trên
            });
          
          const inProgress = orderData
            .filter(order => order.status === 'Đang giao')
            .sort((a, b) => {
              const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return timeA - timeB; // Đơn cũ nhất lên trên
            });
          
          // Kiểm tra nếu có đơn hàng mới
          const currentPendingCount = pending.length;
          if (currentPendingCount > previousPendingCount.current && previousPendingCount.current > 0) {
            const newOrders = currentPendingCount - previousPendingCount.current;
            setNewOrderCount(newOrders);
            setShowNotification(true);
          }
          previousPendingCount.current = currentPendingCount;
          
          setPendingOrders(pending);
          setInProgressOrders(inProgress);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    Alert.alert(
      'Xác nhận',
      newStatus === 'Đang giao' 
        ? 'Bạn có chắc muốn nhận đơn hàng này?' 
        : 'Xác nhận đơn hàng đã giao thành công?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const result = await updateOrderStatus(orderId, newStatus);
              if (result.success) {
                Alert.alert('Thành công', result.message);
                setShowDetailModal(false);
              } else {
                Alert.alert('Lỗi', result.message);
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    const result = await LogOut();
    if (result.success) {
      navigation.reset({ index: 0, routes: [{ name: 'LogIn' }] });
    }
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
        <View style={styles.orderRow}>
          <View style={[styles.statusBadge, item.status === 'Chờ giao hàng' ? styles.pendingBadge : styles.inProgressBadge]}>
            <MaterialIcons 
              name={item.status === 'Chờ giao hàng' ? 'pending-actions' : 'local-shipping'} 
              size={16} 
              color="#000D66" 
            />
            <Text style={styles.orderStatus}>{item.status}</Text>
          </View>
          <View>
            <Text style={styles.orderTotal}>
              {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
            </Text>
            {item.paymentStatus === 'completed' && (
              <Text style={styles.collectAmount}>Thu: 0đ</Text>
            )}
            {item.paymentStatus === 'pending' && (
              <Text style={styles.collectAmount}>Thu: {(item.totalAmount || 0).toLocaleString('vi-VN')}đ</Text>
            )}
          </View>
        </View>
        {item.paymentStatus === 'completed' && (
          <View style={styles.paidBadge}>
            <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
            <Text style={styles.paidText}>Đã thanh toán online</Text>
          </View>
        )}
      </View>

      <View style={styles.quickInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="shopping-bag" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.items?.length || 0} sản phẩm
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatDate(item.createdAt?.toDate())}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatTime(item.createdAt?.toDate())}
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
      <NewOrderNotification
        visible={showNotification}
        orderCount={newOrderCount}
        onPress={() => {
          setShowNotification(false);
          setActiveTab('pending');
        }}
        onClose={() => setShowNotification(false)}
      />
      
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/furniturelogo.png')} 
          style={styles.headerLogo}
        />
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <View style={styles.tabIconContainer}>
            <MaterialIcons 
              name="pending-actions" 
              size={24} 
              color={activeTab === 'pending' ? '#000D66' : '#666'} 
            />
            {pendingOrders.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingOrders.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Chờ giao hàng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inProgress' && styles.activeTab]}
          onPress={() => setActiveTab('inProgress')}
        >
          <View style={styles.tabIconContainer}>
            <MaterialIcons 
              name="local-shipping" 
              size={24} 
              color={activeTab === 'inProgress' ? '#000D66' : '#666'} 
            />
            {inProgressOrders.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{inProgressOrders.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === 'inProgress' && styles.activeTabText]}>
            Đang giao
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'pending' ? pendingOrders : inProgressOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name={activeTab === 'pending' ? 'inbox' : 'check-circle'} 
              size={60} 
              color="#CCCCCC" 
            />
            <Text style={styles.emptyText}>
              {activeTab === 'pending' 
                ? 'Không có đơn hàng chờ giao' 
                : 'Không có đơn hàng đang giao'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'pending' 
                ? 'Các đơn hàng mới sẽ hiện ở đây' 
                : 'Các đơn bạn đã nhận sẽ hiện ở đây'}
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
                  {/* Header Card với thông tin tổng quan */}
                  <View style={styles.orderSummaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <MaterialIcons name="access-time" size={20} color="#666" />
                        <View style={styles.summaryTextContainer}>
                          <Text style={styles.summaryLabel}>Thời gian</Text>
                          <Text style={styles.summaryValue}>
                            {formatTime(selectedOrder.createdAt?.toDate())}
                          </Text>
                          <Text style={styles.summaryDate}>
                            {formatDate(selectedOrder.createdAt?.toDate())}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <MaterialIcons name="shopping-bag" size={20} color="#666" />
                        <View style={styles.summaryTextContainer}>
                          <Text style={styles.summaryLabel}>Sản phẩm</Text>
                          <Text style={styles.summaryValue}>
                            {selectedOrder.items?.length || 0} món
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Trạng thái thanh toán nổi bật */}
                  <View style={[styles.paymentStatusCard, selectedOrder.paymentStatus === 'completed' ? styles.paidCard : styles.unpaidCard]}>
                    <MaterialIcons 
                      name={selectedOrder.paymentStatus === 'completed' ? 'check-circle' : 'money'} 
                      size={28} 
                      color={selectedOrder.paymentStatus === 'completed' ? '#4CAF50' : '#FF9800'} 
                    />
                    <View style={styles.paymentStatusContent}>
                      <Text style={[styles.paymentStatusTitle, selectedOrder.paymentStatus === 'completed' ? styles.paidTitle : styles.unpaidTitle]}>
                        {selectedOrder.paymentStatus === 'completed' 
                          ? (selectedOrder.paymentMethod === 'ewallet' 
                              ? `Đã thanh toán qua ${selectedOrder.walletProvider?.toUpperCase() || 'Ví điện tử'}` 
                              : 'Đã thanh toán online')
                          : 'Thu tiền khi giao'}
                      </Text>
                      <Text style={[styles.paymentStatusAmount, selectedOrder.paymentStatus === 'completed' ? styles.paidAmount : styles.unpaidAmount]}>
                        {selectedOrder.paymentStatus === 'completed' ? '0 đ' : `${(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ`}
                      </Text>
                    </View>
                  </View>

                  {/* Địa chỉ giao hàng */}
                  <View style={styles.addressCard}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="location" size={22} color="#000D66" />
                      <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
                    </View>
                    <Text style={styles.addressText}>{selectedOrder.deliveryAddress}</Text>
                  </View>

                  {/* Danh sách sản phẩm */}
                  <View style={styles.productsCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="inventory" size={22} color="#000D66" />
                      <Text style={styles.cardTitle}>Sản phẩm ({selectedOrder.items?.length || 0})</Text>
                    </View>
                    {selectedOrder.items && selectedOrder.items.map((furnitureItem, index) => (
                      <View key={index} style={styles.productItemNew}>
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
                        <View style={styles.productInfoNew}>
                          <Text style={styles.productNameNew} numberOfLines={2}>
                            {furnitureItem.furnitureItem?.furnitureName || 'Tên sản phẩm'}
                          </Text>
                          <View style={styles.productBottomRow}>
                            <Text style={styles.productQuantityNew}>SL: x{furnitureItem.soLuong || 0}</Text>
                            <Text style={styles.productPriceNew}>
                              {(furnitureItem.tongGia || 0).toLocaleString('vi-VN')} đ
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Tổng cộng */}
                  <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Tổng đơn hàng</Text>
                    <Text style={styles.totalValue}>
                      {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              {selectedOrder?.status === 'Chờ giao hàng' && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.acceptButtonModal]}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'Đang giao')}
                >
                  <MaterialIcons name="local-shipping" size={22} color="#FFF" />
                  <Text style={styles.modalButtonText}>Nhận đơn giao hàng</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'Đang giao' && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.completeButtonModal]}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'Đã đặt')}
                >
                  <MaterialIcons name="check-circle" size={22} color="#FFF" />
                  <Text style={styles.modalButtonText}>Xác nhận đã giao</Text>
                </TouchableOpacity>
              )}
            </View>
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
    height: 70,
    backgroundColor: '#000D66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerLogo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  logoutButton: {
    position: 'absolute',
    right: 15,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
    backgroundColor: '#F5F7FA',
  },
  activeTab: {
    backgroundColor: '#000D66',
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 12,
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
    borderLeftColor: '#000D66',
  },
  orderHeader: {
    marginBottom: 12,
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
    marginTop: 8,
  },
  paidText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  inProgressBadge: {
    backgroundColor: '#E3F2FD',
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000D66',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000D66',
  },
  collectAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 2,
  },
  quickInfo: {
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
    paddingBottom: 0,
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
    paddingBottom: 10,
  },
  // New card-based styles
  orderSummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000D66',
  },
  summaryDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  paymentStatusCard: {
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
  paymentStatusContent: {
    flex: 1,
  },
  paymentStatusTitle: {
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
  paymentStatusAmount: {
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
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingLeft: 0,
  },
  productsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productItemNew: {
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
  productInfoNew: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productNameNew: {
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
  productQuantityNew: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  productPriceNew: {
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
    marginBottom: 0,
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
  modalActions: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  acceptButtonModal: {
    backgroundColor: '#000D66',
  },
  completeButtonModal: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeShipper;