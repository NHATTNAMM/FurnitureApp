import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Modal, FlatList } from "react-native";
import { getOverviewStats } from "../Firebase/FirebaseAPI";
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const StatisticalScreen = ({ onNavigateToMenu }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [viewType, setViewType] = useState('day'); // 'day' hoặc 'month' - Mặc định là 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateList, setDateList] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getOverviewStats();
      if (result.success) {
        setStats(result.data);
        
        // Tạo danh sách tất cả các ngày trong tháng hiện tại
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // Lấy ngày cuối tháng
        const dates = [];
        
        for (let day = 1; day <= lastDayOfMonth; day++) {
          dates.push(new Date(year, month, day));
        }
        
        setDateList(dates);
      } else {
        console.error(result.error);
      }
      setLoading(false);
    };

    fetchStats();

    // Tự động refresh dữ liệu mỗi 5 phút để cập nhật khi sang ngày/tháng mới
    const intervalId = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000); // 5 phút

    return () => clearInterval(intervalId);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Tạo labels tháng cho biểu đồ
  const createMonthLabels = (dataLength) => {
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return monthNames.slice(0, dataLength);
  };

  // Tạo labels ngày cho biểu đồ
  const createDayLabels = (dataLength) => {
    if (dataLength <= 7) {
      return Array.from({ length: dataLength }, (_, i) => `${i + 1}`);
    } else if (dataLength <= 15) {
      return Array.from({ length: dataLength }, (_, i) => 
        i === 0 || i === dataLength - 1 || (i + 1) % 3 === 0 ? `${i + 1}` : ''
      );
    } else {
      return Array.from({ length: dataLength }, (_, i) => 
        i === 0 || i === dataLength - 1 || (i + 1) % 5 === 0 ? `${i + 1}` : ''
      );
    }
  };

  // Lấy thông tin năm hiện tại
  const getYearInfo = () => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      currentMonth: today.getMonth() + 1,
      totalMonths: stats?.monthlyStats?.length || 0
    };
  };

  // Lấy thông tin tháng hiện tại
  const getMonthInfo = () => {
    const today = new Date();
    return {
      month: today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      startDay: 1,
      endDay: today.getDate(),
      totalDays: stats?.dailyStats?.length || 0
    };
  };

  // Tính toán thống kê cho biểu đồ
  const getChartStats = (data) => {
    if (!data || data.length === 0) return { max: 0, min: 0, avg: 0 };
    const max = Math.max(...data);
    const min = Math.min(...data);
    const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    return { max, min, avg };
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

  const yearInfo = getYearInfo();
  const monthInfo = getMonthInfo();
  
  // Dữ liệu hiển thị theo viewType
  const displayData = viewType === 'month' ? {
    orders: stats.monthlyStats,
    revenue: stats.monthlyRevenue
  } : {
    orders: stats.dailyStats,
    revenue: stats.dailyRevenue
  };

  const orderStats = getChartStats(displayData.orders);
  const revenueData = displayData.revenue.map(r => Math.round(r / 1000));
  const revenueStats = getChartStats(revenueData);

  // Lấy dữ liệu theo tháng được chọn
  const getDataForSelectedMonth = () => {
    return {
      orders: stats.monthlyStats[selectedMonth] || 0,
      revenue: stats.monthlyRevenue[selectedMonth] || 0
    };
  };

  const selectedMonthData = getDataForSelectedMonth();

  // Lấy dữ liệu theo ngày được chọn
  const getDataForSelectedDate = () => {
    const dateIndex = selectedDate.getDate() - 1;
    return {
      orders: stats.dailyStats[dateIndex] || 0,
      revenue: stats.dailyRevenue[dateIndex] || 0
    };
  };

  const selectedDayData = getDataForSelectedDate();

  // Format tháng hiển thị
  const formatSelectedMonth = (monthIndex) => {
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return monthNames[monthIndex];
  };

  const formatFullMonth = (monthIndex) => {
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${monthNames[monthIndex]} năm ${yearInfo.year}`;
  };

  // Format ngày hiển thị
  const formatSelectedDate = (date) => {
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const chartData = {
    labels: viewType === 'month' ? createMonthLabels(displayData.orders.length) : createDayLabels(displayData.orders.length),
    datasets: [
      {
        data: displayData.orders.length > 0 ? displayData.orders : [0],
        color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
        strokeWidth: 3
      }
    ]
  };

  const revenueChartData = {
    labels: viewType === 'month' ? createMonthLabels(displayData.revenue.length) : createDayLabels(displayData.revenue.length),
    datasets: [
      {
        data: revenueData.length > 0 ? revenueData : [0],
        color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`,
        strokeWidth: 3
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thống kê đơn hàng</Text>
          <TouchableOpacity onPress={() => onNavigateToMenu && onNavigateToMenu('4')}>
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

      {/* Payment Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê thanh toán</Text>
        
        <View style={styles.paymentStatsContainer}>
          <View style={styles.paymentMethodRow}>
            <View style={[styles.paymentCard, { backgroundColor: '#e8f5e8', borderColor: '#4CAF50' }]}>
              <View style={styles.onlinePaymentHeader}>
                <Ionicons name="card-outline" size={24} color="#4CAF50" style={{ marginRight: 4 }} />
                <Ionicons name="qr-code-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.paymentValue, { color: '#4CAF50' }]}>{stats.onlineOrders || 0}</Text>
              <Text style={styles.paymentLabel}>Thanh toán online</Text>
              <Text style={styles.paymentSubLabel}>QR Pay + E-Wallet</Text>
            </View>
            
            <View style={[styles.paymentCard, { backgroundColor: '#fff3e0', borderColor: '#FF9800' }]}>
              <Ionicons name="wallet-outline" size={28} color="#FF9800" style={{ marginBottom: 8 }} />
              <Text style={[styles.paymentValue, { color: '#FF9800' }]}>{stats.codOrders || 0}</Text>
              <Text style={styles.paymentLabel}>Thanh toán COD</Text>
              <Text style={styles.paymentSubLabel}>Tiền mặt khi nhận</Text>
            </View>
          </View>
          
          <View style={styles.paymentStatusRow}>
            <View style={[styles.paymentCard, { backgroundColor: '#e3f2fd', borderColor: '#2196F3' }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#2196F3" style={{ marginBottom: 8 }} />
              <Text style={[styles.paymentValue, { color: '#2196F3' }]}>{stats.paidOrders || 0}</Text>
              <Text style={styles.paymentLabel}>Đã thanh toán</Text>
            </View>
            
            <View style={[styles.paymentCard, { backgroundColor: '#ffebee', borderColor: '#F44336' }]}>
              <Ionicons name="time-outline" size={28} color="#F44336" style={{ marginBottom: 8 }} />
              <Text style={[styles.paymentValue, { color: '#F44336' }]}>{stats.unpaidOrders || 0}</Text>
              <Text style={styles.paymentLabel}>Chưa thanh toán</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biểu đồ thống kê</Text>
        
        {/* Nút toggle xem theo tháng/ngày */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewType === 'month' && styles.toggleButtonActive]}
            onPress={() => setViewType('month')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="calendar-outline" 
              size={18} 
              color={viewType === 'month' ? '#fff' : '#666'} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.toggleButtonText, viewType === 'month' && styles.toggleButtonTextActive]}>
              Theo tháng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewType === 'day' && styles.toggleButtonActive]}
            onPress={() => setViewType('day')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="today-outline" 
              size={18} 
              color={viewType === 'day' ? '#fff' : '#666'} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.toggleButtonText, viewType === 'day' && styles.toggleButtonTextActive]}>
              Theo ngày
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionSubtitle}>
          {viewType === 'month' 
            ? `Năm ${yearInfo.year} (Tháng 1 - ${yearInfo.currentMonth})`
            : `Thời gian: ${monthInfo.month} (Ngày ${monthInfo.startDay} - ${monthInfo.endDay})`
          }
        </Text>

        {/* Dropdown chọn tháng hoặc ngày */}
        {viewType === 'month' ? (
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowMonthPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateSelectorContent}>
              <Ionicons name="calendar" size={20} color="#000d66" />
              <Text style={styles.dateSelectorText}>{formatSelectedMonth(selectedMonth)}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#000d66" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateSelectorContent}>
              <Ionicons name="calendar" size={20} color="#000d66" />
              <Text style={styles.dateSelectorText}>{formatSelectedDate(selectedDate)}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#000d66" />
          </TouchableOpacity>
        )}

        {/* Thống kê theo lựa chọn */}
        {viewType === 'month' ? (
          <View style={styles.selectedDayCard}>
            <Text style={styles.selectedDayTitle}>📅 {formatFullMonth(selectedMonth)}</Text>
            <View style={styles.selectedDayStats}>
              <View style={styles.selectedDayStat}>
                <View style={styles.selectedDayStatHeader}>
                  <Ionicons name="cart" size={20} color="#FFA500" />
                  <Text style={styles.selectedDayStatLabel}>Đơn hàng</Text>
                </View>
                <Text style={[styles.selectedDayStatValue, { color: '#FFA500' }]}>
                  {selectedMonthData.orders} đơn
                </Text>
              </View>
              <View style={styles.selectedDayDivider} />
              <View style={styles.selectedDayStat}>
                <View style={styles.selectedDayStatHeader}>
                  <Ionicons name="cash" size={20} color="#FF4444" />
                  <Text style={styles.selectedDayStatLabel}>Doanh thu</Text>
                </View>
                <Text style={[styles.selectedDayStatValue, { color: '#FF4444' }]}>
                  {formatPrice(selectedMonthData.revenue)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.selectedDayCard}>
            <Text style={styles.selectedDayTitle}>📅 {formatFullDate(selectedDate)}</Text>
            <View style={styles.selectedDayStats}>
              <View style={styles.selectedDayStat}>
                <View style={styles.selectedDayStatHeader}>
                  <Ionicons name="cart" size={20} color="#FFA500" />
                  <Text style={styles.selectedDayStatLabel}>Đơn hàng</Text>
                </View>
                <Text style={[styles.selectedDayStatValue, { color: '#FFA500' }]}>
                  {selectedDayData.orders} đơn
                </Text>
              </View>
              <View style={styles.selectedDayDivider} />
              <View style={styles.selectedDayStat}>
                <View style={styles.selectedDayStatHeader}>
                  <Ionicons name="cash" size={20} color="#FF4444" />
                  <Text style={styles.selectedDayStatLabel}>Doanh thu</Text>
                </View>
                <Text style={[styles.selectedDayStatValue, { color: '#FF4444' }]}>
                  {formatPrice(selectedDayData.revenue)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Modal chọn tháng */}
        <Modal
          visible={showMonthPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMonthPicker(false)}
          >
            <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>📅 Chọn tháng</Text>
                <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                  <Ionicons name="close" size={24} color="#000d66" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.dropdownList}>
                {Array.from({ length: 12 }, (_, index) => {
                  const isSelected = index === selectedMonth;
                  const currentMonth = new Date().getMonth();
                  const isCurrentMonth = index === currentMonth;
                  const isPastMonth = index <= currentMonth;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                        !isPastMonth && styles.dropdownItemDisabled
                      ]}
                      onPress={() => {
                        if (isPastMonth) {
                          setSelectedMonth(index);
                          setShowMonthPicker(false);
                        }
                      }}
                      activeOpacity={isPastMonth ? 0.7 : 1}
                      disabled={!isPastMonth}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                          !isPastMonth && styles.dropdownItemTextDisabled
                        ]}>
                          {formatFullMonth(index)}
                        </Text>
                        {isCurrentMonth && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Hiện tại</Text>
                          </View>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#000d66" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal chọn ngày */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>📅 Chọn ngày</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#000d66" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={dateList}
                keyExtractor={(item, index) => index.toString()}
                style={styles.dropdownList}
                renderItem={({ item: date, index }) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const today = new Date();
                  const isToday = date.toDateString() === today.toDateString();
                  const isPastDate = date <= today;
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                        !isPastDate && styles.dropdownItemDisabled
                      ]}
                      onPress={() => {
                        if (isPastDate) {
                          setSelectedDate(date);
                          setShowDatePicker(false);
                        }
                      }}
                      activeOpacity={isPastDate ? 0.7 : 1}
                      disabled={!isPastDate}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                          !isPastDate && styles.dropdownItemTextDisabled
                        ]}>
                          {formatFullDate(date)}
                        </Text>
                        {isToday && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Hôm nay</Text>
                          </View>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#000d66" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Biểu đồ 1: Số lượng đơn hàng */}
        <View style={styles.chartWrapper}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <View style={[styles.colorIndicator, { backgroundColor: '#FFA500' }]} />
              <Text style={styles.chartTitle}>Số lượng đơn hàng</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Cao nhất</Text>
                <Text style={[styles.statItemValue, { color: '#FFA500' }]}>{orderStats.max}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Trung bình</Text>
                <Text style={[styles.statItemValue, { color: '#FFA500' }]}>{orderStats.avg}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Thấp nhất</Text>
                <Text style={[styles.statItemValue, { color: '#FFA500' }]}>{orderStats.min}</Text>
              </View>
            </View>
          </View>

          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#FFA500'
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e0e0e0',
                strokeWidth: 1
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
            yAxisSuffix=" đơn"
          />
        </View>

        {/* Biểu đồ 2: Doanh thu */}
        <View style={styles.chartWrapper}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <View style={[styles.colorIndicator, { backgroundColor: '#FF4444' }]} />
              <Text style={styles.chartTitle}>Doanh thu (nghìn VNĐ)</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Cao nhất</Text>
                <Text style={[styles.statItemValue, { color: '#FF4444' }]}>{revenueStats.max}k</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Trung bình</Text>
                <Text style={[styles.statItemValue, { color: '#FF4444' }]}>{revenueStats.avg}k</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Thấp nhất</Text>
                <Text style={[styles.statItemValue, { color: '#FF4444' }]}>{revenueStats.min}k</Text>
              </View>
            </View>
          </View>

          <LineChart
            data={revenueChartData}
            width={screenWidth - 80}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#FF4444'
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e0e0e0',
                strokeWidth: 1
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
            yAxisSuffix="k"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê hệ thống</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => onNavigateToMenu && onNavigateToMenu('2')}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <Ionicons name="people-outline" size={24} color="#000d66" />
              <Ionicons name="arrow-forward" size={24} color="#000d66" />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Người dùng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => onNavigateToMenu && onNavigateToMenu('3')}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="sofa" size={28} color="#000d66" />
              <Ionicons name="arrow-forward" size={24} color="#000d66" />
            </View>
            <Text style={styles.statValue}>{stats.totalFurnitures}</Text>
            <Text style={styles.statLabel}>Sản phẩm</Text>
          </TouchableOpacity>
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
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontStyle: 'italic',
  },
  chartWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  axisInfo: {
    marginVertical: 8,
  },
  axisLabelY: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  axisLabelX: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  axisText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  chartNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000d66',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Payment Statistics Styles
  paymentStatsContainer: {
    marginTop: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  paymentSubLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  onlinePaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Date Selector Styles
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000d66',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000d66',
    marginLeft: 10,
  },
  selectedDayCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000d66',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectedDayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  selectedDayStat: {
    flex: 1,
    alignItems: 'center',
  },
  selectedDayDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  selectedDayStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDayStatLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginLeft: 5,
  },
  selectedDayStatValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000d66',
  },
  dropdownList: {
    maxHeight: '100%',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e0e7ff',
  },
  dropdownItemDisabled: {
    opacity: 0.4,
    backgroundColor: '#f9f9f9',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#000d66',
    fontWeight: '700',
  },
  dropdownItemTextDisabled: {
    color: '#999',
  },
  currentBadge: {
    backgroundColor: '#FFA500',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Toggle Button Styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 130,
  },
  toggleButtonActive: {
    backgroundColor: '#000d66',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});