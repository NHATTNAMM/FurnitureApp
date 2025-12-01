import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getStoreLocation, refreshStoreLocationCache } from '../services/LocationService';

const StoreLocationInfo = () => {
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStoreInfo = async () => {
    setLoading(true);
    try {
      const info = await getStoreLocation();
      setStoreInfo(info);
    } catch (error) {
      console.error('Error fetching store location:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const info = await refreshStoreLocationCache();
      setStoreInfo(info);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cửa hàng');
    } catch (error) {
      console.error('Error refreshing store location:', error);
      Alert.alert('Lỗi', 'Không thể làm mới thông tin');
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#000D66" />
        <Text style={styles.loadingText}>Đang tải thông tin cửa hàng...</Text>
      </View>
    );
  }

  if (!storeInfo) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="error-outline" size={20} color="#E53935" />
        <Text style={styles.errorText}>Không có thông tin cửa hàng</Text>
      </View>
    );
  }

  return (
    <View style={styles.infoCard}>
      <View style={styles.header}>
        <MaterialIcons name="store" size={24} color="#000D66" />
        <Text style={styles.title}>Thông tin cửa hàng</Text>
      </View>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="business" size={18} color="#666" />
        <Text style={styles.label}>Tên:</Text>
        <Text style={styles.value}>{storeInfo.name}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="location-on" size={18} color="#666" />
        <Text style={styles.label}>Địa chỉ:</Text>
        <Text style={styles.value}>{storeInfo.address}</Text>
      </View>

      {storeInfo.phone && (
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={18} color="#666" />
          <Text style={styles.label}>SĐT:</Text>
          <Text style={styles.value}>{storeInfo.phone}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <MaterialIcons name="my-location" size={18} color="#666" />
        <Text style={styles.label}>Tọa độ:</Text>
        <Text style={styles.value}>
          {storeInfo.latitude.toFixed(4)}, {storeInfo.longitude.toFixed(4)}
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <MaterialIcons name="refresh" size={18} color="#fff" />
        <Text style={styles.refreshText}>Làm mới</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    margin: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#E53935',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000D66',
    marginLeft: 8,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    width: 70,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000D66',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default StoreLocationInfo;
