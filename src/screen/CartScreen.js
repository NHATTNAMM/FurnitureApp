import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../Firebase/UserContext';
import { loadCart } from '../Firebase/FirebaseAPI';

const CartScreen = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = loadCart(user.id, (items) => {
        // Sắp xếp theo timestamp nếu có, hoặc giữ nguyên thứ tự (mới nhất đã ở trên)
        const sortedItems = items.sort((a, b) => {
          const timeA = a.addedAt || 0;
          const timeB = b.addedAt || 0;
          return timeB - timeA; // Sắp xếp giảm dần (mới nhất trước)
        });
        setCartItems(sortedItems);
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [user]);

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.tongGia || 0), 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi thanh toán.');
      return;
    }
    // Chuyển tất cả items trong cart đến PaymentScreen
    navigation.navigate('PaymentScreen', { 
      selectedItems: cartItems,
      totalAmount: getTotal()
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerNav}>
        <View style={styles.iconBack} />
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={styles.iconBack} />
      </View>
      <View style={styles.content}>
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
                  <Text style={styles.price}>{formatPrice(item.furnitureItem?.furniturePrice || item.furniPrice)} đ</Text>
                  <Text style={styles.quantity}>Số lượng: {item.soLuong}</Text>
                  <Text style={styles.total}>Tổng: {formatPrice(item.tongGia)} đ</Text>
                </View>
              </View>
            )}
          />
          <View style={styles.footer}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>{formatPrice(getTotal())} đ</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>Giỏ hàng của bạn hiện tại trống.</Text>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f7f8fa' 
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconBack: {
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
    color: '#000D66',
  },
  content: {
    flex: 1,
    padding: 20,
  },
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
    elevation: 2,
  },
  totalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#000d66' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#ff4444' },
  checkoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 40 },
});

export default CartScreen;
