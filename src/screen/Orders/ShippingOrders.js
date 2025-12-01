import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadCartRealTime } from '../../Firebase/FirebaseAPI';
import { useNavigation } from '@react-navigation/native';

const ShippingOrders = () => {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadCartRealTime(user.id, (cartData) => {
        if (cartData) {
          const shippingOrders = cartData.filter((item) => item.status === 'Chờ giao hàng');
          // Sắp xếp đơn hàng mới nhất lên trên
          const sortedOrders = shippingOrders.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || a.addedAt || 0;
            const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || b.addedAt || 0;
            return timeB - timeA; // Sắp xếp giảm dần (mới nhất trước)
          });
          setOrders(sortedOrders);
        }
      });
      return unsubscribe;
    }
  }, [user]);

  const renderItem = ({ item }) => {
    console.log('ShippingOrders - Order item:', item);
    return (
      <TouchableOpacity 
        style={styles.orderItem}
        onPress={() => {
          console.log('ShippingOrders - Navigating to OrderDetail');
          navigation.navigate('OrderDetail', { order: item });
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.furniName}>{item.furnitureItem?.furnitureName || 'Tên sản phẩm'}</Text>
        <Text>Số lượng: {item.soLuong}</Text>
        <Text>Tổng: {item.tongGia.toLocaleString('vi-VN')} đ</Text>
        <Text style={styles.viewDetailText}>Xem chi tiết →</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có đơn hàng chờ giao hàng</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  orderItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  furniName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  viewDetailText: {
    color: '#2196F3',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default ShippingOrders;