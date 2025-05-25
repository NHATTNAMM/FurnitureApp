import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { MaterialCommunityIcons, Ionicons, MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import React, { useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native'
import { LogOut } from '../../Firebase/FirebaseAPI';
import { UserContext } from '../../Firebase/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../Firebase/FirebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';

const Profile = () => {
    const { user } = useContext(UserContext)

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SECONDARY }}>
                <Text style={{ color: PRIMARY, fontSize: 18 }}>Bạn chưa đăng nhập</Text>
            </SafeAreaView>
        );
    }
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [role, setRole] = useState(user?.role || '')
    const navigation = useNavigation();
    const handleLogOut = async () => {
        Alert.alert('Thông báo', "Bạn có muốn đăng xuất", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Đăng xuất",
                onPress: async () => {
                    const result = await LogOut();
                    if (result.success) {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "LogIn" }],
                        })
                    } else {
                        Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại!");
                    }
                }
            }
        ])
    }
    const handleChangeAvatar = async () => {
        try {
            // Yêu cầu quyền truy cập thư viện ảnh
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Thông báo', 'Bạn cần cho phép truy cập thư viện ảnh để đổi avatar.');
                return;
            }
            // Mở picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                // (Nếu có upload lên server, thực hiện upload ở đây và lấy url)
                // Ở đây demo: lưu trực tiếp uri vào Firestore
                const userRef = doc(db, 'User', user.id);
                await updateDoc(userRef, { avatar: uri });
                setAvatar(uri);
                Alert.alert('Thành công', 'Đã đổi avatar!');
            }
        } catch (error) {
            console.error('Lỗi đổi avatar:', error);
            Alert.alert('Lỗi', 'Không thể đổi avatar.');
        }
    };
    return (
        <View style={{ flex: 1, backgroundColor: SECONDARY }}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <View style={styles.iconBack}>
                                <Ionicons name="arrow-back" size={22} color={PRIMARY} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.container}>
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.7}>
                                <Image
                                    source={typeof avatar === 'string' && avatar.trim() !== ''
                                        ? { uri: avatar }
                                        : require('../../../assets/images/usercus.jpg')}
                                    style={styles.avatar}
                                />
                                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 20, padding: 4 }}>
                                    <MaterialIcons name="edit" size={20} color={PRIMARY} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.textAddress}>
                            <Text style={styles.name}>{user.fullName}</Text>
                            <Text style={styles.address}>{user.address}</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <MaterialIcons name="shopping-cart" size={28} color={PRIMARY} />
                                <Text style={styles.statLabel}>Đơn đã đặt</Text>
                                <Text style={styles.statValue}>{user.totalOrders || 0}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <MaterialIcons name="attach-money" size={28} color={PRIMARY} />
                                <Text style={styles.statLabel}>Đã chi tiêu</Text>
                                <Text style={styles.statValue}>{user.totalSpent ? user.totalSpent.toLocaleString('vi-VN') + ' đ' : '0 đ'}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <MaterialIcons name="star" size={28} color={PRIMARY} />
                                <Text style={styles.statLabel}>Đánh giá</Text>
                                <Text style={styles.statValue}>{user.rating ? user.rating.toFixed(1) + '/5' : 'Chưa có'}</Text>
                            </View>
                        </View>
                        <View style={styles.profileDetailList}>
                            <ProfileItem
                                icon={<MaterialCommunityIcons name="account-edit-outline" size={24} color={PRIMARY} />}
                                label="Thông tin người dùng"
                                onPress={() => navigation.navigate('ProfileDetail')}
                            />
                            <ProfileItem
                                icon={<FontAwesome name="shopping-cart" size={24} color={PRIMARY} />}
                                label="Đơn hàng"
                                onPress={() => navigation.navigate('Order')}
                            />
                            <ProfileItem
                                icon={<AntDesign name="heart" size={22} color={PRIMARY} />}
                                label="Yêu thích"
                                onPress={() => navigation.navigate('Favorites')}
                            />
                            <ProfileItem
                                icon={<MaterialIcons name="password" size={24} color={PRIMARY} />}
                                label="Đổi mật khẩu"
                                onPress={() => { }}
                            />
                            {user.role !== "Admin" && (
                                <ProfileItem
                                    icon={<AntDesign name="deleteuser" size={24} color={PRIMARY} />}
                                    label="Yêu cầu xóa tài khoản"
                                    onPress={() => { }}
                                />
                            )}
                            {user.role !== "user" && (
                                <ProfileItem
                                    icon={<MaterialIcons name="admin-panel-settings" size={24} color={PRIMARY} />}
                                    label="Quản lý cửa hàng"
                                    labelStyle={{ color: PRIMARY }}
                                    onPress={() => navigation.navigate('AdminHome')}
                                />
                            )}
                            {user.role === "shipper" && (
                                <ProfileItem
                                    icon={<MaterialIcons name="local-shipping" size={24} color={PRIMARY} />}
                                    label="Trang chủ Shipper"
                                    onPress={() => navigation.navigate('HomeShipper')}
                                />
                            )}
                            <ProfileItem
                                icon={<AntDesign name="logout" size={24} color="#E53935" />}
                                label="Đăng xuất"
                                labelStyle={{ color: '#E53935' }}
                                onPress={handleLogOut}
                                rightIconColor="#E53935"
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

const ProfileItem = ({ icon, label, onPress, labelStyle, rightIconColor }) => (
    <TouchableOpacity onPress={onPress} style={styles.profileItemTouchable}>
        <View style={styles.profileItem}>
            <View style={styles.profileIcon}>{icon}</View>
            <Text style={[styles.profileLabel, labelStyle]}>{label}</Text>
            <MaterialIcons name="navigate-next" size={24} color={rightIconColor || '#B0B0B0'} style={styles.iconLeft} />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
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
        marginBottom: 10,
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
        color: PRIMARY,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: PRIMARY,
        backgroundColor: '#fff',
    },
    textAddress: {
        marginTop: 10,
        alignItems: 'center',
    },
    name: {
        fontWeight: '700',
        fontSize: 22,
        color: PRIMARY,
        marginTop: 5,
    },
    address: {
        color: '#555',
        fontSize: 14,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
        width: '100%',
        paddingHorizontal: 10,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 8,
        paddingVertical: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statLabel: {
        color: PRIMARY,
        fontWeight: '500',
        fontSize: 14,
        marginTop: 8,
    },
    statValue: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 16,
        marginTop: 2,
    },
    profileDetailList: {
        flex: 1,
        width: '100%',
        marginTop: 20,
    },
    profileItemTouchable: {
        marginBottom: 10,
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    profileIcon: {
        marginRight: 16,
    },
    profileLabel: {
        fontSize: 16,
        color: PRIMARY,
        fontWeight: '500',
        flex: 1,
    },
    iconLeft: {
        marginLeft: 10,
    },
});

export default Profile;