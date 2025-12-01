import * as Location from 'expo-location';
import { db } from '../Firebase/FirebaseConfig';
import { collection, getDocs, query, limit } from 'firebase/firestore';

// Cache cho địa chỉ cửa hàng
let storeLocationCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Lấy thông tin địa chỉ cửa hàng từ Firebase
 * @returns {Promise<Object>} Thông tin cửa hàng {latitude, longitude, address}
 */
export const fetchStoreLocationFromFirebase = async () => {
  try {
    // Kiểm tra cache
    const now = Date.now();
    if (storeLocationCache && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
      console.log('Using cached store location');
      return storeLocationCache;
    }

    // Lấy thông tin cửa hàng đầu tiên từ Firebase
    const furnitureStoresRef = collection(db, 'furnitureStores');
    const q = query(furnitureStoresRef, limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const storeDoc = querySnapshot.docs[0];
      const storeData = storeDoc.data();
      
      if (storeData.address) {
        // Geocode địa chỉ cửa hàng
        const storeCoords = await geocodeAddress(storeData.address);
        
        if (storeCoords) {
          storeLocationCache = {
            latitude: storeCoords.latitude,
            longitude: storeCoords.longitude,
            address: storeData.address,
            name: storeData.name || 'Cửa hàng nội thất',
            phone: storeData.phone || ''
          };
          lastFetchTime = now;
          console.log('Store location fetched from Firebase:', storeLocationCache);
          return storeLocationCache;
        }
      }
    }
    
    // Fallback về địa chỉ mặc định nếu không tìm thấy
    console.log('No store found in Firebase, using default location');
    return getDefaultStoreLocation();
    
  } catch (error) {
    console.error('Error fetching store location from Firebase:', error);
    return getDefaultStoreLocation();
  }
};

/**
 * Lấy địa chỉ cửa hàng mặc định (fallback)
 * @returns {Object}
 */
const getDefaultStoreLocation = () => {
  return {
    latitude: 21.0285,
    longitude: 105.8542,
    address: 'Thủ Đức, TP Hồ Chí Minh',
    name: 'Cửa hàng nội thất',
    phone: ''
  };
};

/**
 * Tính khoảng cách giữa 2 điểm theo công thức Haversine (km)
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách theo km
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Làm tròn 1 chữ số thập phân
};

/**
 * Chuyển đổi địa chỉ thành tọa độ (Geocoding)
 * @param {string} address - Địa chỉ cần chuyển đổi
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const geocodeAddress = async (address) => {
  try {
    if (!address || address.trim() === '') {
      return null;
    }

    // Yêu cầu quyền truy cập vị trí
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return null;
    }

    // Geocoding địa chỉ thành tọa độ
    const locations = await Location.geocodeAsync(address);
    
    if (locations && locations.length > 0) {
      const { latitude, longitude } = locations[0];
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Tính khoảng cách từ địa chỉ khách hàng đến cửa hàng
 * @param {string} customerAddress - Địa chỉ khách hàng
 * @returns {Promise<number>} Khoảng cách theo km (mặc định 10km nếu lỗi)
 */
export const calculateDeliveryDistance = async (customerAddress) => {
  try {
    if (!customerAddress || customerAddress.trim() === '') {
      console.log('Customer address is empty, using default distance');
      return 10; // Khoảng cách mặc định
    }

    // Lấy địa chỉ cửa hàng từ Firebase
    const storeLocation = await fetchStoreLocationFromFirebase();
    
    // Chuyển đổi địa chỉ khách hàng thành tọa độ
    const customerLocation = await geocodeAddress(customerAddress);
    
    if (!customerLocation) {
      console.log('Could not geocode customer address, using default distance');
      return 10; // Khoảng cách mặc định
    }

    // Tính khoảng cách theo công thức Haversine
    const distance = calculateHaversineDistance(
      storeLocation.latitude,
      storeLocation.longitude,
      customerLocation.latitude,
      customerLocation.longitude
    );

    console.log(`Distance from store (${storeLocation.name}) to customer: ${distance} km`);
    return distance;
    
  } catch (error) {
    console.error('Error calculating delivery distance:', error);
    return 10; // Khoảng cách mặc định khi có lỗi
  }
};

/**
 * Lấy vị trí hiện tại của thiết bị
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Chuyển đổi tọa độ thành địa chỉ (Reverse Geocoding)
 * @param {number} latitude - Vĩ độ
 * @param {number} longitude - Kinh độ
 * @returns {Promise<string | null>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      const parts = [
        address.name,
        address.street,
        address.district,
        address.city,
        address.region,
        address.country
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Cập nhật cache địa chỉ cửa hàng (gọi sau khi admin cập nhật)
 */
export const refreshStoreLocationCache = async () => {
  storeLocationCache = null;
  lastFetchTime = null;
  return await fetchStoreLocationFromFirebase();
};

/**
 * Lấy thông tin địa chỉ cửa hàng hiện tại
 * @returns {Promise<Object>} Thông tin cửa hàng
 */
export const getStoreLocation = async () => {
  return await fetchStoreLocationFromFirebase();
};

export default {
  geocodeAddress,
  calculateDeliveryDistance,
  getCurrentLocation,
  reverseGeocode,
  fetchStoreLocationFromFirebase,
  refreshStoreLocationCache,
  getStoreLocation,
  calculateHaversineDistance
};
