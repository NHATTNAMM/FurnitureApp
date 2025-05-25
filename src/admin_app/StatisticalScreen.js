import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { getOverviewStats } from "../Firebase/FirebaseAPI";
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const StatisticalScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getOverviewStats();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error(result.error);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000d66" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải dữ liệu thống kê</Text>
      </View>
    );
  }

  const chartData = {
    labels: stats.dailyStats.map((_, index) => `${index + 1}`),
    datasets: [
      {
        data: stats.dailyStats,
        color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const revenueChartData = {
    labels: stats.dailyRevenue.map((_, index) => `${index + 1}`),
    datasets: [
      {
        data: stats.dailyRevenue.map(revenue => revenue / 1000), // Chuyển đổi sang nghìn VND
        color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thống kê đơn hàng</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OrderScreen')}>
            <Ionicons name="arrow-forward" size={24} color="#000d66" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="cart-outline" size={24} color="#000d66" />
            </View>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Tổng đơn hàng</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="cash-outline" size={24} color="#000d66" />
            </View>
            <Text style={styles.statValue}>{formatPrice(stats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Tổng doanh thu</Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, { backgroundColor: '#fff7e6', borderColor: '#000d66' }]}>
            <FontAwesome5 name="clock" size={22} color="#000d66" style={{ marginBottom: 6 }} />
            <Text style={styles.statusValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statusLabel}>Chờ xác nhận</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#e6f0ff', borderColor: '#000d66' }]}>
            <FontAwesome5 name="truck" size={22} color="#000d66" style={{ marginBottom: 6 }} />
            <Text style={styles.statusValue}>{stats.readyOrders}</Text>
            <Text style={styles.statusLabel}>Chờ giao hàng</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#e6fff7', borderColor: '#000d66' }]}>
            <FontAwesome5 name="shipping-fast" size={22} color="#000d66" style={{ marginBottom: 6 }} />
            <Text style={styles.statusValue}>{stats.deliveringOrders}</Text>
            <Text style={styles.statusLabel}>Đang giao</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#f3e6ff', borderColor: '#000d66' }]}>
            <FontAwesome5 name="check-circle" size={22} color="#000d66" style={{ marginBottom: 6 }} />
            <Text style={styles.statusValue}>{stats.completedOrders}</Text>
            <Text style={styles.statusLabel}>Đã đặt</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê theo ngày</Text>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Số lượng đơn hàng</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '2',
                stroke: '#FFA500'
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Doanh thu (nghìn VND)</Text>
          <LineChart
            data={revenueChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '2',
                stroke: '#FF4444'
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê hệ thống</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="people-outline" size={24} color="#000d66" />
              <TouchableOpacity onPress={() => navigation.navigate('UserScreen')}>
                <Ionicons name="arrow-forward" size={24} color="#000d66" />
              </TouchableOpacity>
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Người dùng</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="sofa" size={28} color="#000d66" />
              <TouchableOpacity onPress={() => navigation.navigate('FurnitureScreen')}>
                <Ionicons name="arrow-forward" size={24} color="#000d66" />
              </TouchableOpacity>
            </View>
            <Text style={styles.statValue}>{stats.totalFurnitures}</Text>
            <Text style={styles.statLabel}>Sản phẩm</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default StatisticalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8fc",
    padding: 10,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000d66",
    marginBottom: 15,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#e0e7ff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1.5,
    borderColor: '#000d66',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000d66',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#000d66',
    textAlign: 'center',
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    paddingVertical: 22,
    paddingHorizontal: 10,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000d66',
    textAlign: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: '#000d66',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000d66',
    marginBottom: 10,
    textAlign: 'center',
  },
});