import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadCartRealTime, checkoutOrders, addToCart } from '../../Firebase/FirebaseAPI';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';

const Cart = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [cart, setCart] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('Chờ xác nhận');
  const statusList = ['Chờ xác nhận', 'Chờ giao hàng', 'Đang giao', 'Đã đặt'];

  useEffect(() => {
    if (user && user.id) {
      const unsubscribeUser = loadCartRealTime(user.id, (cartData) => {
        if (cartData) {
          setCart(cartData);
        }
      });
      return unsubscribeUser;
    }
  }, [user]);

  const handleRemove = async (itemId) => {
    if (!user || !user.id) return;
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          const updatedCart = cart.filter(item => item.furnitureItem?.furnitureId !== itemId);
          setCart(updatedCart);
        }
      }
    ]);
  };

  const handleChangeQuantity = async (item, change) => {
    if (!user || !user.id) return;
    const newQuantity = (item.soLuong || 1) + change;
    if (newQuantity < 1) return;
    if (item.furnitureItem) {
      await addToCart(user.id, {
        furnitureItem: item.furnitureItem,
        soLuong: change,
        tongGia: change * (item.furnitureItem.furniturePrice || 0)
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.furniName}>{item.furnitureItem?.furnitureName || 'Tên sản phẩm'}</Text>
          <View style={styles.freeshipTag}>
            <Text style={styles.freeshipText}>Freeship</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.furnitureItem?.furnitureId)}
        >
          <MaterialIcons name="delete-outline" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleChangeQuantity(item, -1)}
            disabled={item.soLuong <= 1}
          >
            <Icon name="remove" size={16} color={item.soLuong <= 1 ? '#9CA3AF' : PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.soLuong || 0}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleChangeQuantity(item, 1)}
          >
            <Icon name="add" size={16} color={PRIMARY} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status || 'Chờ xác nhận'}</Text>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chờ xác nhận':
        return PRIMARY;
      case 'Chờ giao hàng':
        return '#007BFF';
      case 'Đang giao':
        return '#28A745';
      case 'Đã đặt':
        return '#6C757D';
      default:
        return PRIMARY;
    }
  };

  const calculateTotal = () => {
    const total = cart
      .filter((item) => !item.status || item.status === 'Chờ xác nhận')
      .reduce((sum, item) => sum + (item.tongGia || 0), 0);
    return total.toLocaleString('vi-VN') + ' đ';
  };

  const renderContent = () => {
    const filteredCart = cart.filter(
      (item) =>
        selectedStatus === 'Chờ xác nhận'
          ? !item.status || item.status === 'Chờ xác nhận'
          : item.status === selectedStatus
    );

    if (filteredCart.length === 0) {
      return <Text style={styles.emptyText}>Chưa có đơn hàng trong trạng thái này</Text>;
    }

    return (
      <>
        <FlatList
          data={filteredCart}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
        {selectedStatus === 'Chờ xác nhận' && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Tổng: <Text style={{ color: PRIMARY }}>{calculateTotal()}</Text></Text>
          </View>
        )}
      </>
    );
  };

  const handleCheckout = async () => {
    if (!user || !user.id) {
        alert("Vui lòng đăng nhập để tiếp tục!");
        return;
    }

    const ordersToCheckout = cart.filter(
        (item) => (!item.status || item.status === 'Chờ xác nhận') && item.furnitureItem
    );

    if (ordersToCheckout.length === 0) {
        alert("Không có đơn hàng nào để thanh toán!");
        return;
    }

    try {
        const groupedOrder = {
            items: ordersToCheckout.map(item => ({
                furnitureItem: {
                    furnitureName: item.furnitureItem.furnitureName || 'Tên sản phẩm',
                    ...item.furnitureItem
                },
                soLuong: item.soLuong || 0,
                tongGia: item.tongGia || 0
            })),
            totalAmount: ordersToCheckout.reduce((sum, item) => sum + (item.tongGia || 0), 0),
            createdAt: new Date(),
            status: 'Chờ giao hàng',
            userId: user.id
        };

        const result = await checkoutOrders(user.id, [groupedOrder]);

        if (result.success) {
            alert(result.message);
            loadCartRealTime(user.id, (cartData) => {
                if (cartData) {
                    setCart(cartData);
                }
            });
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Lỗi khi thanh toán:", error.message);
        alert("Đã xảy ra lỗi khi thanh toán!");
    }
};

  return (
    <View style={{ flex: 1, backgroundColor: SECONDARY }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Giỏ hàng</Text>
        </View>
        <View style={styles.statusContainer}>
          <FlatList
            data={statusList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (selectedStatus === item) return;
                  navigation.navigate('Order', { initialStatus: item });
                }}
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
        <View style={styles.content}>{renderContent()}</View>
        {selectedStatus === 'Chờ xác nhận' && (
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>Thanh toán tất cả</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SECONDARY,
  },
  nav: {
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
  navTitle: {
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
  content: {
    flex: 1,
    padding: 15,
    backgroundColor: SECONDARY,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  furniName: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    marginBottom: 4,
  },
  freeshipTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  freeshipText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
  },
  cardBody: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY,
    padding: 4,
    borderRadius: 6,
  },
  quantityButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  totalContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});

export default Cart;