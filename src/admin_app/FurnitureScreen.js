import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { titles } from '../globals/style';
import { db } from '../Firebase/FirebaseConfig';
import{collection,onSnapshot } from 'firebase/firestore'
import { removeFood } from '../Firebase/FirebaseAPI';

const FurnitureScreen = () => {
  const navigation  = useNavigation();
  const [furnitureData, setFurnitureData] = useState([]);

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
          
          },
        },
      ]
    );
  };
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      {item.image ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.furnitureImage} />
        </View>
      ) : null}
      <View style={{ flex: 1, marginLeft: item.image ? 12 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.itemName}>{item.furnitureName}</Text>
          <View style={styles.actionIcons}>
            <Feather name="edit" size={22} color="#000d66" style={{ marginRight: 16 }} />
            <Feather name="trash-2" size={22} color="#ff4444" onPress={() => deleteFurniture(item.id)} />
          </View>
        </View>
        <Text style={styles.itemPrice}>{Number(item.furniturePrice).toLocaleString('vi-VN')} đ</Text>
        <Text style={styles.itemDesc}>{item.description}</Text>
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
        <Ionicons name="add-circle" size={60} color="#0e90ad" />
      </TouchableOpacity>
    </View>
  );
};

export default FurnitureScreen

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
  },
  furnitureImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 12,
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});