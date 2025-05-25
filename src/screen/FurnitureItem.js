import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Dimensions } from 'react-native';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FurnitureItem = ({ visible, furnitureItem, userId, onClose, onAddToCart }) => {
  const [soLuong, setSoLuong] = useState(1);
  const [tongGia, setTongGia] = useState(furnitureItem.furniturePrice);

  const add = () => {
    setSoLuong(prev => prev + 1);
  }

  const remove = () => {
    setSoLuong(prev => prev - 1);
  }

  useEffect(() => {
    setTongGia(soLuong * furnitureItem.furniturePrice);
  }, [soLuong])

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <EvilIcons name="close" size={30} color="#000D66" />
            </TouchableOpacity>
          </View>

          {/* Image Section */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: furnitureItem.image || furnitureItem.productImage || furnitureItem.furnitureImage }}
              style={styles.imagefurni}
            />
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            <Text style={styles.modalTitle}>{furnitureItem.furnitureName}</Text>
            
            <View style={styles.priceContainer}>
            <Text style={styles.modalPrice}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(furnitureItem.furniturePrice)}
            </Text>
              <View style={styles.tagContainer}>
                {furnitureItem.tag && furnitureItem.tag.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
            </View>
                ))}
            </View>
            </View>

            <Text style={styles.modalDescription}>{furnitureItem.description}</Text>

            {/* Quantity Section */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityText}>Số lượng</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  onPress={remove} 
                  disabled={soLuong <= 1} 
                  style={[styles.quantityButton, soLuong <= 1 && styles.quantityButtonDisabled]}
                >
                  <Ionicons 
                    name="remove-outline" 
                    size={24} 
                    color={soLuong <= 1 ? '#9CA3AF' : '#000D66'} 
                  />
                </TouchableOpacity>

                <View style={styles.quantityInput}>
                  <TextInput
                    style={styles.quantityInputText}
                   value={soLuong.toString()}
                   keyboardType='numeric'
                    onChangeText={(text) => {
                      const number = parseInt(text, 10);
                      if (!isNaN(number)) {
                      setSoLuong(number);
                      } else {
                      setSoLuong('');
                    }
                   }}
                  />
                </View>
              
                <TouchableOpacity onPress={add} style={styles.quantityButton}>
                  <Ionicons name="add-sharp" size={24} color="#000D66" />
                </TouchableOpacity>
                </View>
            </View>

            {/* Total Price Section */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalPrice}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tongGia)}
              </Text>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity 
              onPress={() => onAddToCart(userId, { furnitureItem, soLuong, tongGia })}
              style={[styles.addToCartButton, { backgroundColor: soLuong >= 1 ? '#000D66' : '#E5E7EB' }]}
            >
              <MaterialCommunityIcons 
                name="cart-plus" 
                size={24} 
                color={soLuong >= 1 ? '#FFFFFF' : '#9CA3AF'} 
                style={styles.cartIcon}
              />
              <Text style={[styles.addToCartButtonText, { color: soLuong >= 1 ? '#FFFFFF' : '#9CA3AF' }]}>
                Thêm vào giỏ hàng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  btnClose: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    paddingHorizontal: 20,
  },
  imagefurni: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  contentContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000D66',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalPrice: {
    fontSize: 22,
    color: '#000D66',
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  tagText: {
    color: '#000D66',
    fontSize: 12,
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 25,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000D66',
  },
  quantityContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    height: 45,
  },
  quantityButton: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  quantityInput: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityInputText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#000D66',
    fontWeight: '500',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 25,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4B5563',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000D66',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  cartIcon: {
    marginRight: 10,
  },
  addToCartButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FurnitureItem;
