import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { titles } from '../globals/style';
import { db } from '../Firebase/FirebaseConfig';
import{collection,onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { removeFurniture, updateFurnitureDiscount } from '../Firebase/FirebaseAPI';
import StockStatus from '../component/StockStatus';
import PriceDisplay from '../component/PriceDisplay';
import DiscountBadge from '../component/DiscountBadge';
import GlassDiscountBadge from '../component/GlassDiscountBadge';

const CLOUD_NAME = 'dleidkd6p';
const UPLOAD_PRESET = 'interiorapp';

const FurnitureScreen = () => {
  const navigation  = useNavigation();
  const [furnitureData, setFurnitureData] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editImage, setEditImage] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect (()=> {
    const  furnitureCollection = collection(db,'furnitures');
    const loadFurniture = onSnapshot(furnitureCollection,(snapshot)=>{
      const furnitureList = snapshot.docs.map(doc =>({
        id: doc.id,
        ...doc.data()
      }))
      setFurnitureData(furnitureList);
    },(error) =>{
      console.error("load furniture error", error);
    }
  )
    return ()=> loadFurniture();
  },[])

  const deleteFurniture  = (id)=>{
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeFurniture(id);
              if (result.success) {
                Alert.alert('Thành công', 'Đã xóa sản phẩm thành công!');
              } else {
                Alert.alert('Lỗi', result.error || 'Không thể xóa sản phẩm. Vui lòng thử lại!');
              }
            } catch (error) {
              console.error('Lỗi khi xóa sản phẩm:', error);
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại!');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditName(item.furnitureName);
    setEditPrice(item.furniturePrice.toString());
    setEditDesc(item.description);
    setEditQuantity(item.quantity ? item.quantity.toString() : '0');
    setEditDiscount(item.discountPercentage ? item.discountPercentage.toString() : '');
    setEditImage(item.image || '');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingItem(null);
    setEditName('');
    setEditPrice('');
    setEditDesc('');
    setEditQuantity('');
    setEditDiscount('');
    setEditImage('');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setEditImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const uploadImageToCloud = async (imageUri) => {
    const data = new FormData();
    data.append('file', {
      uri: imageUri,
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
      return response.data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Không thể tải ảnh lên');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (parseInt(editQuantity) < 0) {
      Alert.alert('Lỗi', 'Số lượng không thể âm');
      return;
    }
    
    const discount = parseFloat(editDiscount) || 0;
    if (discount < 0 || discount > 100) {
      Alert.alert('Lỗi', 'Phần trăm giảm giá phải từ 0 đến 100');
      return;
    }
    
    setLoadingEdit(true);
    try {
      const ref = doc(db, 'furnitures', editingItem.id);
      const updateData = {
        furnitureName: editName,
        furniturePrice: parseFloat(editPrice),
        description: editDesc,
        quantity: parseInt(editQuantity),
      };

      // Chỉ thêm discountPercentage nếu có giá trị
      if (discount > 0) {
        updateData.discountPercentage = discount;
      } else {
        updateData.discountPercentage = null;
      }

      // Nếu có ảnh mới và khác ảnh cũ, upload lên cloud
      if (editImage && editImage !== editingItem.image && !editImage.startsWith('https://')) {
        const uploadedUrl = await uploadImageToCloud(editImage);
        updateData.image = uploadedUrl;
      }

      await updateDoc(ref, updateData);
      Alert.alert('Thành công', 'Đã cập nhật sản phẩm!');
      closeEditModal();
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật sản phẩm.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      {item.image ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.furnitureImage} />
          {/* Glass badge giảm giá */}
          {item.discountPercentage > 0 && (
            <View style={styles.discountBadgeContainer}>
              <GlassDiscountBadge 
                discountPercentage={item.discountPercentage} 
                size="small"
                glassIntensity="medium"
              />
            </View>
          )}
        </View>
      ) : null}
      <View style={{ flex: 1, marginLeft: item.image ? 12 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.itemName}>{item.furnitureName}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity 
              style={[styles.editButton, { marginRight: 12 }]}
              onPress={() => openEditModal(item)}
            >
              <Feather name="edit" size={22} color="#000d66" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteFurniture(item.id)}
            >
              <MaterialIcons name="delete-outline" size={22} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>
        <PriceDisplay 
          originalPrice={item.furniturePrice}
          discountPercentage={item.discountPercentage}
          fontSize={15}
          style={styles.priceContainer}
        />
        <Text style={styles.itemDesc} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>
        <StockStatus quantity={item.quantity} />
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách sản phẩm</Text>
      <FlatList
        data={furnitureData}
        keyExtractor={(item)=> item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text>Chưa có sản phẩm nào được thêm.</Text>}
        contentContainerStyle={{paddingBottom:100, flexGrow: 1}}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddFurniture')}
      >
        <Ionicons name="add-circle" size={60} color="#000d66" />
      </TouchableOpacity>
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEditModal}
      >
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.3)' }}>
          <View style={{ width:300, backgroundColor:'#fff', borderRadius:16, padding:20, elevation:5 }}>
            <Text style={{ fontSize:18, fontWeight:'bold', color:'#000d66', marginBottom:10 }}>Chỉnh sửa sản phẩm</Text>
            
            {/* Image Picker */}
            <TouchableOpacity 
              onPress={pickImage}
              style={{ 
                borderWidth: 2, 
                borderColor: '#000d66', 
                borderRadius: 12, 
                padding: 10, 
                marginBottom: 10, 
                alignItems: 'center',
                backgroundColor: '#f4f8fc'
              }}
            >
              {editImage ? (
                <View style={{ alignItems: 'center' }}>
                  <Image 
                    source={{ uri: editImage }} 
                    style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 5 }} 
                  />
                  <Text style={{ color: '#000d66', fontSize: 12 }}>Nhấn để thay đổi ảnh</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="image-outline" size={40} color="#000d66" />
                  <Text style={{ color: '#000d66', marginTop: 5 }}>Chọn ảnh sản phẩm</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="Tên sản phẩm"
              value={editName}
              onChangeText={setEditName}
              style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, marginBottom:10, padding:8 }}
            />
            <TextInput
              placeholder="Giá sản phẩm"
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
              style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, marginBottom:10, padding:8 }}
            />
            <TextInput
              placeholder="Mô tả"
              value={editDesc}
              onChangeText={setEditDesc}
              style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, marginBottom:10, padding:8, minHeight:60 }}
              multiline
            />
            <TextInput
              placeholder="Số lượng tồn kho"
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
              style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, marginBottom:10, padding:8 }}
            />
            <TextInput
              placeholder="Phần trăm giảm giá (0-100)"
              value={editDiscount}
              onChangeText={setEditDiscount}
              keyboardType="numeric"
              style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, marginBottom:10, padding:8 }}
            />
            <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop:10 }}>
              <TouchableOpacity onPress={closeEditModal} style={{ marginRight:16 }}>
                <Text style={{ color:'#666', fontSize:16 }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} disabled={loadingEdit}>
                {loadingEdit ? <ActivityIndicator size="small" color="#0e90ad" /> : <Text style={{ color:'#000d66', fontWeight:'bold', fontSize:16 }}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FurnitureScreen;

const styles = StyleSheet.create({
  container:{
    flex:1,
    padding:10
  },
  title:{
    fontSize:22,
    fontWeight:'bold',
    color:'#000d66',
    marginBottom: 10,
  },
  itemContainer:{
    flexDirection:'row',
    alignItems:'center',
    padding:14,
    backgroundColor: '#f4f8fc',
    borderRadius:18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#000d66',
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#000d66',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  furnitureImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  discountBadgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  priceContainer: {
    marginTop: 2,
    marginBottom: 2,
  },
  itemName:{
    fontSize:17,
    fontWeight: 'bold',
    color: '#000d66',
    flex: 1,
  },
  itemPrice:{
    fontSize: 15,
    marginTop: 2,
    color:'#ff4444',
    fontWeight: '600',
  },
  itemDesc:{
    fontSize:13,
    fontStyle: 'italic',
    color:'#666',
    marginTop: 2,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});