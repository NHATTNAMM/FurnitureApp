import { StyleSheet, Text, TextInput, View, TouchableOpacity, Image, Alert, ScrollView, FlatList } from 'react-native';
import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import style from '../../globals/style';
import { AntDesign, EvilIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import globalStyles from '../../globals/globalStyles';
import { db } from '../../Firebase/FirebaseConfig';
import { addDoc, collection, updateDoc } from 'firebase/firestore';
import { fetchFurnitureStoreInfo } from '../../Firebase/FirebaseAPI';
import axios from 'axios';
import ImageModal from '../../Modal/ImageModal';
import LoadScreen from '../../component/LoadScreen';
import * as ImagePicker from 'expo-image-picker';
import { addTag, defaultTags, removeTag } from '../../component/TagManager';
import { UserContext } from '../../Firebase/UserContext';

const CLOUD_NAME = 'dleidkd6p';
const UPLOAD_PRESET = 'interiorapp';

const AddFurniture = () => {
  const { user } = useContext(UserContext);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (user && user.id) {
      fetchStoreDetails(user.id);
    }
  }, [user]);

  const fetchStoreDetails = async (userId) => {
    try {
      const result = await fetchFurnitureStoreInfo(userId);
      if (result.success) {
        const storeData = result.data;
        setStoreName(storeData.name || '');
        setStoreAddress(storeData.address || '');
        setStorePhone(storeData.phone || '');
      } else {
        Alert.alert('Thông báo', result.error);
        setStoreName('');
        setStoreAddress('');
        setStorePhone('');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin cửa hàng:', error.message);
      Alert.alert('Lỗi', 'Không thể lấy thông tin cửa hàng. Vui lòng thử lại!');
    }
  };

  const onPickCamera = async () => {
    setModalVisible(false);
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) setProductImage(result.assets[0].uri);
  };

  const onPickLibrary = async () => {
    setModalVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) setProductImage(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!productName || !productPrice || !storeName || !productImage) {
      Alert.alert('Thông báo', 'Nhập đủ thông tin');
      return;
    }
    setLoading(true);
    const data = new FormData();
    data.append('file', {
      uri: productImage,
      type: 'image/jpeg',
      name: 'productImage.jpg',
    });
    data.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setLoading(false);
      const uploadedUrl = response.data.secure_url;
      saveProduct(uploadedUrl);
      setProductImage(uploadedUrl);
    } catch (error) {
      console.log('Upload error:', error.response?.data || error.message || error);
      Alert.alert('Lỗi', 'Không tải được ảnh.');
      setLoading(false);
    }
  };

  const saveProduct = async (uri) => {
    if (!productName || !productPrice || !productImage) {
      Alert.alert('Điền thông tin', 'Nhập đầy đủ thông tin');
      return;
    }
    if (!storeName || !storeAddress || !storePhone) {
      Alert.alert('Thông báo', 'Vui lòng cập nhật thông tin cửa hàng trước khi thêm sản phẩm.');
      return;
    }
    setLoading(true);
    try {
      const productCollection = collection(db, 'furnitures');
      const newProductRef = await addDoc(productCollection, {
        furnitureName: productName,
        furniturePrice: productPrice,
        image: uri,
        idStore: user.id,
        storeName,
        storeAddress,
        storePhone,
        description,
        tag,
        createdAt: new Date(),
      });
      await updateDoc(newProductRef, {
        furnitureId: newProductRef.id,
      });
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào danh sách.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('firebase', error);
      Alert.alert('Thông báo', 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handAddTag = () => {
    if (tagInput.trim() === '' || tag.includes(tagInput.trim())) return;
    const newTag = addTag(tag, tagInput);
    setTag(newTag);
    setTagInput('');
  };

  const handRemoveTag = (tagToRemove) => {
    const newTag = removeTag(tag, tagToRemove);
    setTag(newTag);
  };

  const handSelectedTag = (selectedTag) => {
    const newTag = addTag(tag, selectedTag);
    setTag(newTag);
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.SafeArea}>
        <LoadScreen isLoading={loading} text="Chờ một chút....." />
        <View style={styles.viewBack}>
          <AntDesign
            name="back"
            size={24}
            color="white"
            style={styles.iconBack}
            onPress={() => navigation.goBack()}
          />
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            {/* Tiêu đề */}
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.title}>Thêm sản phẩm</Text>
            </View>
            {/* Hình ảnh sản phẩm */}
            <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', marginVertical: 10 }}>
              <Text style={styles.sectionTitle}>Hình ảnh sản phẩm</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <View style={{ position: 'relative' }}>
                  <Image
                    source={productImage ? { uri: productImage } : require('../../../assets/images/loadpicture.png')}
                    style={styles.image}
                  />
                  <View style={styles.iconUpload}>
                    <EvilIcons name="camera" size={40} color="#000d66" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            {/* Thông tin sản phẩm */}
            <View>
              <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
              <TextInput
                placeholder="Tên sản phẩm"
                value={productName}
                placeholderTextColor="gray"
                onChangeText={setProductName}
                style={styles.TextInput}
              />
              <TextInput
                placeholder="Giá (VND)"
                value={productPrice}
                keyboardType="numeric"
                placeholderTextColor="gray"
                onChangeText={setProductPrice}
                style={styles.TextInput}
              />
              <TextInput
                placeholder="Mô tả sản phẩm"
                value={description}
                placeholderTextColor="gray"
                onChangeText={setDescription}
                style={styles.TextInput}
              />
              <View>
                <Text style={styles.sectionTitle}>Loại sản phẩm</Text>
                {/* Nhập tag */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
                  <TextInput
                    placeholder="Nhập loại"
                    value={tagInput}
                    placeholderTextColor="gray"
                    onChangeText={setTagInput}
                    style={[styles.TextInput, { flex: 1 }]}
                  />
                  <TouchableOpacity onPress={handAddTag} style={{ marginLeft: 10 }}>
                    <Ionicons name="add-circle-outline" size={30} color="#000d66" />
                  </TouchableOpacity>
                </View>
                {/* Danh sách tag đã chọn */}
                <FlatList
                  data={tag}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.selectedTagContainer}>
                      <Text style={styles.selectedTagText}>{item}</Text>
                      <TouchableOpacity onPress={() => handRemoveTag(item)}>
                        <Ionicons name="close-circle" size={18} color="#ff4444" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {/* Danh sách tag gợi ý */}
                <Text style={styles.sectionTitle}>Gợi ý loại sản phẩm</Text>
                <FlatList
                  data={defaultTags}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handSelectedTag(item)} style={styles.suggestedTagContainer}>
                      <Text style={styles.suggestedTagText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
            {/* Thông tin cửa hàng */}
            <View>
              <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>
              <TextInput
                placeholder="Tên cửa hàng"
                value={storeName}
                placeholderTextColor="gray"
                editable={false}
                style={styles.TextInput}
              />
              <TextInput
                placeholder="Địa chỉ"
                value={storeAddress}
                placeholderTextColor="gray"
                editable={false}
                style={styles.TextInput}
              />
              <TextInput
                placeholder="Số liên lạc"
                value={storePhone}
                placeholderTextColor="gray"
                editable={false}
                style={styles.TextInput}
              />
            </View>
            {/* Nút lưu */}
            <View style={styles.endView}>
              <TouchableOpacity style={styles.icon} onPress={uploadImage}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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

export default AddFurniture;

const styles = StyleSheet.create({
  SafeArea: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  container: {
    backgroundColor: 'white',
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBack: {
    padding: 5,
    marginBottom: 0,
  },
  viewBack: {
    paddingHorizontal: 10,
    backgroundColor: '#000d66',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000d66',
    marginVertical: 12,
    letterSpacing: 1,
    textShadowColor: '#e0e7ff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  TextInput: {
    backgroundColor: '#f7f8f9',
    marginVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderColor: '#e5e5e5',
    borderWidth: 1,
    fontSize: 16,
    color: '#222',
    height: 44,
  },
  image: {
    borderRadius: 16,
    height: 160,
    width: 160,
    borderColor: '#000d66',
    borderWidth: 2,
    marginVertical: 8,
    alignSelf: 'center',
    backgroundColor: '#e0e7ff',
  },
  iconUpload: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#000d66',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000d66',
    marginVertical: 10,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  endView: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  icon: {
    backgroundColor: '#000d66',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 5,
  },
  tag: {
    fontSize: 14,
    color: '#000d66',
    marginRight: 6,
  },
  selectedTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#000d66',
  },
  suggestedTagContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#000d66',
  },
  suggestedTagText: {
    fontSize: 14,
    color: '#000d66',
  },
});