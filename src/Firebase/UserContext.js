import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState, createContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './FirebaseConfig';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Hàm tính toán thống kê người dùng
  const calculateUserStats = async (userId) => {
    try {
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, where('userId', '==', userId));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      let totalOrders = 0; // Tổng số đơn hàng (không bao gồm đã hủy)
      let totalSpent = 0;  // Tổng số tiền đã chi tiêu (chỉ từ đơn hoàn thành)
      let completedOrders = 0; // Số đơn hàng hoàn thành
      let totalProductsToReview = 0; // Tổng số sản phẩm có thể đánh giá
      
      // Lấy danh sách tất cả sản phẩm từ đơn hàng hoàn thành (không trùng lặp)
      const uniqueCompletedProducts = new Set();
      
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        
        // Tính tổng số đơn hàng (không bao gồm đã hủy)
        if (orderData.status !== 'Đã hủy') {
          totalOrders++;
        }
        
        // Tính số tiền đã chi tiêu (chỉ từ đơn hoàn thành)
        if (orderData.status === 'Đã đặt') {
          completedOrders++;
          totalSpent += orderData.totalAmount || 0;
          
          // Thu thập tất cả sản phẩm từ đơn hàng hoàn thành (không trùng lặp)
          if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach(item => {
              if (item.furnitureItem) {
                const furnitureId = item.furnitureItem.furnitureId || item.furnitureItem.id;
                if (furnitureId) {
                  uniqueCompletedProducts.add(String(furnitureId));
                }
              }
            });
          }
        }
      });

      totalProductsToReview = uniqueCompletedProducts.size;

      // Lấy số đánh giá đã viết
      const reviewsRef = collection(db, 'reviews');
      const reviewsQuery = query(reviewsRef, where('userId', '==', userId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const reviewedProductIds = new Set();
      reviewsSnapshot.forEach((doc) => {
        const reviewData = doc.data();
        if (reviewData.furnitureId) {
          reviewedProductIds.add(String(reviewData.furnitureId));
        }
      });

      const totalReviews = reviewedProductIds.size;
      const pendingReviews = Math.max(0, totalProductsToReview - totalReviews);
      
      console.log(`User stats for ${userId}: Total Orders: ${totalOrders}, Completed: ${completedOrders}, Spent: ${totalSpent}, Reviews: ${totalReviews}/${totalProductsToReview}, Pending: ${pendingReviews}`);
      
      return { 
        totalOrders, 
        totalSpent, 
        completedOrders,
        totalReviews,
        totalProductsToReview,
        pendingReviews
      };
    } catch (error) {
      console.error('Lỗi tính toán thống kê người dùng:', error);
      return { 
        totalOrders: 0, 
        totalSpent: 0, 
        completedOrders: 0,
        totalReviews: 0,
        totalProductsToReview: 0,
        pendingReviews: 0
      };
    }
  };

  // Hàm để refresh thống kê từ bên ngoài
  const refreshUserStats = async () => {
    if (user?.id) {
      const stats = await calculateUserStats(user.id);
      setUser(prevUser => prevUser ? {
        ...prevUser,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        completedOrders: stats.completedOrders,
        totalReviews: stats.totalReviews,
        totalProductsToReview: stats.totalProductsToReview,
        pendingReviews: stats.pendingReviews,
      } : null);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'User', firebaseUser.uid);
  
        const unsubscribeUser = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            
            // Tính toán thống kê người dùng
            const stats = await calculateUserStats(firebaseUser.uid);
            
            setUser({
              id: firebaseUser.uid, 
              email: firebaseUser.email,
              fullName: userData.fullName || '',
              address: userData.address || '',
              phone: userData.phone || '',
              avatar: userData.avatar || '',
              role: userData.role || '',
              totalOrders: stats.totalOrders,
              totalSpent: stats.totalSpent,
              completedOrders: stats.completedOrders,
              totalReviews: stats.totalReviews,
              totalProductsToReview: stats.totalProductsToReview,
              pendingReviews: stats.pendingReviews,
              rating: userData.rating || null,
            });
          } else {
            setUser(null);
          }
        });

        // Lắng nghe thay đổi trong collection orders để cập nhật thống kê realtime
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where('userId', '==', firebaseUser.uid));
        
        const unsubscribeOrders = onSnapshot(ordersQuery, async () => {
          // Khi có thay đổi trong orders, tính lại thống kê
          const stats = await calculateUserStats(firebaseUser.uid);
          
          setUser(prevUser => prevUser ? {
            ...prevUser,
            totalOrders: stats.totalOrders,
            totalSpent: stats.totalSpent,
            completedOrders: stats.completedOrders,
            totalReviews: stats.totalReviews,
            totalProductsToReview: stats.totalProductsToReview,
            pendingReviews: stats.pendingReviews,
          } : null);
        });

        // Lắng nghe thay đổi trong collection reviews để cập nhật thống kê đánh giá
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(reviewsRef, where('userId', '==', firebaseUser.uid));
        
        const unsubscribeReviews = onSnapshot(reviewsQuery, async () => {
          // Khi có thay đổi trong reviews, tính lại thống kê
          const stats = await calculateUserStats(firebaseUser.uid);
          
          setUser(prevUser => prevUser ? {
            ...prevUser,
            totalReviews: stats.totalReviews,
            totalProductsToReview: stats.totalProductsToReview,
            pendingReviews: stats.pendingReviews,
          } : null);
        });

        return () => {
          unsubscribeUser();
          unsubscribeOrders();
          unsubscribeReviews();
        };
      } else {
        setUser(null);
      }
    });
  
    return () => unsubscribeAuth();
  }, []);
  

  return (
    <UserContext.Provider value={{ user, setUser, refreshUserStats }}>
      {children}
    </UserContext.Provider>
  );
};