import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { calculateDeliveryDistance } from '../services/LocationService';

const DeliveryDistanceInfo = ({ address, onDistanceCalculated }) => {
  const [distance, setDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDistance = async () => {
      if (!address || address.trim() === '') {
        setDistance(10); // Mặc định
        setIsLoading(false);
        if (onDistanceCalculated) onDistanceCalculated(10);
        return;
      }

      setIsLoading(true);
      setError(false);

      try {
        const calculatedDistance = await calculateDeliveryDistance(address);
        setDistance(calculatedDistance);
        if (onDistanceCalculated) onDistanceCalculated(calculatedDistance);
      } catch (err) {
        console.error('Error calculating distance:', err);
        setError(true);
        setDistance(10); // Fallback
        if (onDistanceCalculated) onDistanceCalculated(10);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistance();
  }, [address]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const calculatedDistance = await calculateDeliveryDistance(address);
      setDistance(calculatedDistance);
      if (onDistanceCalculated) onDistanceCalculated(calculatedDistance);
    } catch (err) {
      setError(true);
      setDistance(10);
      if (onDistanceCalculated) onDistanceCalculated(10);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#000D66" />
        <Text style={styles.loadingText}>Đang tính khoảng cách...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <MaterialIcons name="error-outline" size={16} color="#E53935" />
        <Text style={styles.errorText}>Không thể tính khoảng cách</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <MaterialIcons name="refresh" size={16} color="#000D66" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MaterialIcons name="local-shipping" size={16} color="#000D66" />
      <Text style={styles.distanceText}>
        Khoảng cách giao hàng: ~{distance} km
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F0F4FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000D66',
    alignSelf: 'flex-start',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
  },
  loadingText: {
    fontSize: 13,
    color: '#000D66',
    fontWeight: '500',
    marginLeft: 6,
  },
  distanceText: {
    fontSize: 13,
    color: '#000D66',
    fontWeight: '600',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '500',
    marginLeft: 6,
  },
  retryButton: {
    marginLeft: 8,
    padding: 2,
  },
});

export default DeliveryDistanceInfo;
