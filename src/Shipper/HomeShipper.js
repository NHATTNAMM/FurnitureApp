import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadOrdersRealTime, updateOrderStatus, LogOut } from '../Firebase/FirebaseAPI';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { UserContext } from '../Firebase/UserContext';

const HomeShipper = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadOrdersRealTime(null, (orderData) => {
        if (orderData) {
          const pending = orderData.filter(order => order.status === 'Chờ giao hàng');
          const inProgress = orderData.filter(order => order.status === 'Đang giao');
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
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        Alert.alert('Thành công', result.message);
      } else {
        Alert.alert('Lỗi', result.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const handleLogout = async () => {
    const result = await LogOut();
    if (result.success) {
      navigation.reset({ index: 0, routes: [{ name: 'LogIn' }] });
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={16} color="#000D66" />
            <Text style={styles.orderTime}>
              {formatTime(item.createdAt?.toDate())} - {formatDate(item.createdAt?.toDate())}
            </Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'Chờ giao hàng' ? styles.pendingBadge : styles.inProgressBadge]}>
            <Text style={styles.orderStatus}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.orderTotal}>
            {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items && item.items.map((furnitureItem, index) => (
          <View key={index} style={styles.furniItem}>
            <View style={styles.furniInfo}>
              <Text style={styles.furniName}>{furnitureItem.furnitureItem?.furnitureName || 'Tên sản phẩm'}</Text>
              <View style={styles.furniDetails}>
                <Text style={styles.furniQuantity}>Số lượng: {furnitureItem.soLuong || 0}</Text>
                <Text style={styles.furniPrice}>
                  {(furnitureItem.tongGia || 0).toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.deliveryInfo}>
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#000D66" />
          <Text style={styles.deliveryAddress}>{item.deliveryAddress}</Text>
        </View>
      </View>

      {item.status === 'Chờ giao hàng' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleUpdateStatus(item.id, 'Đang giao')}
        >
          <MaterialIcons name="local-shipping" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Nhận đơn</Text>
        </TouchableOpacity>
      )}

      {item.status === 'Đang giao' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => handleUpdateStatus(item.id, 'Đã đặt')}
        >
          <MaterialIcons name="check-circle" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          <MaterialIcons 
            name="pending-actions" 
            size={24} 
            color={activeTab === 'pending' ? '#000D66' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Chờ giao hàng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inProgress' && styles.activeTab]}
          onPress={() => setActiveTab('inProgress')}
        >
          <MaterialIcons 
            name="local-shipping" 
            size={24} 
            color={activeTab === 'inProgress' ? '#000D66' : '#666'} 
          />
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
            <MaterialIcons name="inbox" size={50} color="#000D66" />
            <Text style={styles.emptyText}>
              Không có đơn hàng {activeTab === 'pending' ? 'chờ giao' : 'đang giao'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    height: 80,
    backgroundColor: '#000D66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 5,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  logoutButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#F0F4FF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#000D66',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#FFF',
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    marginBottom: 15,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  inProgressBadge: {
    backgroundColor: '#E3F2FD',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000D66',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000D66',
  },
  itemsContainer: {
    marginVertical: 10,
  },
  furniItem: {
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  furniInfo: {
    flex: 1,
  },
  furniName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  furniDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  furniQuantity: {
    fontSize: 14,
    color: '#666',
  },
  furniPrice: {
    fontSize: 14,
    color: '#666',
  },
  deliveryInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  acceptButton: {
    backgroundColor: '#000D66',
  },
  completeButton: {
    backgroundColor: '#000D66',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeShipper;