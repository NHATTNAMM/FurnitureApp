import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { UserContext } from '../Firebase/UserContext';
import { loadCart } from '../Firebase/FirebaseAPI';

const CartScreen = () => {
  const { user } = useContext(UserContext);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = loadCart(user.id, setCartItems);
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [user]);

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.tongGia || 0), 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Giỏ Hàng</Text>
      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item, idx) => (item.id ? item.id.toString() : idx.toString())}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image
                  source={{ uri: item.furnitureItem?.image || item.furnitureItem?.furnitureImage || 'https://via.placeholder.com/80' }}
                  style={styles.image}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.furnitureItem?.furnitureName || item.furniName}</Text>
                  <Text style={styles.price}>{item.furnitureItem?.furniturePrice || item.furniPrice} đ</Text>
                  <Text style={styles.quantity}>Số lượng: {item.soLuong}</Text>
                  <Text style={styles.total}>Tổng: {item.tongGia} đ</Text>
                </View>
              </View>
            )}
          />
          <View style={styles.footer}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{getTotal()} đ</Text>
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>Giỏ hàng của bạn hiện tại trống.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f8fa' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000d66' },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  price: { fontSize: 15, color: '#000d66', fontWeight: '600', marginVertical: 2 },
  quantity: { fontSize: 14, color: '#666' },
  total: { fontSize: 14, color: '#ff4444', fontWeight: 'bold' },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#000d66' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#ff4444' },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 40 },
});

export default CartScreen;
