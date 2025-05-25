import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';

const UserScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, "User"));
            const usersList = usersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => user.role !== 'admin');
            setUsers(usersList);
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = (userId, userName) => {
        Alert.alert(
            "Xác nhận xóa",
            `Bạn có chắc chắn muốn xóa người dùng "${userName}"?`,
            [
                {
                    text: 'Không',
                    style: 'cancel',
                },
                {
                    text: 'Có',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'User', userId));
                            loadUsers();
                            Alert.alert('Thành công', 'Đã xóa người dùng!');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa người dùng.');
                        }
                    },
                }
            ]
        )
    }

    const itemData = ({ item }) => {
        return (
            <View style={styles.itemContainer}>
                <MaterialCommunityIcons name="account-circle" size={44} color="#000d66" style={{ marginRight: 14 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.fullName || 'Chưa có tên'}</Text>
                    <Text style={styles.itemEmail}>{item.email}</Text>
                    <Text style={styles.itemPhone}>{item.phone || 'Chưa có số điện thoại'}</Text>
                </View>
                <View style={styles.icon}>
                    <Feather name="edit" size={24} color="#000d66"
                        style={{ marginRight: 10 }}
                        onPress={() => Alert.alert('Thông tin người dùng:', `Tên: ${item.fullName}\nEmail: ${item.email}\nSĐT: ${item.phone || 'Chưa có'}\nĐịa chỉ: ${item.address || 'Chưa có'}\nVai trò: ${item.role || 'user'}`)}
                    />
                    <Feather name="trash-2" size={24} color="#ff4444"
                        onPress={() => deleteUser(item.id, item.fullName)} />
                </View>
            </View>
        )
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000d66" />
                <Text style={styles.loadingText}>Đang tải danh sách người dùng...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f4f8fc' }}>
            <View style={styles.headerBox}>
                <MaterialCommunityIcons name="sofa" size={38} color="#000d66" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.welcomeText}>Chào admin</Text>
                    <Text style={styles.subText}>Chào mừng bạn đã mang đến trải nghiệm tốt</Text>
                </View>
                <View style={styles.countUserBox}>
                    <Text style={styles.countUserText}>{users.length}</Text>
                </View>
            </View>
            <View style={styles.container}>
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={itemData}
                    ItemSeparatorComponent={() => <View style={styles.list}></View>}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có người dùng nào</Text>
                        </View>
                    }
                />
            </View>
        </View>
    )
}

export default UserScreen

const styles = StyleSheet.create({
    headerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        margin: 16,
        marginBottom: 8,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    countUserBox: {
        backgroundColor: '#e0e7ff',
        borderRadius: 16,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000d66',
        marginLeft: 8,
    },
    countUserText: {
        color: '#000d66',
        fontWeight: 'bold',
        fontSize: 20,
    },
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#000d66',
        fontSize: 16,
    },
    createButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        backgroundColor: '#000d66',
        borderRadius: 30,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000d66',
    },
    subText: {
        fontSize: 14,
        color: '#888',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#000d66',
        flex: 1,
        minHeight: 90,
        padding: 14,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    },
    list: {
        height: 20,
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#000d66',
        marginBottom: 2,
    },
    itemEmail: {
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 2,
    },
    itemPhone: {
        color: '#888',
        fontSize: 14,
        marginBottom: 2,
    },
    icon: {
        position: 'absolute',
        right: 10,
        flexDirection: 'row',
        marginRight: 10,
        alignItems: 'center',
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
});