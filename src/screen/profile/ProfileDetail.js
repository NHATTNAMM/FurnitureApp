import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../Firebase/UserContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { updateProfile } from '../../Firebase/FirebaseAPI';
import LoadScreen from '../../component/LoadScreen';
import ImageModal from '../../Modal/ImageModal';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as Location from 'expo-location';

const PRIMARY = '#000D66';
const SECONDARY = '#F3F4F6';

const ProfileDetail = () => {
    const { user } = useContext(UserContext);
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [address, setAddress] = useState(user?.address || '');
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Cập nhật local state khi user context thay đổi
    React.useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setPhone(user.phone || '');
            setAvatar(user.avatar || '');
            setAddress(user.address || '');
        }
    }, [user]);

    const CLOUD_NAME = 'dleidkd6p';
    const UPLOAD_PRESET = 'interiorapp';

    const onPickCamera = async () => {
        setModalVisible(false);
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
        if (!result.canceled) setAvatar(result.assets[0].uri);
    }

    const onPickLibrary = async () => {
        setModalVisible(false);
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
        if (!result.canceled) setAvatar(result.assets[0].uri);
    }

    const uploadImage = async () => {
        const data = new FormData();
        data.append('file', {
            uri: avatar,
            type: 'image/jpeg',
            name: 'avatarImage.jpg',
        })
        data.append('upload_preset', UPLOAD_PRESET);
        try {
            setLoading(true)
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                data,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            const uploadedUrl = response.data.secure_url;
            Alert.alert("Thông báo", "Tải ảnh lên thành công")
            setAvatar(uploadedUrl);
            handleUpdate(uploadedUrl)
            setLoading(false);
        }
        catch (error) {
            Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại!");
        }
    }

    const navigation = useNavigation();
    
    const getCurrentLocation = async () => {
        try {
            setIsGettingLocation(true);
            
            // Yêu cầu quyền truy cập vị trí
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Thông báo', 'Bạn cần cấp quyền truy cập vị trí để sử dụng tính năng này.');
                setIsGettingLocation(false);
                return;
            }

            // Lấy vị trí hiện tại
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Chuyển đổi tọa độ thành địa chỉ
            const addressData = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (addressData && addressData.length > 0) {
                const addr = addressData[0];
                const fullAddress = [
                    addr.name,
                    addr.street,
                    addr.district,
                    addr.subregion,
                    addr.city,
                    addr.region,
                    addr.country
                ].filter(Boolean).join(', ');
                
                setAddress(fullAddress);
                Alert.alert('Thành công', 'Đã lấy địa chỉ từ vị trí hiện tại của bạn.');
            }
        } catch (error) {
            console.error('Lỗi lấy vị trí:', error);
            Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
        } finally {
            setIsGettingLocation(false);
        }
    };

    const openGoogleMaps = () => {
        const url = Platform.select({
            ios: 'maps://app',
            android: 'geo:0,0?q='
        });
        
        Alert.alert(
            'Chọn địa chỉ trên bản đồ',
            'Bạn sẽ được chuyển đến Google Maps để chọn địa chỉ chính xác. Sau khi chọn xong, hãy sao chép địa chỉ và quay lại đây để dán vào.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Mở Google Maps',
                    onPress: () => {
                        Linking.openURL('https://www.google.com/maps');
                    }
                }
            ]
        );
    };
    
    const handleUpdate = async (avatarUrl = user.avatar) => {
        if (!user) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
            return;
        }
        const result = await updateProfile(user.id, {
            avatar: avatarUrl || [],
            fullName: fullName,
            phone: phone,
            address: address,
        });
        if (result.success) {
            Alert.alert("Thành công", "Thông tin đã được cập nhật.");
        } else {
            Alert.alert("Lỗi", "Không thể cập nhật. Vui lòng thử lại!");
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SECONDARY }}>
                <Text style={{ color: PRIMARY, fontSize: 18 }}>Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: SECONDARY }}>
            <SafeAreaView style={{ flex: 1 }}>
                <LoadScreen isLoading={loading} text="Chờ một chút....." />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} nestedScrollEnabled={true}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.headerNav}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                    <View style={styles.iconBack}>
                                        <Ionicons name="arrow-back" size={22} color={PRIMARY} />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                                <View style={{ width: 40 }} />
                            </View>
                            <View style={styles.container}>
                                <TouchableOpacity onPress={() => setModalVisible(true)}>
                                    <View style={styles.avatarContainer}>
                                        <Image
                                            source={typeof avatar === 'string' && avatar.trim() !== ''
                                                ? { uri: avatar }
                                                : typeof user?.avatar === 'string' && user.avatar.trim() !== ''
                                                    ? { uri: user.avatar }
                                                    : require('../../../assets/images/usercus.jpg')
                                            }
                                            style={styles.avatar}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.profileDetailList}>
                                    <View style={styles.editDetail}>
                                        <ProfileInput label="Họ và tên" value={fullName} onChangeText={setFullName} />
                                        <ProfileInput label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                                        
                                        {/* Địa chỉ với các nút bổ trợ */}
                                        <View style={styles.itemUser}>
                                            <View style={styles.addressHeader}>
                                                <Text style={styles.textOnInput}>Địa chỉ giao hàng</Text>
                                                <View style={styles.addressActions}>
                                                    <TouchableOpacity 
                                                        style={styles.addressActionButton}
                                                        onPress={getCurrentLocation}
                                                        disabled={isGettingLocation}
                                                    >
                                                        {isGettingLocation ? (
                                                            <MaterialIcons name="hourglass-empty" size={16} color={PRIMARY} />
                                                        ) : (
                                                            <MaterialIcons name="my-location" size={16} color={PRIMARY} />
                                                        )}
                                                        <Text style={styles.addressActionText}>
                                                            {isGettingLocation ? 'Đang lấy...' : 'Vị trí hiện tại'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    
                                                    <TouchableOpacity 
                                                        style={styles.addressActionButton}
                                                        onPress={openGoogleMaps}
                                                    >
                                                        <MaterialIcons name="map" size={16} color={PRIMARY} />
                                                        <Text style={styles.addressActionText}>Chọn trên bản đồ</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <TextInput
                                                style={[styles.textInput, styles.addressInput]}
                                                value={address}
                                                onChangeText={setAddress}
                                                placeholder="Nhập địa chỉ đầy đủ của bạn..."
                                                placeholderTextColor="#9CA3AF"
                                                multiline
                                                numberOfLines={4}
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.footerButtons}>
                            <TouchableOpacity style={styles.buttonClose} onPress={() => navigation.goBack()}>
                                <Text style={styles.textButton}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.buttonUpdate}
                                onPress={() => {
                                    if (avatar !== user.avatar) {
                                        uploadImage();
                                    } else {
                                        handleUpdate(user.avatar);
                                    }
                                }}
                            >
                                <Text style={styles.textButtonSave}>Lưu thay đổi</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
                <ImageModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onCamera={onPickCamera}
                    onLibrary={onPickLibrary}
                />
            </SafeAreaView>
        </View>
    );
};

const ProfileInput = ({ label, value, onChangeText, editable = true, keyboardType }) => (
    <View style={styles.itemUser}>
        <Text style={styles.textOnInput}>{label}</Text>
        <TextInput
            style={[styles.textInput, !editable && { backgroundColor: '#F3F4F6', color: '#9CA3AF' }]}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            keyboardType={keyboardType}
            placeholderTextColor="#9CA3AF"
        />
    </View>
);

export default ProfileDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 5,
        backgroundColor: SECONDARY,
    },
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
    avatarContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: PRIMARY,
        borderRadius: 80,
        width: 160,
        height: 160,
        justifyContent: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#fff',
    },
    profileDetailList: {
        backgroundColor: '#fff',
        flex: 1,
        width: '100%',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    editDetail: {
        margin: 1,
        flex: 1,
    },
    itemUser: {
        marginBottom: 16,
    },
    textOnInput: {
        color: PRIMARY,
        fontWeight: '500',
        marginBottom: 6,
        fontSize: 15,
    },
    textInput: {
        borderWidth: 1,
        color: PRIMARY,
        fontSize: 16,
        padding: 12,
        borderRadius: 8,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    addressHeader: {
        marginBottom: 8,
    },
    addressActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    addressActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: PRIMARY,
        gap: 4,
    },
    addressActionText: {
        color: PRIMARY,
        fontSize: 12,
        fontWeight: '600',
    },
    addressInput: {
        minHeight: 100,
        paddingTop: 12,
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    buttonClose: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 12,
    },
    buttonUpdate: {
        backgroundColor: PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 12,
    },
    textButton: {
        color: PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    textButtonSave: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});