import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchFurnitures, addToCart } from '../Firebase/FirebaseAPI';
import { useNavigation, useRoute } from '@react-navigation/native';
import FurnitureItem from './FurnitureItem';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Style from '../globals/style';

const SearchScreen = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        navigation.navigate('LogIn');
      }
    });
    return () => unsubscribe();
  }, [navigation]);

  useEffect(() => {
    if (route.params?.searchText) {
      setSearchText(route.params.searchText);
      handleSearch(route.params.searchText);
    }
  }, [route.params]);

  const handleSearch = async (text) => {
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const result = await searchFurnitures(text);
    if (result.success) {
      setSearchResults(result.data);
    }
    setIsLoading(false);
  };

  const openModal = (furnitureItem) => {
    if (furnitureItem !== selectedFurniture) {
      setSelectedFurniture(furnitureItem);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setSelectedFurniture(null);
    setModalVisible(false);
  };

  const handleAddToCart = async (userId, furnitureItem, soLuong, tongGia) => {
    const result = await addToCart(userId, furnitureItem, soLuong, tongGia);
    if (result.success) {
      Alert.alert("Đã thêm vào giỏ hàng", result.message);
      closeModal();
    } else {
      Alert.alert("Lỗi", result.message);
    }
  };

  const renderFurnitureItem = ({ item }) => (
    <TouchableOpacity
      style={styles.furnitureCard}
      onPress={() => openModal(item)}
    >
      <Image source={{ uri: item.image }} style={styles.furnitureImage} />
      <View style={styles.furnitureInfo}>
        <Text style={styles.furnitureName}>{item.furnitureName}</Text>
        <Text style={styles.furniturePrice}>{Number(item.furniturePrice).toLocaleString('vi-VN')} đ</Text>
        <View style={styles.tagContainer}>
          {Array.isArray(item.tag) && item.tag.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Style.colors.cam} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Hãy nhập để tìm kiếm..."
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                handleSearch(text);
              }}
              autoFocus
            />
            {searchText !== '' && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText('');
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#000d66" />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderFurnitureItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.furnitureList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText ? 'Không tìm thấy nội thất phù hợp' : 'Nhập từ khóa để tìm kiếm'}
                </Text>
              </View>
            }
          />
        )}

        {selectedFurniture && (
          <FurnitureItem
            visible={modalVisible}
            furnitureItem={selectedFurniture}
            userId={userId}
            onClose={closeModal}
            onAddToCart={handleAddToCart}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    elevation: 2,
  },
  backButton: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  furnitureList: {
    padding: 10,
    paddingBottom: 100,
  },
  furnitureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  furnitureImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  furnitureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  furnitureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  furniturePrice: {
    fontSize: 15,
    color: Style.colors.cam,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#fff5eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Style.colors.cam,
  },
  tagText: {
    fontSize: 12,
    color: Style.colors.cam,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SearchScreen;