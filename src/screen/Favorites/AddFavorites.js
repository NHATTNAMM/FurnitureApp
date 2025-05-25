import { StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

const AddFavorites = ({ product, style, iconSize = 22 }) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  // Kiểm tra xem sản phẩm đã được yêu thích chưa
  const checkIfFavorite = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem('favorites')
      if (favoritesData) {
        const favorites = JSON.parse(favoritesData)
        const isProductFavorite = favorites.some(item => item.id === product.id)
        setIsFavorite(isProductFavorite)
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error)
    }
  }

  useEffect(() => {
    if (product) {
      checkIfFavorite()
    }
  }, [product])

  // Thêm/xóa sản phẩm khỏi danh sách yêu thích
  const toggleFavorite = async () => {
    setLoading(true)
    try {
      const favoritesData = await AsyncStorage.getItem('favorites')
      let favorites = favoritesData ? JSON.parse(favoritesData) : []

      if (isFavorite) {
        // Xóa khỏi danh sách yêu thích
        favorites = favorites.filter(item => item.id !== product.id)
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites))
        setIsFavorite(false)
        Alert.alert('Thành công', 'Đã xóa khỏi danh sách yêu thích')
      } else {
        // Thêm vào danh sách yêu thích
        favorites.push(product)
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites))
        setIsFavorite(true)
        Alert.alert('Thành công', 'Đã thêm vào danh sách yêu thích')
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật danh sách yêu thích:', error)
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive, style]}
      onPress={toggleFavorite}
      disabled={loading}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={iconSize}
        color={isFavorite ? '#000d66' : '#E5E7EB'}
      />
    </TouchableOpacity>
  )
}

export default AddFavorites

const styles = StyleSheet.create({
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonActive: {
    backgroundColor: '#fff5f5',
  },
})