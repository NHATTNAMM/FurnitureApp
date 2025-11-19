import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, query, orderBy, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';
import { updateOrderStatus } from '../Firebase/FirebaseAPI';
import { Ionicons } from '@expo/vector-icons';
import InventoryRestoreNotification from '../component/InventoryRestoreNotification';

const OrderScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previousOrderCount, setPreviousOrderCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        ready: 0,
        delivering: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
        // Payment statistics
        codOrders: 0,
        qrOrders: 0,
        ewalletOrders: 0,
        paidOrders: 0,
        unpaidOrders: 0,
    });
    const [notification, setNotification] = useState({
        visible: false,
        message: ''
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            
            const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
                const ordersList = await Promise.all(
                    snapshot.docs.map(async (orderDoc) => {
                        const orderData = orderDoc.data();
                        // Fetch user information
                        let buyerName = 'Không xác định';
                        try {
                            if (orderData.userId) {
                                const userRef = doc(db, "User", orderData.userId);
                                const userSnap = await getDoc(userRef);
                                if (userSnap.exists()) {
                                    const userData = userSnap.data();
                                    buyerName = userData.fullName || 'Không xác định';
                                }
                            }
                        } catch (error) {
                            console.error("Lỗi khi lấy thông tin người dùng:", error);
                        }
                        return {
                            id: orderDoc.id,
                            ...orderData,
                            buyerName
                        };
                    })
                );
                setOrders(ordersList);

                // Kiểm tra đơn hàng mới
                if (!loading && ordersList.length > previousOrderCount) {
                    const newOrdersCount = ordersList.length - previousOrderCount;
                    console.log(`=== ADMIN: ${newOrdersCount} đơn hàng mới! ===`);
                    
                    // Hiển thị thông báo cho đơn hàng mới nhất
                    if (newOrdersCount > 0 && ordersList[0]) {
                        const latestOrder = ordersList[0];
                        const paymentText = 
                            latestOrder.paymentMethod === 'qr' ? 'QR Pay' : 
                            latestOrder.paymentMethod === 'ewallet' ? `${latestOrder.walletProvider?.toUpperCase() || 'E-Wallet'}` :
                            'COD';
                        const paymentStatusText = latestOrder.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán';
                        
                        setNotification({
                            visible: true,
                            message: `Đơn hàng mới: ${formatPrice(latestOrder.totalAmount)}đ - ${paymentText} (${paymentStatusText})`
                        });
                    }
                }
                
                setPreviousOrderCount(ordersList.length);

                // Calculate statistics
                const newStats = {
                    total: ordersList.length,
                    pending: ordersList.filter(order => order.status === 'Chờ xác nhận').length,
                    ready: ordersList.filter(order => order.status === 'Chờ giao hàng').length,
                    delivering: ordersList.filter(order => order.status === 'Đang giao').length,
                    completed: ordersList.filter(order => order.status === 'Đã đặt').length,
                    cancelled: ordersList.filter(order => order.status === 'Đã hủy').length,
                    revenue: ordersList
                        .filter(order => order.status !== 'Đã hủy')
                        .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                    // Payment statistics
                    codOrders: ordersList.filter(order => order.paymentMethod === 'cod').length,
                    qrOrders: ordersList.filter(order => order.paymentMethod === 'qr').length,
                    ewalletOrders: ordersList.filter(order => order.paymentMethod === 'ewallet').length,
                    paidOrders: ordersList.filter(order => order.paymentStatus === 'completed').length,
                    unpaidOrders: ordersList.filter(order => order.paymentStatus === 'pending').length,
                };
                setStats(newStats);
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error("Lỗi khi tải danh sách đơn hàng:", error);
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Chưa có';
        const date = timestamp.toDate();
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Chờ xác nhận':
                return '#FFA500';
            case 'Chờ giao hàng':
                return '#007BFF';
            case 'Đang giao':
                return '#28A745';
            case 'Đã đặt':
                return '#6C757D';
            case 'Đã hủy':
                return '#ff4444';
            default:
                return '#6C757D';
        }
    };

    const handleCancelOrder = async (orderId) => {
        Alert.alert(
            "Xác nhận hủy đơn",
            "Bạn có chắc chắn muốn hủy đơn hàng này? Số lượng sản phẩm sẽ được hoàn trả vào kho.",
            [
                {
                    text: "Không",
                    style: "cancel"
                },
                {
                    text: "Có",
                    onPress: async () => {
                        try {
                            const result = await updateOrderStatus(orderId, "Đã hủy");
                            if (result.success) {
                                setNotification({
                                    visible: true,
                                    message: result.message
                                });
                                // Tự động ẩn thông báo sau 5 giây
                                setTimeout(() => {
                                    setNotification({ visible: false, message: '' });
                                }, 5000);
                            } else {
                                Alert.alert("Lỗi", result.message);
                            }
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể hủy đơn hàng");
                        }
                    }
                }
            ]
        );
    };

    const closeNotification = () => {
        setNotification({ visible: false, message: '' });
    };

    // Lọc đơn hàng theo tìm kiếm
    const filteredOrders = orders.filter(order => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase().trim();
        
        // Tìm theo mã đơn
        if (order.id.toLowerCase().includes(query)) return true;
        
        // Tìm theo tên người mua
        if (order.buyerName && order.buyerName.toLowerCase().includes(query)) return true;
        
        // Tìm theo số điện thoại
        if (order.phoneNumber && order.phoneNumber.includes(query)) return true;
        
        // Tìm theo địa chỉ giao hàng
        if (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(query)) return true;
        
        return false;
    });

    // Cập nhật trạng thái thanh toán
    const updatePaymentStatus = async (orderId, newPaymentStatus) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                paymentStatus: newPaymentStatus,
                updatedAt: new Date()
            });
            console.log(`Payment status updated: ${orderId} -> ${newPaymentStatus}`);
        } catch (error) {
            console.error("Error updating payment status:", error);
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái thanh toán!");
        }
    };

    const renderOrderItem = ({ item, index }) => {
        // Kiểm tra đơn hàng mới (trong top 3 và thời gian tạo trong 5 phút gần đây)
        const isNewOrder = index < 3 && item.createdAt && 
            (new Date().getTime() - item.createdAt.toDate().getTime()) < 5 * 60 * 1000; // 5 phút

        return (
            <View style={[
                styles.orderCard, 
                item.status === 'Đã hủy' && styles.cancelledOrderCard,
                isNewOrder && styles.newOrderCard
            ]}>
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdContainer}>
                        <Text style={styles.orderId}>Mã đơn: {item.id}</Text>
                        {isNewOrder && <View style={styles.newBadge}><Text style={styles.newBadgeText}>MỚI</Text></View>}
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    </View>
                </View>

            <View style={styles.orderInfo}>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>Người mua: {item.buyerName}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>Địa chỉ: {item.deliveryAddress}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>Thời gian: {formatDate(item.createdAt)}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={20} color="#666" />
                    <Text style={[styles.infoText, item.status === 'Đã hủy' && styles.cancelledText]}>
                        Tổng tiền: {formatPrice(item.totalAmount)}
                    </Text>
                </View>

                {/* Thông tin phương thức thanh toán */}
                <View style={styles.infoRow}>
                    <Ionicons 
                        name={
                            item.paymentMethod === 'cod' ? 'wallet-outline' : 
                            item.paymentMethod === 'ewallet' ? 'card-outline' : 
                            'qr-code-outline'
                        } 
                        size={20} 
                        color="#666" 
                    />
                    <Text style={styles.infoText}>
                        Thanh toán: {
                            item.paymentMethod === 'cod' ? 'Tiền mặt khi nhận' : 
                            item.paymentMethod === 'ewallet' ? `E-Wallet (${item.walletProvider?.toUpperCase() || 'N/A'})` : 
                            'QR Pay'
                        }
                    </Text>
                    <TouchableOpacity 
                        style={[
                            styles.paymentStatusBadge, 
                            { backgroundColor: item.paymentStatus === 'completed' ? '#2196F3' : '#F44336' }
                        ]}
                        onPress={() => {
                            if (item.paymentStatus === 'pending') {
                                Alert.alert(
                                    "Cập nhật trạng thái thanh toán",
                                    "Đánh dấu đơn hàng này là đã thanh toán?",
                                    [
                                        { text: "Hủy", style: "cancel" },
                                        { text: "Xác nhận", onPress: () => updatePaymentStatus(item.id, 'completed') }
                                    ]
                                );
                            }
                        }}
                    >
                        <Text style={styles.paymentStatusText}>
                            {item.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.orderItems}>
                <Text style={styles.itemsTitle}>Chi tiết đơn hàng:</Text>
                {item.items?.map((orderItem, index) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={[styles.itemName, item.status === 'Đã hủy' && styles.cancelledText]}>
                            {orderItem.furnitureItem?.furnitureName || 'Tên sản phẩm'}
                        </Text>
                        <Text style={[styles.itemQuantity, item.status === 'Đã hủy' && styles.cancelledText]}>
                            x{orderItem.soLuong}
                        </Text>
                        <Text style={[styles.itemPrice, item.status === 'Đã hủy' && styles.cancelledText]}>
                            {formatPrice(orderItem.tongGia)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Action buttons */}
            {item.status !== 'Đã hủy' && item.status !== 'Đã đặt' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => handleCancelOrder(item.id)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000d66" />
                <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <InventoryRestoreNotification
                visible={notification.visible}
                message={notification.message}
                onClose={closeNotification}
            />
            <View style={styles.header}>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tổng số:</Text>
                        <Text style={styles.statValue}>{stats.total}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#FFA500' }]}>Chờ xác nhận:</Text>
                        <Text style={styles.statValue}>{stats.pending}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#007BFF' }]}>Chờ giao:</Text>
                        <Text style={styles.statValue}>{stats.ready}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#28A745' }]}>Đang giao:</Text>
                        <Text style={styles.statValue}>{stats.delivering}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#6C757D' }]}>Hoàn thành:</Text>
                        <Text style={styles.statValue}>{stats.completed}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#ff4444' }]}>Đã hủy:</Text>
                        <Text style={styles.statValue}>{stats.cancelled}</Text>
                    </View>
                    <View style={[styles.statItem, styles.revenueItem]}>
                        <Text style={[styles.statLabel, { color: '#000d66' }]}>Tổng doanh thu:</Text>
                        <Text style={[styles.statValue, styles.revenueValue]}>
                            {formatPrice(stats.revenue)}
                        </Text>
                    </View>
                    
                    {/* Payment Statistics */}
                    <View style={styles.paymentStatsContainer}>
                        <Text style={styles.paymentStatsTitle}>Thống kê thanh toán:</Text>
                        <View style={styles.paymentStatsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: '#4CAF50' }]}>QR Pay:</Text>
                                <Text style={styles.statValue}>{stats.qrOrders || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: '#9C27B0' }]}>E-Wallet:</Text>
                                <Text style={styles.statValue}>{stats.ewalletOrders || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: '#FF9800' }]}>COD:</Text>
                                <Text style={styles.statValue}>{stats.codOrders || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: '#2196F3' }]}>Đã thanh toán:</Text>
                                <Text style={styles.statValue}>{stats.paidOrders || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: '#F44336' }]}>Chưa thanh toán:</Text>
                                <Text style={styles.statValue}>{stats.unpaidOrders || 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm mã đơn, người mua, SĐT..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery.trim() ? 'Không tìm thấy đơn hàng nào' : 'Không có đơn hàng nào'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

export default OrderScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f8fc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    header: {
        padding: 18,
        backgroundColor: '#000d66',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        marginBottom: 0,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 12,
    },
    searchWrapper: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#f4f8fc',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 0,
    },
    clearButton: {
        padding: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        padding: 10,
        backgroundColor: '#e0e7ff',
        borderRadius: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 5,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000d66',
    },
    listContainer: {
        padding: 15,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: '#000d66',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e7ff',
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000d66',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 120,
        flexShrink: 1,
        marginLeft: 8,
    },
    statusDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: 0,
    },
    orderInfo: {
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    orderItems: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e7ff',
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000d66',
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    itemName: {
        flex: 2,
        fontSize: 14,
        color: '#000d66',
    },
    itemQuantity: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1,
        fontSize: 14,
        color: '#ff4444',
        textAlign: 'right',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    cancelledOrderCard: {
        opacity: 0.7,
        borderColor: '#ff4444',
    },
    cancelledText: {
        color: '#ff4444',
        textDecorationLine: 'line-through',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    revenueItem: {
        width: '100%',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e7ff',
    },
    revenueValue: {
        fontSize: 16,
        color: '#000d66',
    },
    actionButtons: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e7ff',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelButton: {
        backgroundColor: '#ff4444',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    // Payment Status Styles
    paymentStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    paymentStatusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    // Payment Statistics Styles
    paymentStatsContainer: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    paymentStatsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    paymentStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    // New Order Styles
    newOrderCard: {
        borderWidth: 2,
        borderColor: '#4CAF50',
        backgroundColor: '#f8fff8',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    newBadge: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});