import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../../Firebase/UserContext';

const { width } = Dimensions.get('window');
const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';
const ACCENT = '#E91E63';

const OrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params || {};
  const { user } = useContext(UserContext);

  // Kiểm tra nếu không có dữ liệu đơn hàng
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Không tìm thấy thông tin đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Hàm tính ngày dự kiến giao hàng (thêm 3-5 ngày từ ngày đặt)
  const getEstimatedDeliveryDate = () => {
    if (!order.createdAt) return 'Chưa xác định';
    
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt?.seconds * 1000);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 4); // Thêm 4 ngày
    
    return deliveryDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Hàm format ngày giờ
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Chưa cập nhật';
    
    const date = timestamp?.toDate?.() || new Date(timestamp?.seconds * 1000);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hàm lấy màu và icon trạng thái
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Chờ xác nhận':
        return { color: '#FFA726', icon: 'clock-outline', bg: '#FFF3E0' };
      case 'Chờ giao hàng':
        return { color: '#2196F3', icon: 'cube-outline', bg: '#E3F2FD' };
      case 'Đang giao':
        return { color: '#9C27B0', icon: 'bicycle-outline', bg: '#F3E5F5' };
      case 'Đã đặt':
        return { color: '#4CAF50', icon: 'checkmark-circle-outline', bg: '#E8F5E9' };
      case 'Đã hủy':
        return { color: '#F44336', icon: 'close-circle-outline', bg: '#FFEBEE' };
      default:
        return { color: '#757575', icon: 'help-circle-outline', bg: '#FAFAFA' };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Trạng thái đơn hàng */}
        <View style={[styles.statusContainer, { backgroundColor: statusInfo.bg }]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={32} color="#fff" />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Trạng thái đơn hàng</Text>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {order.status}
              </Text>
              {order.status === 'Đang giao' && (
                <Text style={styles.statusSubtext}>
                  Đơn hàng đang được vận chuyển đến bạn
                </Text>
              )}
              {order.status === 'Chờ giao hàng' && (
                <Text style={styles.statusSubtext}>
                  Đơn hàng đang được chuẩn bị
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Thông tin sản phẩm */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart-outline" size={20} color={PRIMARY} />
            <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
            <View style={styles.productCountBadge}>
              <Text style={styles.productCountText}>
                {`${order.items ? order.items.length : 1} SP`}
              </Text>
            </View>
          </View>
          {order.items && order.items.length > 0 ? (
            // Nếu có items array (từ Order.js)
            order.items.map((item, index) => (
              <View key={index} style={[styles.productCard, index > 0 && { marginTop: 12 }]}>
                <Image
                  source={{ uri: item.furnitureItem?.image || item.furnitureItem?.images?.[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.furnitureItem?.furnitureName || 'Tên sản phẩm'}
                  </Text>
                  <View style={styles.priceSection}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Đơn giá:</Text>
                      <Text style={styles.productPrice}>
                        {(item.furnitureItem?.price || item.furnitureItem?.furniturePrice || (item.tongGia / item.soLuong) || 0).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.productQuantity}>x{item.soLuong}</Text>
                    </View>
                  </View>
                  <View style={styles.productTotal}>
                    <Text style={styles.productTotalLabel}>Thành tiền:</Text>
                    <Text style={styles.productTotalValue}>
                      {(item.tongGia || 0).toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            // Format đơn giản (từ PendingOrders, etc.)
            <View style={styles.productCard}>
              <Image
                source={{ uri: order.furnitureItem?.image || order.furnitureItem?.images?.[0] }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {order.furnitureItem?.furnitureName || 'Tên sản phẩm'}
                </Text>
                <View style={styles.priceSection}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Đơn giá:</Text>
                    <Text style={styles.productPrice}>
                      {(order.furnitureItem?.price || order.furnitureItem?.furniturePrice || (order.tongGia / order.soLuong) || 0).toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.productQuantity}>x{order.soLuong}</Text>
                  </View>
                </View>
                <View style={styles.productTotal}>
                  <Text style={styles.productTotalLabel}>Thành tiền:</Text>
                  <Text style={styles.productTotalValue}>
                    {(order.tongGia || 0).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Thông tin giao hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={PRIMARY} />
            <Text style={styles.sectionTitle}>Thông tin người đặt</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="person" size={18} color={PRIMARY} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Người đặt hàng</Text>
                <Text style={styles.infoValue}>
                  {user?.fullName || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="call" size={18} color={PRIMARY} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>
                  {user?.phone || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color={PRIMARY} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Địa chỉ giao hàng</Text>
                <Text style={styles.infoValue}>
                  {user?.address || order.deliveryAddress || order.address || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thời gian & Thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={PRIMARY} />
            <Text style={styles.sectionTitle}>Thông tin đặt hàng</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="calendar-outline" size={18} color={PRIMARY} />
                <Text style={styles.timeLabel}>Ngày đặt hàng</Text>
              </View>
              <Text style={styles.timeValue}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="time-outline" size={18} color={PRIMARY} />
                <Text style={styles.timeLabel}>Dự kiến giao</Text>
              </View>
              <Text style={styles.timeValue}>{getEstimatedDeliveryDate()}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <MaterialCommunityIcons name="credit-card-outline" size={18} color={PRIMARY} />
                <Text style={styles.timeLabel}>Thanh toán</Text>
              </View>
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod === 'cod' ? 'COD (Tiền mặt)' : 
                 order.paymentMethod === 'qr' ? 'Chuyển khoản QR' : 
                 order.paymentMethod === 'ewallet' ? 'Ví điện tử' : 
                 'COD (Tiền mặt)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chi tiết thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color={PRIMARY} />
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          </View>
          <View style={styles.paymentCard}>
            {/* Tạm tính - Tính từ tổng tiền sản phẩm (chưa có phí ship) */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tạm tính</Text>
              <Text style={styles.paymentValue}>
                {(() => {
                  // Tính tổng tiền sản phẩm
                  let productTotal = 0;
                  if (order.items && order.items.length > 0) {
                    productTotal = order.items.reduce((sum, item) => sum + (item.tongGia || 0), 0);
                  } else {
                    productTotal = order.tongGia || 0;
                  }
                  return productTotal.toLocaleString('vi-VN');
                })()}đ
              </Text>
            </View>

            {/* Giảm giá sản phẩm (nếu có) */}
            {order.discount && order.discount > 0 && (
              <View style={styles.paymentRow}>
                <View style={styles.discountLabelWrapper}>
                  <Ionicons name="pricetag" size={16} color="#4CAF50" />
                  <Text style={[styles.paymentLabel, { marginLeft: 6 }]}>Giảm giá sản phẩm</Text>
                </View>
                <Text style={styles.discountValue}>
                  -{order.discount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            {/* Mã giảm giá (nếu có) */}
            {order.voucherDiscount && order.voucherDiscount > 0 && (
              <View style={styles.paymentRow}>
                <View style={styles.discountLabelWrapper}>
                  <Ionicons name="ticket" size={16} color="#FF9800" />
                  <Text style={[styles.paymentLabel, { marginLeft: 6 }]}>
                    {order.voucherCode ? `Mã giảm giá (${order.voucherCode})` : 'Mã giảm giá'}
                  </Text>
                </View>
                <Text style={styles.discountValue}>
                  -{order.voucherDiscount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            {/* Khuyến mãi (nếu có) */}
            {order.promotionDiscount && order.promotionDiscount > 0 && (
              <View style={styles.paymentRow}>
                <View style={styles.discountLabelWrapper}>
                  <Ionicons name="gift" size={16} color="#E91E63" />
                  <Text style={[styles.paymentLabel, { marginLeft: 6 }]}>
                    {order.promotionName ? `Khuyến mãi (${order.promotionName})` : 'Khuyến mãi'}
                  </Text>
                </View>
                <Text style={styles.discountValue}>
                  -{order.promotionDiscount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            {/* Phí vận chuyển */}
            <View style={styles.paymentRow}>
              <View style={styles.shippingLabelWrapper}>
                <Ionicons name="bicycle" size={16} color="#2196F3" />
                <Text style={[styles.paymentLabel, { marginLeft: 6 }]}>Phí vận chuyển</Text>
              </View>
              <Text style={!order.shippingFee || order.shippingFee === 0 ? styles.freeShipping : styles.paymentValue}>
                {!order.shippingFee || order.shippingFee === 0 
                  ? 'Miễn phí' 
                  : `${order.shippingFee.toLocaleString('vi-VN')}đ`
                }
              </Text>
            </View>

            {/* Giảm giá vận chuyển (nếu có) */}
            {order.shippingDiscount && order.shippingDiscount > 0 && (
              <View style={styles.paymentRow}>
                <View style={styles.discountLabelWrapper}>
                  <Ionicons name="bicycle" size={16} color="#4CAF50" />
                  <Text style={[styles.paymentLabel, { marginLeft: 6 }]}>Giảm phí vận chuyển</Text>
                </View>
                <Text style={styles.discountValue}>
                  -{order.shippingDiscount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            <View style={styles.paymentDivider} />
            
            {/* Tổng thanh toán */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>
                {(() => {
                  // Tính tổng tiền sản phẩm
                  let productTotal = 0;
                  if (order.items && order.items.length > 0) {
                    productTotal = order.items.reduce((sum, item) => sum + (item.tongGia || 0), 0);
                  } else {
                    productTotal = order.tongGia || 0;
                  }
                  
                  // Tổng = Tạm tính - các loại giảm giá + phí ship - giảm phí ship
                  const total = productTotal
                    - (order.discount || 0) 
                    - (order.voucherDiscount || 0) 
                    - (order.promotionDiscount || 0) 
                    + (order.shippingFee || 0) 
                    - (order.shippingDiscount || 0);
                  
                  return total.toLocaleString('vi-VN');
                })()}đ
              </Text>
            </View>
          </View>
        </View>

        {/* Ghi chú */}
        {order.note && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Ghi chú</Text>
            </View>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          </View>
        )}

        {/* Padding bottom */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
  
  // Status Container
  statusContainer: {
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Section
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginLeft: 8,
    flex: 1,
  },
  productCountBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Product Card
  productCard: {
    flexDirection: 'row',
    backgroundColor: SECONDARY,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
    lineHeight: 20,
    marginBottom: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: ACCENT,
    fontWeight: '700',
  },
  quantityBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  productQuantity: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '700',
  },
  productTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  productTotalLabel: {
    fontSize: 13,
    color: '#666',
  },
  productTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: SECONDARY,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  
  // Time
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
  },
  paymentMethodText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
  },
  
  // Payment Card
  paymentCard: {
    backgroundColor: SECONDARY,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '600',
  },
  discountLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountValue: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '700',
  },
  shippingLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeShipping: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 15,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    borderStyle: 'dashed',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: ACCENT,
  },
  
  // Note Card
  noteCard: {
    backgroundColor: SECONDARY,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default OrderDetailScreen;
