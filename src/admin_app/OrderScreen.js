import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, query, orderBy, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const OrderScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        ready: 0,
        delivering: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0
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
                        .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
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

    const renderOrderItem = ({ item }) => (
        <View style={[styles.orderCard, item.status === 'Đã hủy' && styles.cancelledOrderCard]}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Mã đơn: {item.id}</Text>
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
        </View>
    );

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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Danh sách đơn hàng</Text>
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
                </View>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
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
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
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
});