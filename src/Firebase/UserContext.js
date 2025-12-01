import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState, createContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './FirebaseConfig';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Hàm tính toán thống kê người dùng
  const calculateUserStats = async (userId, userRole) => {
    try {
      // Admin không cần stats, skip để tăng tốc độ load
      if (userRole === 'admin') {
        return { 
          totalOrders: 0, 
          totalSpent: 0, 
          completedOrders: 0,
          totalReviews: 0,
          totalProductsToReview: 0,
          pendingReviews: 0
        };
      }
      
      const ordersRef = collection(db, 'orders');
      let ordersQuery;
      
      // Shipper thống kê tất cả đơn hàng, user thường chỉ thống kê đơn của mình
      if (userRole === 'shipper') {
        ordersQuery = ordersRef; // Lấy tất cả đơn hàng
      } else {
        ordersQuery = query(ordersRef, where('userId', '==', userId));
      }
      
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

      // Chỉ tính reviews cho user thường, shipper không cần
      let totalReviews = 0;
      let pendingReviews = 0;
      
      if (userRole !== 'shipper') {
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

        totalReviews = reviewedProductIds.size;
        pendingReviews = Math.max(0, totalProductsToReview - totalReviews);
      }
      
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
      const stats = await calculateUserStats(user.id, user.role);
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
            const userRole = userData.role || '';
            
            // Tính toán thống kê người dùng
            const stats = await calculateUserStats(firebaseUser.uid, userRole);
            
            setUser({
              id: firebaseUser.uid, 
              email: firebaseUser.email,
              fullName: userData.fullName || '',
              address: userData.address || '',
              phone: userData.phone || '',
              avatar: userData.avatar || '',
              role: userRole,
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
        // Admin không cần listener để tăng hiệu năng
        let unsubscribeOrders = () => {};
        let unsubscribeReviews = () => {};
        
        // Lấy userRole từ snapshot ban đầu
        const userSnapshot = await getDoc(userRef);
        const userRole = userSnapshot.exists() ? userSnapshot.data().role : '';
        
        if (userRole !== 'admin') {
          const ordersRef = collection(db, 'orders');
          let ordersQueryListener;
          
          // Shipper lắng nghe tất cả đơn hàng, user thường chỉ lắng nghe đơn của mình
          if (userRole === 'shipper') {
            ordersQueryListener = ordersRef;
          } else {
            ordersQueryListener = query(ordersRef, where('userId', '==', firebaseUser.uid));
          }
          
          unsubscribeOrders = onSnapshot(ordersQueryListener, async () => {
            // Khi có thay đổi trong orders, tính lại thống kê
            const stats = await calculateUserStats(firebaseUser.uid, userRole);
            
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
          // Chỉ áp dụng cho user thường, không áp dụng cho shipper
          if (userRole !== 'shipper') {
            const reviewsRef = collection(db, 'reviews');
            const reviewsQuery = query(reviewsRef, where('userId', '==', firebaseUser.uid));
            
            unsubscribeReviews = onSnapshot(reviewsQuery, async () => {
              // Khi có thay đổi trong reviews, tính lại thống kê
              const stats = await calculateUserStats(firebaseUser.uid, userRole);
              
              setUser(prevUser => prevUser ? {
                ...prevUser,
                totalReviews: stats.totalReviews,
                totalProductsToReview: stats.totalProductsToReview,
                pendingReviews: stats.pendingReviews,
              } : null);
            });
          }
        }

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