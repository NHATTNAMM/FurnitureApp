import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { getProductStatistics } from '../Firebase/FirebaseAPI';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const ProductStatisticsTableScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState('totalSold'); // 'totalSold', 'revenue', 'rating', 'stock'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

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

  const formatCompactPrice = (price) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'K';
    }
    return price.toString();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortedProducts = () => {
    const sorted = [...products];
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'totalSold':
          return multiplier * (a.totalSold - b.totalSold);
        case 'revenue':
          return multiplier * (a.totalRevenue - b.totalRevenue);
        case 'stock':
          return multiplier * (a.currentStock - b.currentStock);
        case 'rating':
          return multiplier * ((a.averageRating || 0) - (b.averageRating || 0));
        case 'reviews':
          return multiplier * ((a.totalReviews || 0) - (b.totalReviews || 0));
        default:
          return 0;
      }
    });

    return sorted;
  };

  const renderSortIcon = (column) => {
    if (sortBy === column) {
      return (
        <Ionicons
          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
          size={14}
          color="#000d66"
          style={{ marginLeft: 4 }}
        />
      );
    }
    return null;
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000d66" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Thống kê dạng bảng</Text>
          <Text style={styles.headerSubtitle}>Tổng: {products.length} sản phẩm</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="package-variant" size={24} color="#4CAF50" />
          <Text style={styles.summaryValue}>
            {products.reduce((sum, p) => sum + p.totalSold, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Tổng đã bán</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="currency-usd" size={24} color="#2196F3" />
          <Text style={styles.summaryValue}>
            {formatCompactPrice(products.reduce((sum, p) => sum + p.totalRevenue, 0))}
          </Text>
          <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="warehouse" size={24} color="#FF9800" />
          <Text style={styles.summaryValue}>
            {products.reduce((sum, p) => sum + p.currentStock, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Tổng tồn kho</Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.sttColumn]}>
              <Text style={styles.headerText}>STT</Text>
            </View>
            <TouchableOpacity
              style={[styles.tableHeaderCell, styles.productColumn]}
              onPress={() => handleSort('name')}
            >
              <View style={styles.headerCellContent}>
                <Text style={styles.headerText}>Sản phẩm</Text>
                {renderSortIcon('name')}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableHeaderCell, styles.numberColumn]}
              onPress={() => handleSort('totalSold')}
            >
              <View style={styles.headerCellContent}>
                <Text style={styles.headerText}>Đã bán</Text>
                {renderSortIcon('totalSold')}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableHeaderCell, styles.priceColumn]}
              onPress={() => handleSort('revenue')}
            >
              <View style={styles.headerCellContent}>
                <Text style={styles.headerText}>Doanh thu</Text>
                {renderSortIcon('revenue')}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableHeaderCell, styles.numberColumn]}
              onPress={() => handleSort('stock')}
            >
              <View style={styles.headerCellContent}>
                <Text style={styles.headerText}>Tồn kho</Text>
                {renderSortIcon('stock')}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableHeaderCell, styles.numberColumn]}
              onPress={() => handleSort('rating')}
            >
              <View style={styles.headerCellContent}>
                <Text style={styles.headerText}>Đánh giá</Text>
                {renderSortIcon('rating')}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableHeaderCell, styles.numberColumn]}
              onPress={() => handleSort('reviews')}
            >
              <View style={styles.headerCellContent}>
                <Text style={styles.headerText}>Lượt đánh giá</Text>
                {renderSortIcon('reviews')}
              </View>
            </TouchableOpacity>
          </View>

          {/* Table Body */}
          <ScrollView showsVerticalScrollIndicator={true} style={styles.tableBody}>
            {sortedProducts.map((product, index) => (
              <View
                key={product.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                <View style={[styles.tableCell, styles.sttColumn]}>
                  <Text style={styles.cellText}>{index + 1}</Text>
                </View>
                <View style={[styles.tableCell, styles.productColumn]}>
                  <View style={styles.productCellContent}>
                    <View style={styles.productImageWrapper}>
                      {product.image ? (
                        <Image source={{ uri: product.image }} style={styles.productImage} />
                      ) : (
                        <View style={styles.noImagePlaceholder}>
                          <MaterialCommunityIcons name="sofa" size={24} color="#ccc" />
                        </View>
                      )}
                      {product.discountPercentage > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>-{product.discountPercentage}%</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productNameText} numberOfLines={3}>
                        {product.name}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.tableCell, styles.numberColumn]}>
                  <Text style={styles.soldText}>{product.totalSold}</Text>
                </View>
                <View style={[styles.tableCell, styles.priceColumn]}>
                  <Text style={styles.revenueText}>
                    {formatCompactPrice(product.totalRevenue)}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.numberColumn]}>
                  <Text
                    style={[
                      styles.stockText,
                      product.currentStock === 0 && styles.outOfStock,
                      product.currentStock > 0 &&
                        product.currentStock < 10 &&
                        styles.lowStock,
                    ]}
                  >
                    {product.currentStock}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.numberColumn]}>
                  <View style={styles.ratingCell}>
                    <Text style={styles.ratingText}>
                      {product.averageRating ? product.averageRating.toFixed(1) : 'N/A'}
                    </Text>
                    {product.averageRating > 0 && (
                      <Ionicons name="star" size={12} color="#FFA500" style={{ marginLeft: 2 }} />
                    )}
                  </View>
                </View>
                <View style={[styles.tableCell, styles.numberColumn]}>
                  <Text style={styles.cellText}>{product.totalReviews || 0}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Chú thích:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFEBEE' }]} />
            <Text style={styles.legendText}>Hết hàng</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFF3E0' }]} />
            <Text style={styles.legendText}>Sắp hết</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProductStatisticsTableScreen;

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
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
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
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000d66',
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
  },
  tableScrollContainer: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ff',
    borderBottomWidth: 2,
    borderBottomColor: '#000d66',
    paddingVertical: 12,
  },
  tableHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#000d66',
  },
  headerCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000d66',
  },
  sttColumn: {
    minWidth: 60,
    maxWidth: 60,
  },
  productColumn: {
    minWidth: 280,
    maxWidth: 280,
  },
  numberColumn: {
    minWidth: 80,
    maxWidth: 80,
  },
  priceColumn: {
    minWidth: 100,
    maxWidth: 100,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 80,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  cellText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  productCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  productImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 65,
    height: 65,
    borderRadius: 10,
    resizeMode: 'cover',
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
  },
  noImagePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
  },
  discountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productNameText: {
    fontSize: 13.5,
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 18,
  },
  soldText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  revenueText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '700',
  },
  stockText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  lowStock: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  ratingCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#FFA500',
    fontWeight: '600',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});
