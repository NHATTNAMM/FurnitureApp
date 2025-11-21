import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Dimensions, ScrollView } from 'react-native';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PriceDisplay from '../component/PriceDisplay';
import DiscountBadge from '../component/DiscountBadge';
import GlassDiscountBadge from '../component/GlassDiscountBadge';
import StarRating from '../component/StarRating';
import ReviewList from '../component/ReviewList';
import ProductReview from '../component/ProductReview';
import { calculateDiscountedPrice, getReviewStats, getSimilarProducts } from '../Firebase/FirebaseAPI';

const { width } = Dimensions.get('window');

const FurnitureItem = ({ visible, furnitureItem, userId, onClose, onAddToCart }) => {
  const [soLuong, setSoLuong] = useState(1);
  const [tongGia, setTongGia] = useState(0);
  const [reviewStats, setReviewStats] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedSimilarProduct, setSelectedSimilarProduct] = useState(null);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const maxQuantity = furnitureItem.quantity || 0;
  
  // Tính giá cuối cùng (sau khi giảm giá nếu có)
  const finalPrice = calculateDiscountedPrice(furnitureItem.furniturePrice, furnitureItem.discountPercentage);

  useEffect(() => {
    if (visible && furnitureItem?.id) {
      loadReviewStats();
      loadSimilarProducts();
      
      // Auto refresh every 10 seconds when modal is open
      const interval = setInterval(() => {
        if (visible) {
          loadReviewStats();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [visible, furnitureItem]);

  const loadReviewStats = async () => {
    try {
      const result = await getReviewStats(furnitureItem.id);
      if (result.success) {
        setReviewStats(result.data);
      }
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const loadSimilarProducts = async () => {
    try {
      const result = await getSimilarProducts({
        id: furnitureItem.id,
        tag: furnitureItem.tag,
        furniturePrice: furnitureItem.furniturePrice
      });
      if (result.success) {
        setSimilarProducts(result.data);
      }
    } catch (error) {
      console.error('Error loading similar products:', error);
    }
  };

  const add = () => {
    if (soLuong < maxQuantity) {
      setSoLuong(prev => prev + 1);
    }
  }

  const remove = () => {
    if (soLuong > 1) {
      setSoLuong(prev => prev - 1);
    }
  }

  // Function to handle description text
  const getDisplayedDescription = () => {
    const description = furnitureItem.description || '';
    const maxLength = 50; // Giới hạn 50 ký tự
    
    if (description.length <= maxLength) {
      return description;
    }
    
    if (isDescriptionExpanded) {
      return description;
    }
    
    return description.substring(0, maxLength) + '...';
  };

  const shouldShowReadMore = () => {
    return furnitureItem.description && furnitureItem.description.length > 50;
  };

  const handleSimilarProductPress = (product) => {
    setSelectedSimilarProduct(product);
    setShowSimilarModal(true);
  };

  const handleCloseSimilarModal = () => {
    setShowSimilarModal(false);
    setSelectedSimilarProduct(null);
  };

  const renderCompactTags = () => {
    const tags = furnitureItem.tag || [];
    if (tags.length === 0) return null;
    
    const displayTags = tags.slice(0, 2);
    const remainingCount = tags.length - 2;
    const tagsText = displayTags.join(', ');
    
    return (
      <TouchableOpacity 
        style={styles.compactTagContainer}
        onPress={() => setShowAllTags(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="pricetag-outline" size={14} color="#000D66" />
        <Text style={styles.compactTagText} numberOfLines={1}>
          {tagsText}
          {remainingCount > 0 && ` +${remainingCount}`}
        </Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    setTongGia(soLuong * finalPrice);
  }, [soLuong, finalPrice])

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <EvilIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollViewFlex}
          >
            {/* Image Section */}
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: furnitureItem.image || furnitureItem.productImage || furnitureItem.furnitureImage }}
                style={styles.imagefurni}
              />
              {/* Glass badge giảm giá góc trên bên phải của ảnh */}
              {furnitureItem.discountPercentage > 0 && (
                <View style={styles.discountBadgeContainer}>
                  <GlassDiscountBadge 
                    discountPercentage={furnitureItem.discountPercentage} 
                    size="medium"
                    glassIntensity="high"
                  />
                </View>
              )}
            </View>

            {/* Content Section */}
            <View style={styles.contentContainer}>
              <Text style={styles.modalTitle}>{furnitureItem.furnitureName}</Text>
              
              <View style={styles.priceTagRow}>
                <PriceDisplay 
                  originalPrice={furnitureItem.furniturePrice}
                  discountPercentage={furnitureItem.discountPercentage}
                  fontSize={22}
                  style={styles.priceDisplay}
                />
                {renderCompactTags()}
              </View>

            {/* Product Description Section */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
              <Text style={styles.modalDescription}>{getDisplayedDescription()}</Text>
              {shouldShowReadMore() && (
                <TouchableOpacity 
                  onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  style={styles.readMoreButton}
                >
                  <Text style={styles.readMoreText}>
                    {isDescriptionExpanded ? 'Thu gọn' : 'Đọc thêm'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            </View>

            {/* Quantity Section with Stock Status */}
            <View style={styles.quantitySection}>
              <View style={styles.quantityLabelContainer}>
                <Text style={styles.quantityText}>Số lượng</Text>
                <Text style={[styles.stockTextSmall, maxQuantity <= 0 && styles.outOfStockTextSmall]}>
                  {maxQuantity > 0 ? `(còn ${maxQuantity})` : '(hết hàng)'}
                </Text>
              </View>
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  onPress={remove} 
                  disabled={soLuong <= 1 || maxQuantity <= 0} 
                  style={[styles.quantityButton, (soLuong <= 1 || maxQuantity <= 0) && styles.quantityButtonDisabled]}
                >
                  <Ionicons 
                    name="remove-outline" 
                    size={24} 
                    color={(soLuong <= 1 || maxQuantity <= 0) ? '#9CA3AF' : '#000D66'} 
                  />
                </TouchableOpacity>

                <View style={styles.quantityInput}>
                  <TextInput
                    style={styles.quantityInputText}
                   value={soLuong.toString()}
                   keyboardType='numeric'
                   editable={maxQuantity > 0}
                    onChangeText={(text) => {
                      const number = parseInt(text, 10);
                      if (!isNaN(number) && number <= maxQuantity && number > 0) {
                      setSoLuong(number);
                      } else if (number > maxQuantity) {
                      setSoLuong(maxQuantity);
                      }
                    }}
                  />
                </View>
              
                <TouchableOpacity 
                  onPress={add} 
                  disabled={soLuong >= maxQuantity || maxQuantity <= 0}
                  style={[styles.quantityButton, (soLuong >= maxQuantity || maxQuantity <= 0) && styles.quantityButtonDisabled]}
                >
                  <Ionicons 
                    name="add-sharp" 
                    size={24} 
                    color={(soLuong >= maxQuantity || maxQuantity <= 0) ? '#9CA3AF' : '#000D66'} 
                  />
                </TouchableOpacity>
                </View>
            </View>

            {/* Reviews Section */}
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.reviewsSectionTitle}>Đánh giá sản phẩm</Text>
                {reviewStats && reviewStats.totalReviews > 0 && (
                  <TouchableOpacity 
                    style={styles.reviewsHeaderRating}
                    onPress={() => setShowAllReviews(true)}
                  >
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.reviewsHeaderText}>
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              <ReviewList 
                furnitureId={furnitureItem.id}
                limit={2}
                showAllButton={true}
                onShowAll={() => setShowAllReviews(true)}
              />
            </View>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>Sản phẩm tương tự</Text>
                <View style={styles.similarGrid}>
                  {similarProducts.map((item, index) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.similarCard}
                      onPress={() => handleSimilarProductPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.similarImageContainer}>
                        <Image 
                          source={{ uri: item.image || item.furnitureImage }} 
                          style={styles.similarImage}
                        />
                        {item.discountPercentage > 0 && (
                          <View style={styles.similarDiscountBadge}>
                            <Text style={styles.similarDiscountText}>-{item.discountPercentage}%</Text>
                          </View>
                        )}
                        {item.quantity === 0 && (
                          <View style={styles.similarOutOfStockOverlay}>
                            <Text style={styles.similarOutOfStockText}>Hết hàng</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.similarInfo}>
                        <Text style={styles.similarName} numberOfLines={2}>{item.furnitureName}</Text>
                        <PriceDisplay 
                          originalPrice={item.furniturePrice}
                          discountPercentage={item.discountPercentage}
                          fontSize={13}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Fixed Bottom Bar - Total and Add to Cart */}
          <View style={styles.fixedBottomBar}>
            <View style={styles.totalPriceSection}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalPrice}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tongGia)}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => onAddToCart(userId, { furnitureItem, soLuong, tongGia })}
              disabled={maxQuantity <= 0}
              style={[styles.addToCartButtonFixed, { backgroundColor: (soLuong >= 1 && maxQuantity > 0) ? '#000D66' : '#E5E7EB' }]}
            >
              <MaterialCommunityIcons 
                name="cart-plus" 
                size={20} 
                color={(soLuong >= 1 && maxQuantity > 0) ? '#FFFFFF' : '#9CA3AF'} 
                style={styles.cartIcon}
              />
              <Text style={[styles.addToCartButtonFixedText, { color: (soLuong >= 1 && maxQuantity > 0) ? '#FFFFFF' : '#9CA3AF' }]}>
                {maxQuantity > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Review Modal */}
          <ProductReview
            visible={showAllReviews}
            onClose={() => setShowAllReviews(false)}
            furnitureId={furnitureItem.id}
            furnitureName={furnitureItem.furnitureName}
          />

          {/* Similar Product Detail Modal */}
          {selectedSimilarProduct && (
            <FurnitureItem
              visible={showSimilarModal}
              furnitureItem={selectedSimilarProduct}
              userId={userId}
              onClose={handleCloseSimilarModal}
              onAddToCart={onAddToCart}
            />
          )}

          {/* All Tags Modal */}
          <Modal
            visible={showAllTags}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAllTags(false)}
          >
            <View style={styles.tagsModalOverlay}>
              <View style={styles.tagsModalContent}>
                <View style={styles.tagsModalHeader}>
                  <Text style={styles.tagsModalTitle}>Loại sản phẩm</Text>
                  <TouchableOpacity onPress={() => setShowAllTags(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsModalList}>
                  {furnitureItem.tag && furnitureItem.tag.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Ionicons name="pricetag" size={14} color="#000D66" />
                      <Text style={styles.tagBadgeText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Modal>
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
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  btnClose: {
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  scrollViewFlex: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    paddingHorizontal: 16,
    position: 'relative',
  },
  imagefurni: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  discountBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 28,
    zIndex: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000D66',
    marginBottom: 15,
  },
  priceTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceDisplay: {
    flex: 1,
  },
  compactTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '40%',
    borderWidth: 0,
  },
  compactTagText: {
    fontSize: 12,
    color: '#000D66',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'justify',
  },
  descriptionSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    color: '#000D66',
    fontWeight: '600',
  },
  stockContainer: {
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  stockText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  stockTextSmall: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginLeft: 8,
  },
  outOfStockText: {
    color: '#dc3545',
  },
  outOfStockTextSmall: {
    color: '#dc3545',
  },
  quantityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 16,
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
  fixedBottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalPriceSection: {
    flex: 1,
    marginRight: 16,
  },
  addToCartButtonFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
  },
  addToCartButtonFixedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartIcon: {
    marginRight: 8,
  },
  addToCartButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviewSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  reviewSummaryCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  reviewSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewSummaryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  reviewsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewsHeaderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewsHeaderText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000D66',
  },
  tagsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tagsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  tagsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tagsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  tagsModalList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0,
  },
  tagBadgeText: {
    fontSize: 14,
    color: '#000D66',
    fontWeight: '500',
    marginLeft: 6,
  },
  similarSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000D66',
    marginBottom: 16,
  },
  similarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  similarCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  similarImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  similarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  similarDiscountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  similarDiscountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  similarOutOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarOutOfStockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  similarInfo: {
    padding: 12,
  },
  similarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 40,
    lineHeight: 20,
  },
});

export default FurnitureItem;
