import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadCartRealTime } from '../../Firebase/FirebaseAPI';

const InProgressOrders = () => {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user && user.id) {
      const unsubscribe = loadCartRealTime(user.id, (cartData) => {
        if (cartData) {
          const inProgressOrders = cartData.filter((item) => item.status === 'Đang giao');
          setOrders(inProgressOrders);
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
        ListEmptyComponent={<Text style={styles.emptyText}>Không có đơn hàng đang giao</Text>}
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
});

export default InProgressOrders;