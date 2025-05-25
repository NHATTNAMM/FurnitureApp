import {StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback, Alert, StatusBar} from 'react-native'
import React, { useState, useContext, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlobalStyles from '../globals/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

import FurnitureScreen from './FurnitureScreen';
import OrderScreen from './OrderScreen';
import StatisticalScreen from './StatisticalScreen';
import UpdateFurnitureStoreScreen from './UpdateFurnitureStoreScreen';
import UserScreen from './UserScreen';
import { LogOut } from '../Firebase/FirebaseAPI';
import { UserContext } from '../Firebase/UserContext';

const menuItem=[
    {
        key:'1',
        label :'Thống kê' 
    },
    { key:'2' ,label:'Khách hàng'},
    { key: '3', label: 'Sản phẩm' },
    { key: '4', label: 'Đơn hàng' },
    { key: '5', label: 'Cập nhật thông tin cửa hàng' },
    { key: '6', label: 'Đăng xuất' },
]

const AdminScreen = () => {
    const {user} = useContext(UserContext);
    const navigation = useNavigation();
    const [selectedMenu, setSelectedMenu] = useState('1')
    const [sidebar, setSidebar] = useState(true);

    useEffect(() => {
        // Kiểm tra nếu không phải admin thì chuyển về trang đăng nhập
        if (!user || user.role !== 'admin') {
            Alert.alert(
                "Không có quyền truy cập",
                "Bạn không có quyền truy cập trang này",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.reset({
                            index: 0,
                            routes: [{ name: 'LogIn' }],
                        })
                    }
                ]
            );
        }
    }, [user]);

    const handleLogOut = () =>{
        Alert.alert("Xác nhận", "Bạn có chắc muốn đăng xuất?",[
            {
                text:"Hủy",
                style:"cancel",
            },
            {
                text:"Đăng xuất",
                onPress: async()=>{
                    const result = await LogOut();
                    if(result.success){
                        navigation.reset({
                            index:0,
                            routes:[{name:"LogIn"},]
                        });
                    }
                    else{
                        Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại!");
                    }
                }
            }
        ])
    }

    const renderItem = () =>{
        switch(selectedMenu){
            case '1':
                return <StatisticalScreen/>
            case '2':
                return <UserScreen/>
            case '3':
                return <FurnitureScreen/>
            case '4':
                return <OrderScreen/>
            case '5':
                return <UpdateFurnitureStoreScreen />;
            default:
                return null;
        }
    }

    const getTitle = () => {
        switch (selectedMenu) {
            case '1': return 'Thống kê';
            case '2': return 'Danh sách khách hàng';
            case '3': return 'Danh sách sản phẩm';
            case '4': return 'Danh sách đơn hàng';
            case '5': return 'Cập nhật thông tin cửa hàng';
            default: return '';
        }
    };

    // Nếu không phải admin thì không render gì cả
    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <View style={styles.mainContainer}>
            <StatusBar backgroundColor="#000d66" barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    {!sidebar && (
                        <TouchableOpacity 
                            style={styles.openBtn} 
                            onPress={() => setSidebar(true)}
                        >
                            <Ionicons name="menu" size={28} color="white" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>
                            {getTitle()}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Quản lý hệ thống
                        </Text>
                    </View>
                </View>

                <View style={styles.container}>
                    {sidebar && 
                        <TouchableWithoutFeedback onPress={() => setSidebar(false)}>
                            <View style={styles.overPlay}></View>
                        </TouchableWithoutFeedback>
                    }
                    
                    {sidebar && (
                        <View style={styles.sidebar}>
                            <View style={styles.sidebarHeader}>
                                <View style={styles.userInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatarText}>
                                            {user?.fullName?.charAt(0)?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.userDetails}>
                                        <Text style={styles.userName}>
                                            {user?.fullName}
                                        </Text>
                                        <Text style={styles.userRole}>
                                            Quản trị viên
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setSidebar(false)} 
                                    style={styles.closeBtn}
                                >
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.menuContainer}>
                                {menuItem.map((item) => (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[
                                            styles.menuItem,
                                            selectedMenu === item.key && styles.menuItemActive
                                        ]}
                                        onPress={() => {
                                            if(item.key === '6'){
                                                handleLogOut();
                                            }
                                            setSelectedMenu(item.key);
                                            setSidebar(false);
                                        }}
                                    >
                                        <Ionicons 
                                            name={getIconName(item.key)} 
                                            size={22} 
                                            color="white" 
                                        />
                                        <Text style={styles.menuText}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.content}>
                        <View style={styles.contentContainer}>
                            {renderItem()}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

const getIconName = (key) => {
    switch(key) {
        case '1': return 'stats-chart';
        case '2': return 'people';
        case '3': return 'cube';
        case '4': return 'receipt';
        case '5': return 'business';
        case '6': return 'log-out';
        default: return 'square';
    }
}

export default AdminScreen

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#000d66',
    },
    header: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#000d66',
    },
    headerContent: {
        marginLeft: 15,
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '600',
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginTop: 2,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: '75%',
        backgroundColor: '#000d66',
        position: 'absolute',
        zIndex: 10,
        left: 0,
        top: 0,
        bottom: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sidebarHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    userRole: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginTop: 2,
    },
    menuContainer: {
        padding: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 8,
    },
    menuItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: '#ffffff',
    },
    menuText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    content: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        flex: 1,
        padding: 15,
    },
    openBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    overPlay: {
        position: 'absolute',
        zIndex: 1,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
})