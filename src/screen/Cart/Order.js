import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadOrdersRealTime, cancelOrder } from '../../Firebase/FirebaseAPI';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';

const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';

const Order = ({ navigation }) => {
  const route = useRoute();
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(route.params?.initialStatus || 'Chờ giao hàng');
  const statusList = ['Chờ giao hàng', 'Đang giao', 'Đã đặt', 'Đã hủy'];

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadOrdersRealTime(user.id, (orderData) => {
        if (orderData) {
          setOrders(orderData);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

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
            Alert.alert(
              result.success ? "Thành công" : "Lỗi",
              result.message
            );
          }
        }
      ]
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 24 }} />
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: SECONDARY,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    flex: 1,
    textAlign: 'center',
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
});

export default Order;