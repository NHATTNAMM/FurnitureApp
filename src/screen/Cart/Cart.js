import React, { useEffect, useState, useContext } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { UserContext } from '../../Firebase/UserContext';
import { loadCartRealTime, checkoutOrders, calculateDiscountedPrice, updateCartQuantity, removeFromCart } from '../../Firebase/FirebaseAPI';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PriceDisplay from '../../component/PriceDisplay';
import CustomCheckbox from '../../component/CustomCheckbox';

const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';

const Cart = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [cart, setCart] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('Chờ xác nhận');
  const statusList = ['Chờ xác nhận', 'Chờ giao hàng', 'Đang giao', 'Đã đặt', 'Đã hủy'];
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      const unsubscribeUser = loadCartRealTime(user.id, (cartData) => {
        if (cartData) {
          setCart(cartData);
          // Auto-select all items in "Chờ xác nhận" status ONLY on first load
          if (isFirstLoad && selectedStatus === 'Chờ xác nhận') {
            const itemsToSelect = cartData
              .filter(item => !item.status || item.status === 'Chờ xác nhận')
              .map(item => item.furnitureItem?.furnitureId)
              .filter(id => id);
            setSelectedItems(new Set(itemsToSelect));
            setIsFirstLoad(false);
          }
        }
      });
      return unsubscribeUser;
    }
  }, [user]);

  const toggleSelectItem = (furnitureId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(furnitureId)) {
        newSet.delete(furnitureId);
      } else {
        newSet.add(furnitureId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const itemsInCurrentStatus = cart.filter(
      item => !item.status || item.status === 'Chờ xác nhận'
    );
    
    if (selectedItems.size === itemsInCurrentStatus.length && itemsInCurrentStatus.length > 0) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      const allIds = itemsInCurrentStatus
        .map(item => item.furnitureItem?.furnitureId)
        .filter(id => id);
      setSelectedItems(new Set(allIds));
    }
  };

  const handleRemove = async (itemId) => {
    if (!user || !user.id) return;
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          const result = await removeFromCart(user.id, itemId);
          if (result.success) {
            Alert.alert('Thành công', result.message);
            // Remove from selected items
            setSelectedItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemId);
              return newSet;
            });
          } else {
            Alert.alert('Lỗi', result.message);
          }
        }
      }
    ]);
  };

  const handleChangeQuantity = async (item, change) => {
    if (!user || !user.id) return;
    
    const furnitureId = item.furnitureItem?.furnitureId;
    if (!furnitureId) return;
    
    const newQuantity = (item.soLuong || 1) + change;
    if (newQuantity < 1) {
      Alert.alert('Thông báo', 'Số lượng không thể nhỏ hơn 1');
      return;
    }
    
    const result = await updateCartQuantity(user.id, furnitureId, newQuantity);
    
    if (!result.success) {
      Alert.alert('Lỗi', result.message);
    }
  };

  const renderItem = ({ item }) => {
    const furnitureId = item.furnitureItem?.furnitureId;
    const isSelected = selectedItems.has(furnitureId);
    
    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.cardHeader}>
          {selectedStatus === 'Chờ xác nhận' && (
            <CustomCheckbox
              value={isSelected}
              onValueChange={() => toggleSelectItem(furnitureId)}
              tintColor={PRIMARY}
              style={styles.checkbox}
            />
          )}
          <Image 
            source={{ uri: item.furnitureItem?.image }} 
            style={styles.productImage}
            resizeMode="cover"
          />
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
        {/* Hiển thị giá sản phẩm */}
        <View style={[styles.priceRow, selectedStatus === 'Chờ xác nhận' && styles.priceRowWithPadding]}>
          <PriceDisplay 
            originalPrice={item.furnitureItem?.furniturePrice || 0}
            discountPercentage={item.furnitureItem?.discountPercentage}
            fontSize={16}
          />
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.quantityButton, item.soLuong <= 1 && styles.disabledButton]}
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
        </View>
        <View style={[styles.cardBody, selectedStatus === 'Chờ xác nhận' && styles.cardBodyWithPadding]}>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status || 'Chờ xác nhận'}</Text>
          <Text style={styles.totalItemPrice}>
            Tổng: {(item.tongGia || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>
    );
  };  const getStatusColor = (status) => {
    switch (status) {
      case 'Chờ xác nhận':
        return PRIMARY;
      case 'Chờ giao hàng':
        return '#007BFF';
      case 'Đang giao':
        return '#28A745';
      case 'Đã đặt':
        return '#6C757D';
      case 'Đã hủy':
        return '#E53935';
      default:
        return PRIMARY;
    }
  };

  const calculateTotal = () => {
    const total = cart
      .filter((item) => {
        const furnitureId = item.furnitureItem?.furnitureId;
        return (!item.status || item.status === 'Chờ xác nhận') && selectedItems.has(furnitureId);
      })
      .reduce((sum, item) => sum + (item.tongGia || 0), 0);
    return total.toLocaleString('vi-VN') + ' đ';
  };

  const getSelectedCount = () => {
    return selectedItems.size;
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
        Alert.alert("Thông báo", "Vui lòng đăng nhập để tiếp tục!");
        return;
    }

    const ordersToCheckout = cart.filter(
        (item) => {
          const furnitureId = item.furnitureItem?.furnitureId;
          return (!item.status || item.status === 'Chờ xác nhận') && 
                 item.furnitureItem && 
                 selectedItems.has(furnitureId);
        }
    );

    if (ordersToCheckout.length === 0) {
        Alert.alert("Thông báo", "Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
        return;
    }

    // Navigate to payment screen with selected items
    navigation.navigate('PaymentScreen', { 
      selectedItems: ordersToCheckout,
      totalAmount: ordersToCheckout.reduce((sum, item) => sum + (item.tongGia || 0), 0)
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: SECONDARY }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={styles.backButton}>
              <Icon name="arrow-back" size={22} color={PRIMARY} />
            </View>
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
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={styles.selectAllBottomButton}
              onPress={toggleSelectAll}
            >
              <CustomCheckbox
                value={selectedItems.size > 0 && selectedItems.size === cart.filter(item => !item.status || item.status === 'Chờ xác nhận').length}
                onValueChange={toggleSelectAll}
                tintColor={PRIMARY}
              />
              <Text style={styles.selectAllBottomText}>Chọn tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.checkoutButton, selectedItems.size === 0 && styles.checkoutButtonDisabled]} 
              onPress={handleCheckout}
              disabled={selectedItems.size === 0}
            >
              <Text style={styles.checkoutButtonText}>
                Thanh toán ({getSelectedCount()})
              </Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    borderWidth: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    flex: 1,
    textAlign: 'center',
    marginRight: 50,
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
  cardSelected: {
    borderColor: PRIMARY,
    borderWidth: 2,
    backgroundColor: '#F0F4FF',
  },
  checkbox: {
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  priceRowWithPadding: {
    paddingLeft: 32, // Thẳng hàng với cạnh trái của ảnh (checkbox 8px + checkboxMargin 8px + một phần căn chỉnh 16px)
  },
  totalItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28A745',
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
  cardBodyWithPadding: {
    paddingLeft: 32, // Thẳng hàng với cạnh trái của ảnh (checkbox 8px + checkboxMargin 8px + một phần căn chỉnh 16px)
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
  disabledButton: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 5,
  },
  selectAllBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  selectAllBottomText: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 8,
  },
  checkoutButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});

export default Cart;