import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { UserContext } from '../Firebase/UserContext';
import { checkoutOrders } from '../Firebase/FirebaseAPI';
import { calculateDeliveryDistance } from '../services/LocationService';

const PaymentScreen = ({ navigation, route }) => {
  const { user } = useContext(UserContext);
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'qr', hoặc 'ewallet'
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEWalletModal, setShowEWalletModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('momo'); // 'momo', 'zalopay', 'vnpay'
  const [walletPassword, setWalletPassword] = useState('');
  const [deliveryDistance, setDeliveryDistance] = useState(null); // Khoảng cách giao hàng (km)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const otpInputRef = React.useRef(null);

  useEffect(() => {
    // Nhận dữ liệu từ Cart screen
    if (route.params?.selectedItems) {
      setCartItems(route.params.selectedItems);
    }
  }, [route.params]);

  // Tính khoảng cách giao hàng khi có địa chỉ
  useEffect(() => {
    const calculateDistance = async () => {
      if (user?.address && user.address.trim() !== '') {
        setIsCalculatingDistance(true);
        try {
          const distance = await calculateDeliveryDistance(user.address);
          setDeliveryDistance(distance);
        } catch (error) {
          console.error('Error calculating distance:', error);
          setDeliveryDistance(10); // Mặc định 10km nếu lỗi
        } finally {
          setIsCalculatingDistance(false);
        }
      } else {
        setDeliveryDistance(10); // Mặc định 10km nếu chưa có địa chỉ
      }
    };

    calculateDistance();
  }, [user?.address]);

  const getSubTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.tongGia || 0), 0);
  };

  // Lấy khoảng cách giao hàng thực tế
  const getDeliveryDistance = () => {
    return deliveryDistance || 10; // Mặc định 10km nếu chưa tính được
  };

  const getBaseShippingFee = () => {
    const subTotal = getSubTotal();
    const FREE_SHIPPING_THRESHOLD = 500000; // 500K
    const MAX_SHIPPING_FEE = 80000; // Giới hạn tối đa 80K
    
    // Miễn phí vận chuyển nếu đơn hàng >= 500K
    if (subTotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    
    // Tính phí theo khoảng cách khi đơn < 500K
    // Công thức: 3.000đ/5km
    const distance = getDeliveryDistance();
    const ratePerKm = 3000; // 3K/km
    
    let shippingFee = distance * ratePerKm;
    
    // Đảm bảo không vượt quá 80K
    return Math.min(shippingFee, MAX_SHIPPING_FEE);
  };

  const getShippingDiscount = () => {
    const subTotal = getSubTotal();
    const FREE_SHIPPING_THRESHOLD = 500000; // 500K
    
    // Hiển thị voucher miễn phí khi đơn >= 500K
    if (subTotal >= FREE_SHIPPING_THRESHOLD) {
      return getBaseShippingFee(); // Giảm toàn bộ phí vận chuyển
    }
    
    return 0; // Không có voucher khi đơn < 500K
  };

  const getShippingFee = () => {
    return Math.max(0, getBaseShippingFee() - getShippingDiscount());
  };

  const getTotal = () => {
    return getSubTotal() + getShippingFee();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handlePlaceOrder = async () => {
    if (!user || !user.id) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để tiếp tục!");
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Thông báo", "Không có sản phẩm để đặt hàng!");
      return;
    }

    // Kiểm tra thông tin giao hàng
    if (!user.address || !user.phone || !user.fullName) {
      Alert.alert(
        "Thiếu thông tin giao hàng", 
        "Vui lòng cập nhật đầy đủ thông tin (tên, số điện thoại, địa chỉ) trong hồ sơ trước khi đặt hàng.",
        [
          { text: "Hủy", style: "cancel" },
          { 
            text: "Cập nhật", 
            onPress: () => navigation.navigate('ProfileDetail')
          }
        ]
      );
      return;
    }

    if (paymentMethod === 'qr') {
      setShowQRModal(true);
    } else if (paymentMethod === 'ewallet') {
      setShowEWalletModal(true);
    } else {
      // Xử lý đặt hàng COD
      Alert.alert(
        "Xác nhận đặt hàng",
        `Bạn có muốn đặt hàng với tổng tiền ${formatPrice(getTotal())}đ và thanh toán khi nhận hàng?`,
        [
          { text: "Hủy", style: "cancel" },
          { 
            text: "Đặt hàng", 
            onPress: () => processOrder('cod')
          }
        ]
      );
    }
  };

  const processOrder = async (paymentType) => {
    try {
      const groupedOrder = {
        items: cartItems.map(item => ({
          furnitureItem: {
            furnitureName: item.furnitureItem?.furnitureName || 'Tên sản phẩm',
            ...item.furnitureItem
          },
          soLuong: item.soLuong || 0,
          tongGia: item.tongGia || 0
        })),
        totalAmount: getTotal(),
        shippingFee: getBaseShippingFee(),
        shippingDiscount: getShippingDiscount(),
        paymentMethod: paymentType,
        paymentStatus: paymentType === 'cod' ? 'pending' : 'completed',
        walletProvider: paymentType === 'ewallet' ? selectedWallet : null,
        createdAt: new Date(),
        status: 'Chờ giao hàng',
        userId: user.id,
        deliveryAddress: user?.address || 'Địa chỉ chưa được cập nhật'
      };

      const result = await checkoutOrders(user.id, [groupedOrder]);

      if (result.success) {
        const paymentMethodText = 
          paymentType === 'cod' ? 'thanh toán khi nhận hàng' : 
          paymentType === 'qr' ? 'QR Pay' :
          `ví ${selectedWallet.toUpperCase()}`;
        
        Alert.alert(
          "Đặt hàng thành công!", 
          `Đơn hàng của bạn đã được đặt thành công với phương thức ${paymentMethodText}.`,
          [
            {
              text: "Về trang chủ",
              style: "cancel",
              onPress: () => {
                // Reset về Home và xóa toàn bộ stack
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }]
                });
              }
            },
            {
              text: "Xem đơn hàng",
              onPress: () => {
                // Reset với cả Home và Order để có thể back
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    { name: 'Order', params: { initialStatus: 'Chờ giao hàng' } }
                  ]
                });
              }
            }
          ]
        );
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error.message);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi đặt hàng!");
    }
  };

  const handleQRPayment = () => {
    setShowQRModal(false);
    processOrder('qr');
  };

  // Tạo mã đơn hàng duy nhất
  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const userId = user?.id?.slice(-4) || '0000';
    return `FS${userId}${timestamp}${random}`;
  };

  // Tạo mã QR code data (đầy đủ thông tin cho hệ thống)
  const getQRData = () => {
    const qrData = {
      orderId: generateOrderId(),
      amount: getTotal(),
      currency: 'VND',
      description: `Thanh toán đơn hàng nội thất - ${cartItems.length} sản phẩm`,
      customerInfo: {
        userId: user?.id,
        name: user?.fullName,
        phone: user?.phone,
        address: user?.address
      },
      items: cartItems.map(item => ({
        id: item.id,
        name: item.tenSanPham,
        quantity: item.soLuong,
        price: item.tongGia
      })),
      shipping: {
        fee: getShippingFee(),
        discount: getShippingDiscount()
      },
      timestamp: new Date().toISOString(),
      storeInfo: 'Furniture Store - Nội thất cao cấp'
    };
    return JSON.stringify(qrData);
  };

  // Tạo mã thanh toán đơn giản cho người dùng xem
  const getSimplePaymentCode = () => {
    const orderData = JSON.parse(getQRData());
    return `${orderData.orderId}|${getTotal()}|${cartItems.length}SP`;
  };

  // Hàm sao chép mã QR đơn giản
  const handleCopyQR = async () => {
    try {
      const simpleCode = getSimplePaymentCode();
      const orderData = JSON.parse(getQRData());
      
      Alert.alert(
        "Mã thanh toán", 
        `Mã đơn hàng: ${orderData.orderId}\n` +
        `Số tiền: ${formatPrice(getTotal())}đ\n` +
        `Số lượng: ${cartItems.length} sản phẩm\n\n` +
        `Sử dụng app ngân hàng để quét QR hoặc liên hệ cửa hàng với mã: ${simpleCode}`,
        [
          { text: "Đóng", style: "cancel" },
          { 
            text: "Sao chép mã", 
            onPress: () => {
              // Giả lập copy mã đơn giản
              Alert.alert("Đã sao chép!", `Mã: ${simpleCode}`);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo mã thanh toán");
    }
  };

  // Hàm chia sẻ mã QR
  const handleShareQR = () => {
    Alert.alert(
      "Chia sẻ mã thanh toán",
      "Bạn có thể chia sẻ mã này qua tin nhắn, email hoặc ứng dụng khác.",
      [{ text: "OK" }]
    );
  };

  const handleEWalletPayment = () => {
    setShowEWalletModal(true);
  };

  const handleConfirmEWallet = () => {
    setShowEWalletModal(false);
    setWalletPassword('');
    // Mở modal nhập mật khẩu ví
    setTimeout(() => {
      setShowOTPModal(true);
    }, 300);
  };

  const handleVerifyWalletPassword = () => {
    const WALLET_PASSWORD = '123456';
    
    if (walletPassword.trim() === '') {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu ví');
      return;
    }
    
    if (walletPassword === WALLET_PASSWORD) {
      // Mật khẩu đúng - xử lý thanh toán
      setShowOTPModal(false);
      setWalletPassword('');
      
      Alert.alert(
        'Xác thực thành công',
        'Đang xử lý thanh toán...',
        [{ text: 'OK' }]
      );
      
      // Giả lập xử lý thanh toán
      setTimeout(() => {
        processOrder('ewallet');
      }, 1500);
    } else {
      // Mật khẩu sai
      Alert.alert(
        'Xác thực thất bại',
        'Mật khẩu ví không chính xác. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
      setWalletPassword('');
    }
  };

  const getWalletLogo = (wallet) => {
    const logos = {
      momo: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
      zalopay: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay.png',
      vnpay: 'https://stcd02206177151.cloud.edgevnpay.vn/assets/images/logo-primary.svg'
    };
    return logos[wallet];
  };

  const getWalletColor = (wallet) => {
    const colors = {
      momo: '#D82D8B',
      zalopay: '#0068FF',
      vnpay: '#005BAA'
    };
    return colors[wallet];
  };

  const PaymentMethodOption = ({ method, title, subtitle, icon, selected, onPress }) => (
    <TouchableOpacity 
      style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
      onPress={onPress}
    >
      <View style={styles.paymentOptionLeft}>
        <View style={[styles.paymentIcon, { 
          backgroundColor: method === 'cod' ? '#e8f5e8' : 
                          method === 'qr' ? '#ffe8e8' : '#fff3e0' 
        }]}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={method === 'cod' ? '#2d7d32' : 
                   method === 'qr' ? '#d32f2f' : '#FF9800'} 
          />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>{title}</Text>
          <Text style={styles.paymentSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
        {selected && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#000D66" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Địa chỉ giao hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color="#ff4444" />
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileDetail')}>
              <Text style={styles.changeButton}>Thay đổi</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.userName}>
              {user?.fullName || 'Chưa cập nhật tên'}
            </Text>
            <Text style={styles.userPhone}>
              {user?.phone || 'Chưa cập nhật số điện thoại'}
            </Text>
            <Text style={styles.userAddress}>
              {user?.address || 'Chưa cập nhật địa chỉ giao hàng'}
            </Text>
            
            {/* Hiển thị khoảng cách giao hàng */}
            {user?.address && (
              <View style={styles.distanceContainer}>
                <MaterialIcons name="local-shipping" size={16} color="#000D66" />
                <Text style={styles.distanceText}>
                  {isCalculatingDistance ? (
                    'Đang tính khoảng cách...'
                  ) : (
                    `Khoảng cách giao hàng: ~${deliveryDistance || 10} km`
                  )}
                </Text>
              </View>
            )}
            
            {/* Cảnh báo nếu thiếu thông tin */}
            {(!user?.fullName || !user?.phone || !user?.address) && (
              <View style={styles.warningContainer}>
                <MaterialIcons name="warning" size={16} color="#FF9800" />
                <Text style={styles.warningText}>
                  Vui lòng cập nhật đầy đủ thông tin giao hàng
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Thông tin sản phẩm */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-cart" size={20} color="#000D66" />
            <Text style={styles.sectionTitle}>Thông tin hàng</Text>
          </View>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.productItem}>
              {item.furnitureItem?.image || item.furnitureItem?.furnitureImage || item.furnitureItem?.imageUrl ? (
                <Image
                  source={{ 
                    uri: item.furnitureItem?.image || 
                         item.furnitureItem?.furnitureImage || 
                         item.furnitureItem?.imageUrl
                  }}
                  style={styles.productImage}
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error);
                  }}
                />
              ) : (
                <View style={[styles.productImage, styles.placeholderContainer]}>
                  <MaterialIcons name="chair" size={24} color="#999" />
                  <Text style={styles.placeholderText}>Nội thất</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.furnitureItem?.furnitureName || item.furniName || 'Sản phẩm'}
                </Text>
                <Text style={styles.productPrice}>
                  {formatPrice(item.furnitureItem?.furniturePrice || item.furniPrice || 0)}đ
                </Text>
                <Text style={styles.productQuantity}>SL: {item.soLuong}</Text>
              </View>
              <Text style={styles.productTotal}>
                {formatPrice(item.tongGia)}đ
              </Text>
            </View>
          ))}
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={20} color="#000D66" />
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <TouchableOpacity>
              <Text style={styles.changeButton}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          <PaymentMethodOption
            method="cod"
            title="Thanh toán khi nhận hàng"
            subtitle="Thanh toán bằng tiền mặt"
            icon="cash-outline"
            selected={paymentMethod === 'cod'}
            onPress={() => setPaymentMethod('cod')}
          />
          
          <PaymentMethodOption
            method="qr"
            title="QR Pay"
            subtitle="Quét mã QR để thanh toán online"
            icon="qr-code-outline"
            selected={paymentMethod === 'qr'}
            onPress={() => setPaymentMethod('qr')}
          />
          
          <PaymentMethodOption
            method="ewallet"
            title="Ví điện tử"
            subtitle="MoMo, ZaloPay, VNPay"
            icon="wallet-outline"
            selected={paymentMethod === 'ewallet'}
            onPress={() => setPaymentMethod('ewallet')}
          />
        </View>

        {/* Voucher khuyến mãi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-offer" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Voucher khuyến mãi</Text>
            <TouchableOpacity>
              <Text style={styles.changeButton}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
          
          {getSubTotal() >= 500000 ? (
            <View style={styles.voucherApplied}>
              <View style={styles.voucherIcon}>
                <MaterialIcons name="local-offer" size={24} color="#4CAF50" />
              </View>
              <View style={styles.voucherInfo}>
                <Text style={styles.voucherTitle}>Miễn phí vận chuyển</Text>
                <Text style={styles.voucherDescription}>Đơn hàng từ 500K được miễn phí ship</Text>
                <Text style={styles.voucherValue}>Giảm: {formatPrice(getShippingDiscount())}đ</Text>
              </View>
              <View style={styles.voucherBadge}>
                <Text style={styles.voucherBadgeText}>Đã áp dụng</Text>
              </View>
            </View>
          ) : (
            <View style={styles.voucherUnavailable}>
              <View style={styles.voucherIconGray}>
                <MaterialIcons name="local-offer" size={24} color="#9CA3AF" />
              </View>
              <View style={styles.voucherInfo}>
                <Text style={styles.voucherTitleGray}>Miễn phí vận chuyển</Text>
                <Text style={styles.voucherDescriptionGray}>
                  Mua thêm {formatPrice(500000 - getSubTotal())}đ để được miễn phí ship
                </Text>
              </View>
              <View style={styles.voucherBadgeGray}>
                <Text style={styles.voucherBadgeTextGray}>Chưa đủ điều kiện</Text>
              </View>
            </View>
          )}
        </View>

        {/* Chi tiết thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={20} color="#000D66" />
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          </View>
          
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tổng tiền hàng</Text>
              <Text style={styles.paymentValue}>{formatPrice(getSubTotal())}đ</Text>
            </View>
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>
                Phí vận chuyển {getSubTotal() < 500000 ? `(~${getDeliveryDistance()}km)` : ''}
              </Text>
              <Text style={styles.paymentValue}>
                {getSubTotal() >= 500000 
                  ? 'Miễn phí' 
                  : formatPrice(getBaseShippingFee()) + 'đ'
                }
              </Text>
            </View>
            
            {getShippingDiscount() > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Giảm giá phí vận chuyển</Text>
                <Text style={[styles.paymentValue, styles.discountValue]}>
                  -{formatPrice(getShippingDiscount())}đ
                </Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>{formatPrice(getTotal())}đ</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Footer với nút đặt hàng */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.footerTotalLabel}>Tổng cộng</Text>
          <Text style={styles.footerTotalValue}>{formatPrice(getTotal())}đ</Text>
          {getShippingDiscount() > 0 && (
            <Text style={styles.footerSaving}>Tiết kiệm {formatPrice(getShippingDiscount())}đ phí ship</Text>
          )}
        </View>
        <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder}>
          <Text style={styles.orderButtonText}>Đặt hàng</Text>
        </TouchableOpacity>
      </View>

      {/* QR Payment Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <Image
                source={{ 
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getQRData())}`
                }}
                style={styles.qrImage}
              />
              
              {/* Nút sao chép QR */}
              <TouchableOpacity style={styles.copyQRButton} onPress={handleCopyQR}>
                <Ionicons name="copy-outline" size={16} color="#000D66" />
                <Text style={styles.copyQRText}>Sao chép mã QR</Text>
              </TouchableOpacity>
              
              <Text style={styles.qrAmount}>Số tiền: {formatPrice(getTotal())}đ</Text>
              <Text style={styles.qrInstruction}>
                Quét mã QR bằng ứng dụng ngân hàng để thanh toán nhanh chóng
              </Text>
              
              {/* Hiển thị thông tin đơn giản cho user */}
              <View style={styles.orderSummaryContainer}>
                <Text style={styles.orderSummaryTitle}>Thông tin đơn hàng:</Text>
                <Text style={styles.orderSummaryItem}>• Mã: {getSimplePaymentCode().split('|')[0]}</Text>
                <Text style={styles.orderSummaryItem}>• Sản phẩm: {cartItems.length} sản phẩm</Text>
                <Text style={styles.orderSummaryItem}>• Tổng tiền: {formatPrice(getTotal())}đ</Text>
              </View>
            </View>
            
            <View style={styles.qrActions}>
              <TouchableOpacity 
                style={styles.qrCancelButton} 
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.qrCancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.qrShareButton} 
                onPress={handleCopyQR}
              >
                <Ionicons name="share-outline" size={16} color="#FF9800" />
                <Text style={styles.qrShareText}>Chia sẻ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.qrConfirmButton} 
                onPress={handleQRPayment}
              >
                <Text style={styles.qrConfirmText}>Đã thanh toán</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* E-Wallet Payment Modal */}
      <Modal
        visible={showEWalletModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ewalletModal}>
            <View style={styles.ewalletHeader}>
              <Text style={styles.ewalletTitle}>Chọn ví điện tử</Text>
              <TouchableOpacity onPress={() => setShowEWalletModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ewalletContainer}>
              <Text style={styles.ewalletAmount}>Số tiền thanh toán: {formatPrice(getTotal())}đ</Text>
              
              {/* MoMo */}
              <TouchableOpacity 
                style={[styles.walletOption, selectedWallet === 'momo' && styles.walletOptionSelected]}
                onPress={() => setSelectedWallet('momo')}
              >
                <View style={styles.walletLeft}>
                  <View style={[styles.walletIconContainer, { backgroundColor: '#FFF0F5' }]}>
                    <Image 
                      source={require('../../assets/images/logomomo.png')}
                      style={styles.walletLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>MoMo</Text>
                    <Text style={styles.walletDesc}>Ví điện tử MoMo</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, selectedWallet === 'momo' && styles.radioButtonSelected]}>
                  {selectedWallet === 'momo' && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>

              {/* ZaloPay */}
              <TouchableOpacity 
                style={[styles.walletOption, selectedWallet === 'zalopay' && styles.walletOptionSelected]}
                onPress={() => setSelectedWallet('zalopay')}
              >
                <View style={styles.walletLeft}>
                  <View style={[styles.walletIconContainer, { backgroundColor: '#E6F0FF' }]}>
                    <Image 
                      source={require('../../assets/images/logozalopay.png')}
                      style={styles.walletLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>ZaloPay</Text>
                    <Text style={styles.walletDesc}>Ví điện tử ZaloPay</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, selectedWallet === 'zalopay' && styles.radioButtonSelected]}>
                  {selectedWallet === 'zalopay' && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>

              {/* VNPay */}
              <TouchableOpacity 
                style={[styles.walletOption, selectedWallet === 'vnpay' && styles.walletOptionSelected]}
                onPress={() => setSelectedWallet('vnpay')}
              >
                <View style={styles.walletLeft}>
                  <View style={[styles.walletIconContainer, { backgroundColor: '#E6F3FF' }]}>
                    <Image 
                      source={require('../../assets/images/logovnpay.png')}
                      style={styles.walletLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>VNPay</Text>
                    <Text style={styles.walletDesc}>Ví điện tử VNPay</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, selectedWallet === 'vnpay' && styles.radioButtonSelected]}>
                  {selectedWallet === 'vnpay' && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>

              <View style={styles.ewalletNote}>
                <MaterialIcons name="info-outline" size={16} color="#666" />
                <Text style={styles.ewalletNoteText}>
                  Bạn sẽ được chuyển đến ứng dụng ví để hoàn tất thanh toán
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.ewalletConfirmButton} 
              onPress={handleConfirmEWallet}
            >
              <Text style={styles.ewalletConfirmText}>Tiếp tục thanh toán</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP/Password Verification Modal */}
      <Modal
        visible={showOTPModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowOTPModal(false);
          setWalletPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModal}>
            <View style={styles.otpHeader}>
              <Text style={styles.otpTitle}>Xác thực ví điện tử</Text>
              <TouchableOpacity onPress={() => {
                setShowOTPModal(false);
                setWalletPassword('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.otpContainer}>
              <View style={styles.walletInfoBox}>
                <Image 
                  source={
                    selectedWallet === 'momo' ? require('../../assets/images/logomomo.png') :
                    selectedWallet === 'zalopay' ? require('../../assets/images/logozalopay.png') :
                    require('../../assets/images/logovnpay.png')
                  }
                  style={styles.walletLogoLarge}
                  resizeMode="contain"
                />
                <Text style={styles.walletNameLarge}>{selectedWallet.toUpperCase()}</Text>
              </View>
              
              <Text style={styles.otpAmount}>Số tiền: {formatPrice(getTotal())}đ</Text>
              
              <View style={styles.otpInputContainer}>
                <Text style={styles.otpLabel}>Nhập mật khẩu ví</Text>
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => otpInputRef.current?.focus()}
                  style={styles.otpBoxesWrapper}
                >
                  <View style={styles.otpBoxesContainer}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <View key={index} style={styles.otpBox}>
                        <Text style={styles.otpBoxText}>
                          {walletPassword[index] ? '•' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpHiddenInput}
                    value={walletPassword}
                    onChangeText={setWalletPassword}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus={true}
                    caretHidden={true}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.otpNote}>
                <MaterialIcons name="info-outline" size={16} color="#666" />
                <Text style={styles.otpNoteText}>
                  Nhập mật khẩu ví để xác thực giao dịch
                </Text>
              </View>
            </View>
            
            <View style={styles.otpActions}>
              <TouchableOpacity 
                style={styles.otpCancelButton} 
                onPress={() => {
                  setShowOTPModal(false);
                  setWalletPassword('');
                }}
              >
                <Text style={styles.otpCancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.otpConfirmButton} 
                onPress={handleVerifyWalletPassword}
              >
                <Text style={styles.otpConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000D66',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  changeButton: {
    fontSize: 14,
    color: '#000D66',
    fontWeight: '500',
  },
  // Địa chỉ
  addressContainer: {
    paddingLeft: 28,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F0F4FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000D66',
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 13,
    color: '#000D66',
    fontWeight: '600',
    marginLeft: 6,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 4,
    fontWeight: '500',
  },
  // Sản phẩm
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginLeft: 28,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: '#000D66',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Phương thức thanh toán
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  paymentOptionSelected: {
    borderColor: '#000D66',
    backgroundColor: '#f8f9ff',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#000D66',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000D66',
  },
  // Chi tiết thanh toán
  paymentDetails: {
    paddingLeft: 28,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    color: '#FF5722', // Màu cam đỏ nổi bật để thu hút sự chú ý
    fontWeight: '700', // Làm đậm hơn
    fontSize: 15, // Tăng size một chút
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  // Voucher Styles
  voucherApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginLeft: 28,
  },
  voucherIcon: {
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  voucherDescription: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 4,
  },
  voucherValue: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '600',
  },
  voucherBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voucherBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Voucher không khả dụng
  voucherUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 28,
  },
  voucherIconGray: {
    marginRight: 12,
  },
  voucherTitleGray: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  voucherDescriptionGray: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  voucherBadgeGray: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voucherBadgeTextGray: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000D66',
  },
  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000D66',
  },
  footerSaving: {
    fontSize: 12,
    color: '#d32f2f',
  },
  orderButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 16,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxWidth: 350,
    width: '90%',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000D66',
    marginBottom: 12,
  },
  copyQRText: {
    fontSize: 12,
    color: '#000D66',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Thay thế qrCodeContainer cũ bằng orderSummaryContainer
  orderSummaryContainer: {
    width: '100%',
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 15,
  },
  orderSummaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000D66',
    marginBottom: 6,
  },
  orderSummaryItem: {
    fontSize: 12,
    color: '#555',
    marginBottom: 3,
    lineHeight: 16,
  },
  qrCodeText: {
    flex: 1,
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },
  qrCodeCopyButton: {
    padding: 4,
    marginLeft: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000D66',
  },
  qrAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000D66',
    marginBottom: 8,
  },
  qrInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qrCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
    alignItems: 'center',
  },
  qrCancelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  qrShareButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
    marginHorizontal: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  qrShareText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 4,
  },
  qrConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginLeft: 6,
    alignItems: 'center',
  },
  qrConfirmText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  // E-Wallet Modal
  ewalletModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '90%',
  },
  ewalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ewalletTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ewalletContainer: {
    marginBottom: 20,
  },
  ewalletAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000D66',
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  walletOptionSelected: {
    borderColor: '#000D66',
    borderWidth: 2,
    backgroundColor: '#F8F9FF',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  walletLogo: {
    width: 40,
    height: 40,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  walletDesc: {
    fontSize: 13,
    color: '#666',
  },
  ewalletNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ewalletNoteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  ewalletConfirmButton: {
    backgroundColor: '#000D66',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ewalletConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // OTP Modal
  otpModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '90%',
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  otpContainer: {
    marginBottom: 20,
  },
  walletInfoBox: {
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  walletLogoLarge: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  walletNameLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000D66',
  },
  otpAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000D66',
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  otpInputContainer: {
    marginBottom: 16,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpBoxesWrapper: {
    position: 'relative',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#000D66',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  otpBoxText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000D66',
  },
  otpHiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#000D66',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#fff',
  },
  otpHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  otpNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 8,
  },
  otpNoteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  otpCancelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  otpConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#000D66',
    marginLeft: 8,
    alignItems: 'center',
  },
  otpConfirmText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});

export default PaymentScreen;