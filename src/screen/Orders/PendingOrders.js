import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadCartRealTime } from '../../Firebase/FirebaseAPI';

const PendingOrders = () => {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadCartRealTime(user.id, (cartData) => {
        if (cartData) {
          const pendingOrders = cartData.filter((item) => item.status === 'Chờ xác nhận');
          setOrders(pendingOrders);
        }
      });
      return unsubscribe;
    }
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.furniName}>{item.furnitureItem?.furnitureName || 'Tên sản phẩm'}</Text>
      <Text>Số lượng: {item.soLuong}</Text>
      <Text>Tổng: {item.tongGia.toLocaleString('vi-VN')} đ</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Không có đơn hàng chờ xác nhận</Text>}
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
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  furniName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PendingOrders;