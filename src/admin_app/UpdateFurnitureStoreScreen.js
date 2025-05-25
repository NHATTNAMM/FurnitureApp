import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { fetchFurnitureStoreInfo, updateFurnitureStoreInfo } from '../Firebase/FirebaseAPI';
import { UserContext } from '../Firebase/UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase/FirebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const UpdateFurnitureStoreScreen = () => {
    const { user } = useContext(UserContext); // Lấy thông tin user từ context
    const [furnitureStoreId, setFurnitureStoreId] = useState('');
    const [furnitureStoreName, setFurnitureStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [ownerName, setOwnerName] = useState('');

    const fetchStoreInfo = async () => {
        try {
            const result = await fetchFurnitureStoreInfo(user.id);
            if (result.success) {
                const storeData = result.data;
                setFurnitureStoreId(user.id);
                setFurnitureStoreName(storeData.name);
                setAddress(storeData.address);
                setPhone(storeData.phone);
            } else {
                Alert.alert('Thông báo', 'Bạn chưa đăng ký cửa hàng nội thất. Vui lòng nhập thông tin để đăng ký!');
                setFurnitureStoreId(user.id);
                setFurnitureStoreName('');
                setAddress('');
                setPhone('');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra cửa hàng:', error.message);
            Alert.alert('Lỗi', 'Không thể kiểm tra thông tin cửa hàng. Vui lòng thử lại!');
        }
    };

    useEffect(() => {
        setOwnerName(user.fullName);
        fetchStoreInfo();
    }, []);

    const handleUpdate = async () => {
        if (!furnitureStoreId || !furnitureStoreName || !address || !phone) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            const result = await updateFurnitureStoreInfo(furnitureStoreId, {
                idUser: user.id,
                username: user.fullName,
                name: furnitureStoreName,
                address: address,
                phone: phone,
            });

            if (result.success) {
                Alert.alert('Thành công', 'Cửa hàng nội thất đã được đăng ký/cập nhật thành công!');
            } else {
                Alert.alert('Lỗi', result.error);
            }
        } catch (error) {
            console.error('Lỗi khi lưu thông tin cửa hàng:', error.message);
            Alert.alert('Lỗi', 'Không thể lưu thông tin cửa hàng. Vui lòng thử lại!');
        }
    };

    return (
        <View style={styles.bg}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="sofa" size={44} color="#000d66" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.title}>Cập nhật thông tin cửa hàng nội thất</Text>
            <TextInput
                placeholder="Tên chủ cửa hàng"
                value={ownerName}
                placeholderTextColor="#888"
                editable={false}
                style={styles.input}
            />
            <TextInput
                style={styles.input}
                placeholder="Tên cửa hàng nội thất"
                value={furnitureStoreName}
                onChangeText={setFurnitureStoreName}
            />
            <TextInput
                style={styles.input}
                placeholder="Địa chỉ cửa hàng"
                value={address}
                onChangeText={setAddress}
            />
            <TextInput
                style={styles.input}
                placeholder="Số điện thoại liên hệ"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Cập nhật</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: '#f4f8fc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000d66',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: 1,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#000d66',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginBottom: 18,
        fontSize: 16,
        backgroundColor: '#f7f8fa',
        color: '#222',
    },
    button: {
        backgroundColor: '#000d66',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
    },
});

export default UpdateFurnitureStoreScreen;