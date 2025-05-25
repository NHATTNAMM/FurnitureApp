import { StyleSheet, Text, View, ActivityIndicator, FlatList, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

const Favorites = ({ navigation }) => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  // Lấy danh sách yêu thích từ AsyncStorage
  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem('favorites')
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData))
      }
      setLoading(false)
    } catch (error) {
      console.error('Lỗi khi tải danh sách yêu thích:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  // Xóa sản phẩm khỏi danh sách yêu thích
  const handleRemoveFavorite = async (productId) => {
    try {
      const updatedFavorites = favorites.filter(item => item.id !== productId)
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites))
      setFavorites(updatedFavorites)
      Alert.alert('Thành công', 'Đã xóa khỏi danh sách yêu thích')
    } catch (error) {
      console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error)
      Alert.alert('Lỗi', 'Không thể xóa khỏi danh sách yêu thích')
    }
  }

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.favoriteItem}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Ionicons name="heart" size={24} color="#000d66" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000d66" />
        <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
      </View>
    )
  }

  if (!favorites || favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#000d66" />
          <Text style={styles.emptyText}>Bạn chưa có sản phẩm yêu thích nào</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Xem sản phẩm</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000d66" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Danh sách yêu thích</Text>
          <Text style={styles.headerSubtitle}>{favorites.length} sản phẩm</Text>
        </View>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  )
}

export default Favorites

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#000d66',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#000d66',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#000d66',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    borderRadius: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#000d66',
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
  },
})