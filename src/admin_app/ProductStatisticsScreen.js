import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { getProductStatistics } from '../Firebase/FirebaseAPI';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import PriceDisplay from '../component/PriceDisplay';
import GlassDiscountBadge from '../component/GlassDiscountBadge';

const screenWidth = Dimensions.get('window').width;

const ProductStatisticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('totalSold'); // 'totalSold', 'revenue', 'rating'

  useEffect(() => {
    fetchProductStats();
  }, []);

  const fetchProductStats = async () => {
    setLoading(true);
    const result = await getProductStatistics();
    if (result.success) {
      setProducts(result.data);
    } else {
      console.error('Lỗi khi lấy thống kê sản phẩm:', result.error);
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getSortedProducts = () => {
    const sorted = [...products];
    switch (sortBy) {
      case 'totalSold':
        return sorted.sort((a, b) => b.totalSold - a.totalSold);
      case 'revenue':
        return sorted.sort((a, b) => b.totalRevenue - a.totalRevenue);
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      default:
        return sorted;
    }
  };

  const openDetailModal = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeDetailModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#FFA500" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#FFA500" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#FFA500" />);
      }
    }
    return stars;
  };

  const renderDetailModal = () => {
    if (!selectedProduct) return null;

    const monthlyData = selectedProduct.monthlySales || [];
    const hasMonthlyData = monthlyData.some((val) => val > 0);

    const chartData = {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].slice(
        0,
        monthlyData.length
      ),
      datasets: [
        {
          data: hasMonthlyData ? monthlyData : [0],
          color: (opacity = 1) => `rgba(0, 13, 102, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết thống kê</Text>
                <TouchableOpacity onPress={closeDetailModal}>
                  <Ionicons name="close-circle" size={28} color="#000d66" />
                </TouchableOpacity>
              </View>

              {/* Product Info */}
              <View style={styles.productInfoCard}>
                <View style={styles.imageWrapper}>
                  {selectedProduct.image ? (
                    <>
                      <Image source={{ uri: selectedProduct.image }} style={styles.productImage} />
                      {selectedProduct.discountPercentage > 0 && (
                        <View style={styles.modalDiscountBadge}>
                          <GlassDiscountBadge
                            discountPercentage={selectedProduct.discountPercentage}
                            size="medium"
                          />
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.noImagePlaceholder}>
                      <MaterialCommunityIcons name="sofa" size={60} color="#ccc" />
                    </View>
                  )}
                </View>
                <Text style={styles.productName}>{selectedProduct.name}</Text>
                <PriceDisplay
                  originalPrice={selectedProduct.price}
                  discountPercentage={selectedProduct.discountPercentage}
                  fontSize={18}
                />
              </View>

              {/* Statistics Grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#fff7e6' }]}>
                  <FontAwesome5 name="box" size={24} color="#FFA500" />
                  <Text style={styles.statValue}>{selectedProduct.totalSold}</Text>
                  <Text style={styles.statLabel}>Đã bán</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#e6fff7' }]}>
                  <FontAwesome5 name="money-bill-wave" size={24} color="#4CAF50" />
                  <Text style={[styles.statValue, { fontSize: 16 }]}>
                    {formatPrice(selectedProduct.totalRevenue)}
                  </Text>
                  <Text style={styles.statLabel}>Doanh thu</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                  <FontAwesome5 name="warehouse" size={24} color="#FF9800" />
                  <Text style={styles.statValue}>{selectedProduct.currentStock}</Text>
                  <Text style={styles.statLabel}>Tồn kho</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                  <FontAwesome5 name="star" size={24} color="#2196F3" />
                  <Text style={styles.statValue}>
                    {selectedProduct.averageRating
                      ? selectedProduct.averageRating.toFixed(1)
                      : 'N/A'}
                  </Text>
                  <Text style={styles.statLabel}>Đánh giá</Text>
                </View>
              </View>

              {/* Review Stats */}
              {selectedProduct.totalReviews > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.sectionTitle}>Thống kê đánh giá</Text>
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.ratingDisplay}>
                        <Text style={styles.ratingNumber}>
                          {selectedProduct.averageRating.toFixed(1)}
                        </Text>
                        <View style={styles.starsContainer}>
                          {renderStars(selectedProduct.averageRating)}
                        </View>
                        <Text style={styles.reviewCount}>
                          ({selectedProduct.totalReviews} đánh giá)
                        </Text>
                      </View>
                    </View>

                    {/* Rating Distribution */}
                    {selectedProduct.ratingDistribution && (
                      <View style={styles.distributionContainer}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = selectedProduct.ratingDistribution[star] || 0;
                          const percentage =
                            selectedProduct.totalReviews > 0
                              ? (count / selectedProduct.totalReviews) * 100
                              : 0;
                          return (
                            <View key={star} style={styles.distributionRow}>
                              <Text style={styles.starLabel}>{star} ⭐</Text>
                              <View style={styles.progressBar}>
                                <View
                                  style={[styles.progressFill, { width: `${percentage}%` }]}
                                />
                              </View>
                              <Text style={styles.countLabel}>{count}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Monthly Sales Chart */}
              {hasMonthlyData && (
                <View style={styles.chartSection}>
                  <Text style={styles.sectionTitle}>Biểu đồ bán hàng theo tháng</Text>
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={chartData}
                      width={screenWidth - 80}
                      height={200}
                      chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 13, 102, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                        propsForDots: {
                          r: '5',
                          strokeWidth: '2',
                          stroke: '#000d66',
                        },
                        propsForBackgroundLines: {
                          strokeDasharray: '',
                          stroke: '#e0e0e0',
                          strokeWidth: 1,
                        },
                      }}
                      bezier
                      style={styles.chart}
                      withInnerLines={true}
                      withOuterLines={true}
                      withVerticalLines={false}
                      withHorizontalLines={true}
                      withDots={true}
                      withShadow={false}
                    />
                  </View>
                </View>
              )}

              {/* Status Tags */}
              <View style={styles.statusTagsContainer}>
                {selectedProduct.currentStock === 0 && (
                  <View style={[styles.statusTag, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.statusTagText, { color: '#E53935' }]}>
                      ⚠️ Hết hàng
                    </Text>
                  </View>
                )}
                {selectedProduct.currentStock > 0 && selectedProduct.currentStock < 10 && (
                  <View style={[styles.statusTag, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={[styles.statusTagText, { color: '#FF9800' }]}>
                      📦 Sắp hết hàng
                    </Text>
                  </View>
                )}
                {selectedProduct.discountPercentage > 0 && (
                  <View style={[styles.statusTag, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.statusTagText, { color: '#4CAF50' }]}>
                      🏷️ Đang giảm giá {selectedProduct.discountPercentage}%
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000d66" />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  const sortedProducts = getSortedProducts();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê sản phẩm</Text>
        <Text style={styles.headerSubtitle}>
          Tổng: {products.length} sản phẩm
        </Text>
      </View>

      {/* Sort Buttons */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sắp xếp theo:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'totalSold' && styles.sortButtonActive]}
            onPress={() => setSortBy('totalSold')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'totalSold' && styles.sortButtonTextActive,
              ]}
            >
              Số lượng bán
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'revenue' && styles.sortButtonActive]}
            onPress={() => setSortBy('revenue')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'revenue' && styles.sortButtonTextActive,
              ]}
            >
              Doanh thu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
            onPress={() => setSortBy('rating')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'rating' && styles.sortButtonTextActive,
              ]}
            >
              Đánh giá
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.productsList}
        contentContainerStyle={styles.productsListContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedProducts.map((product, index) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => openDetailModal(product)}
            activeOpacity={0.7}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>

            <View style={styles.productImageContainer}>
              {product.image ? (
                <>
                  <Image source={{ uri: product.image }} style={styles.productCardImage} />
                  {product.discountPercentage > 0 && (
                    <View style={styles.cardDiscountBadge}>
                      <GlassDiscountBadge
                        discountPercentage={product.discountPercentage}
                        size="small"
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noImagePlaceholderSmall}>
                  <MaterialCommunityIcons name="sofa" size={40} color="#ccc" />
                </View>
              )}
            </View>

            <View style={styles.productCardContent}>
              <Text style={styles.productCardName} numberOfLines={2}>
                {product.name}
              </Text>
              <PriceDisplay
                originalPrice={product.price}
                discountPercentage={product.discountPercentage}
                fontSize={14}
              />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <FontAwesome5 name="box" size={12} color="#666" />
                  <Text style={styles.statItemText}>{product.totalSold} đã bán</Text>
                </View>
                <View style={styles.statItem}>
                  <FontAwesome5 name="warehouse" size={12} color="#666" />
                  <Text style={styles.statItemText}>{product.currentStock} tồn</Text>
                </View>
              </View>

              {product.averageRating > 0 && (
                <View style={styles.ratingRow}>
                  <View style={styles.starsSmall}>{renderStars(product.averageRating)}</View>
                  <Text style={styles.ratingText}>
                    {product.averageRating.toFixed(1)} ({product.totalReviews})
                  </Text>
                </View>
              )}

              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Doanh thu:</Text>
                <Text style={styles.revenueValue}>{formatPrice(product.totalRevenue)}</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#000d66" style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderDetailModal()}
    </View>
  );
};

export default ProductStatisticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f8fc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000d66',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  sortContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortButtonActive: {
    backgroundColor: '#000d66',
    borderColor: '#000d66',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  productsList: {
    flex: 1,
  },
  productsListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#000d66',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardDiscountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
  },
  noImagePlaceholderSmall: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCardContent: {
    flex: 1,
  },
  productCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  starsSmall: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  revenueValue: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  chevron: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: screenWidth - 40,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000d66',
  },
  productInfoCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalDiscountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000d66',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000d66',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  reviewSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 13,
    color: '#666',
  },
  distributionContainer: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starLabel: {
    fontSize: 12,
    color: '#666',
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 4,
  },
  countLabel: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
  chartSection: {
    marginBottom: 20,
  },
  chartWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  statusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
