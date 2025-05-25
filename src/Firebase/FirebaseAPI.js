import { collection,onSnapshot, where,query,getDocs, setDoc,doc,getDoc, deleteDoc, updateDoc, arrayUnion, writeBatch } from "firebase/firestore";
import { db,auth} from "./FirebaseConfig";
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail  } from "firebase/auth";
import { useContext, useId, useRef } from "react";
import { UserContext } from "./UserContext";

export const loadFurnitureHome  = (loadScreen) =>{
    const furnitureCollection = collection(db,'furnitures');
    const stopLoadFurniture  =  onSnapshot(
        furnitureCollection,
        (snapshot) =>{
        const furnitureList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        loadScreen(furnitureList);
    } , (error) =>{
        console.log("no firebase", error);
    }
)
    return stopLoadFurniture;
}
export const searchFurnitureName = async (name) =>{
    try{
        const furnitureCollection = collection(db,'furnitures');
        const q = query(furnitureCollection,where("furnitureName","==",name))
        const snapshot = await getDocs(q);
        const result = snapshot.docs.map(doc => ({
            id:doc.id,
            ...doc.data()
        }));
        return result;
    } catch(error){
        console.error("Error searching furniture by name:", error);
        return [];
    }
}
export const signInUser =  async ({email,password,fullName,phone,address}) =>{
    const emailTrim = email.trim();
    const fullNameTrim = fullName.trim();
    const checkEmail = (email)=>{
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    
    if(!checkEmail(email)){
        return{success:false,error: "Email không hợp lệ"};
    }

    if (!password || password.length < 6) {
        return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
      }
    try{
        const userGG = await createUserWithEmailAndPassword(auth,email,password);
        const user = userGG.user;

        await setDoc(doc(db,"User",user.uid),{
            fullName:fullNameTrim,
            phone: phone || "", 
            email:emailTrim,
            address,
            role:"user",
            createAt: new Date()

        });
        return {success:true, user};

    }
    catch(error){
        console.log("Registration error:", error.code, error.message);
        if(error.code === "auth/email-already-in-use" ){
            return{success:false, error:"Email này đã được đăng ký. Vui lòng dùng email khác!"}
        }

        return { success: false, error: "Đăng ký thất bại. Vui lòng thử lại!" };
    }
}
export const LogIn = async ({email,password})=>{
    
    try{
        const userGG = await signInWithEmailAndPassword (auth,email,password);
        const user = userGG.user;

        const userDoc = await getDoc(doc(db,"User",user.uid))
        if(userDoc.exists()){
            const userData = userDoc.data();
            const role = userData.role
            return { success: true , user: { id: user.uid, role, ...userData } };
        }
        else{
            return{success:false, error :"Tài khoản hoặc mật khẩu không tồn tại" };

        }


       
    }
    catch (error) {
    console.error("Login error: ", error.message);
    if (error.code === 'auth/wrong-password') {
        return { success: false, error: 'Sai mật khẩu, vui lòng thử lại!' };
      }
      
      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'Tài khoản không tồn tại!' };
      }
      return { success: false, error: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!' };
    }
  
}
export const LogOut  = async ()=>{
    // const { setUser } = useContext(UserContext);
    try{
        await auth.signOut();
        // setUser(null); 
        console.log("logoit");
        return{success:true};
    }
    catch(error){
        console.error("Logout error:", error.message);
        return{success:false,error: error.message}
    }
}
export const updateProfile = async (uid, updateDataUser) =>{
    try{
        const userReference = doc(db, "User", uid);
        await updateDoc(userReference,updateDataUser);
        
        return{success:true};
    }
    catch(error){
        console.error("Cập nhật thông tin người dùng thất bại:", error.message);
        return { success: false, error: "Không thể cập nhật thông tin. Vui lòng thử lại!" };
    }
}
export const removeFurniture  = async (furnitureId) => {
    if(!furnitureId){
        return{success:false , error:"Thiếu id sản phẩm"};
    }
    try{
        const furnitureReference = doc(db,"furnitures" , furnitureId);
        await deleteDoc(furnitureReference);
        return {success:true};
    }
    catch(error){
        console.error("Xóa sản phẩm thất bại:", error.message);
        return { success: false, error: "Không thể xóa sản phẩm. Vui lòng thử lại!" };
    }
}

export const addToCart = async (userId, { furnitureItem, soLuong, tongGia }) => {
    try {
        const userReference = doc(db, "User", userId);
        const userDoc = await getDoc(userReference);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const cart = userData.cart || [];
            let found = false;
            for (let i = 0; i < cart.length; i++) {
                const cartItem = cart[i];
                const id1 = cartItem.furnitureItem?.furnitureId;
                const id2 = furnitureItem?.furnitureId;
                if (id1 && id2 && id1 === id2) {
                    cart[i].soLuong += soLuong;
                    cart[i].tongGia += tongGia;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (furnitureItem) {
                    cart.push({ furnitureItem, soLuong, tongGia });
                }
            }
            await updateDoc(userReference, {
                cart
            });
            return { success: true, message: "Đã thêm vào giỏ hàng" };
        } else {
            return { success: false, message: "Chưa Đăng nhập" };
        }
    } catch (error) {
        console.error("Lỗi giỏ hàng", error);
        return { success: false, message: "Lỗi khi thêm sản phẩm vào giỏ hàng!" }
    }
}

export const loadCart = async (userId,setCart) =>{
    try{
        const userReference = doc(db,"User",userId)
        const unsubscribe  = onSnapshot(userReference,(userDoc)=>{
            if(userDoc.exists()){
                const userData = userDoc.data();
                const cart = userData.cart ||[];
                console.log('Cart loaded from Firestore:', cart); // Debug
                setCart(cart);
            }
            else{
                setCart([]);
            }
        });
        return unsubscribe;
        
    }
    catch(error){
        console.error("Lỗi khi load giỏ hàng", error);
        setCart([]);
        return { success: false, message: "Lỗi khi tải giỏ hàng!" };
    }
}
export const getUserById = async(userId) =>{
    try{
        const userDoc = await getDoc(doc(db,"User",userId));
        if((userDoc).exists){
            return{success:true,user:{id:userId,...userDoc.data()}}
        }
        else{
            return{success:false,error:"Lỗi load userID"};
            
        }
    }
    catch (error){
        console.log("Lỗi getUserById",error.message)
        return { success: false, error: "Lỗi khi lấy thông tin người dùng!" };
    }
} 

export const loadCart1 = async (userId, setCart) => {
    try {
      const userReference = doc(db, "User", userId);
      const unsubscribe = onSnapshot(userReference, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const cart = userData.cart || [];
          setCart(cart);
        } else {
          setCart([]);
        }
      });
  
      return unsubscribe;
    } catch (error) {
      console.error("Lỗi khi load giỏ hàng:", error);
      setCart([]);
      return { success: false, message: "Lỗi khi tải giỏ hàng!" };
    }
  };
  export const loadCartRealTime = (userId, setCart) => {
    try {
        const userDocRef = doc(db, "User", userId);
        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const cart = userData.cart || [];
                console.log("Giỏ hàng của người dùng (real-time):", cart);
                setCart(cart);
            } else {
                console.log("Không tìm thấy người dùng với ID:", userId);
                setCart([]);
            }
        });

        return unsubscribe;
    } catch (error) {
        console.error("Lỗi khi theo dõi giỏ hàng:", error.message);
        setCart([]);
    }
};
export const addOrder = async (userId, orderData) => {
    try {
        const userReference = doc(db, "User", userId);
        const userDoc = await getDoc(userReference);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const deliveryAddress = userData.address || " ";

            // Kiểm tra nếu không có địa chỉ
            if (!deliveryAddress || deliveryAddress.trim() === "") {
                return { success: false, message: "Vui lòng cập nhật địa chỉ trước khi đặt hàng!" };
            }

            const newOrder = {
                ...orderData,
                deliveryAddress,
                status: "Chờ xác nhận",
                createdAt: new Date(),
            };

            // Lưu đơn hàng vào collection "orders"
            const orderRef = doc(collection(db, "orders"));
            await setDoc(orderRef, newOrder);

            return { success: true, message: "Đơn hàng đã được thêm vào trạng thái Chờ xác nhận" };
        } else {
            return { success: false, message: "Người dùng không tồn tại" };
        }
    } catch (error) {
        console.error("Lỗi khi thêm đơn hàng:", error.message);
        return { success: false, message: "Lỗi khi thêm đơn hàng!" };
    }
};
export const checkoutOrders = async (userId, ordersToCheckout) => {
    try {
        const userReference = doc(db, "User", userId);
        const userDoc = await getDoc(userReference);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const deliveryAddress = userData.address || " ";
            if (!deliveryAddress || deliveryAddress.trim() === "") {
                return { success: false, message: "Vui lòng cập nhật địa chỉ trước khi thanh toán!" };
            }

            // Tạo một đơn hàng mới với tất cả các món
            const newOrder = {
                items: ordersToCheckout[0].items.map(item => ({
                    furnitureItem: {
                        furnitureName: item.furnitureItem.furnitureName,
                        ...item.furnitureItem
                    },
                    soLuong: item.soLuong,
                    tongGia: item.tongGia
                })),
                deliveryAddress,
                status: "Chờ giao hàng",
                createdAt: new Date(),
                updatedAt: new Date(),
                userId,
                totalAmount: ordersToCheckout[0].totalAmount
            };

            // Lưu đơn hàng vào collection "orders"
            const orderRef = doc(collection(db, "orders"));
            await setDoc(orderRef, newOrder);

            // Xóa giỏ hàng của người dùng
            await updateDoc(userReference, {
                cart: [], // Đặt giỏ hàng thành rỗng
            });

            return { success: true, message: "Thanh toán thành công và chuyển sang trạng thái Chờ giao hàng!" };
        } else {
            return { success: false, message: "Người dùng không tồn tại" };
        }
    } catch (error) {
        console.error("Lỗi khi thanh toán:", error.message);
        return { success: false, message: "Đã xảy ra lỗi khi thanh toán!" };
    }
};
export const resetPasswordEmail = async (email) => {
    const auth = getAuth();
    try{
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Email đặt lại mật khẩu đã được gửi!" };
    }
    catch(error){
        console.error("Lỗi khi gửi email đặt lại mật khẩu:", error.message);
        return { success: false, error: "Lỗi khi gửi email đặt lại mật khẩu!" };
    }
}
export const getOverviewStats = async () => {
  try {
    // Lấy thống kê đơn hàng
    const ordersQuery = query(collection(db, "orders"));
    const ordersSnapshot = await getDocs(ordersQuery);
    
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let readyOrders = 0;
    let deliveringOrders = 0;
    let completedOrders = 0;
    
    // Khởi tạo mảng thống kê theo ngày
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dailyStats = Array(31).fill(0); // Mảng lưu số đơn hàng mỗi ngày
    const dailyRevenue = Array(31).fill(0); // Mảng lưu doanh thu mỗi ngày
    
    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data();
      // Bỏ qua đơn đã hủy
      if (orderData.status === 'Đã hủy') return;
      totalOrders++;
      totalRevenue += orderData.totalAmount || 0;
      
      // Thống kê theo trạng thái
      switch (orderData.status) {
        case "Chờ xác nhận":
          pendingOrders++;
          break;
        case "Chờ giao hàng":
          readyOrders++;
          break;
        case "Đang giao":
          deliveringOrders++;
          break;
        case "Đã đặt":
          completedOrders++;
          break;
      }
      
      // Thống kê theo ngày
      const orderDate = orderData.createdAt?.toDate();
      if (orderDate && orderDate >= firstDayOfMonth && orderDate <= today) {
        const dayIndex = orderDate.getDate() - 1;
        dailyStats[dayIndex]++;
        dailyRevenue[dayIndex] += orderData.totalAmount || 0;
      }
    });

    // Lấy tổng số người dùng
    const usersSnapshot = await getDocs(collection(db, "User"));
    const totalUsers = usersSnapshot.size;

    // Lấy tổng số sản phẩm nội thất
    const furnituresSnapshot = await getDocs(collection(db, "furnitures"));
    const totalFurnitures = furnituresSnapshot.size;

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalFurnitures,
        pendingOrders,
        readyOrders,
        deliveringOrders,
        completedOrders,
        dailyStats: dailyStats.slice(0, today.getDate()), // Chỉ lấy đến ngày hiện tại
        dailyRevenue: dailyRevenue.slice(0, today.getDate()), // Chỉ lấy đến ngày hiện tại
      },
    };
  } catch (error) {
    console.error("Error getting overview stats:", error);
    return { success: false, error: error.message };
  }
};
export const getAnalyticsData = async (timeframe) => {
  try {
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const now = new Date();
    let filteredOrders = [];

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = new Date(data.createdAt);

      // Lọc theo khoảng thời gian
      if (timeframe === "day" && createdAt.toDateString() === now.toDateString()) {
        filteredOrders.push(data);
      } else if (timeframe === "week" && now - createdAt <= 7 * 24 * 60 * 60 * 1000) {
        filteredOrders.push(data);
      } else if (timeframe === "month" && now.getMonth() === createdAt.getMonth()) {
        filteredOrders.push(data);
      }
    });

    // Tính tổng doanh thu
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    return {
      success: true,
      data: {
        totalRevenue,
        ordersCount: filteredOrders.length,
      },
    };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu phân tích:", error.message);
    return { success: false, error: error.message };
  }
};
export const loadOrdersRealTime = (userId, setOrders) => {
    try {
        let ordersQuery = collection(db, "orders");
        if (userId) {
            ordersQuery = query(ordersQuery, where("userId", "==", userId));
        }
        
        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setOrders(ordersData);
        });

        return unsubscribe;
    } catch (error) {
        console.error("Lỗi khi tải đơn hàng theo thời gian thực:", error.message);
        setOrders([]);
    }
};
export const updateFurnitureStoreInfo = async (furnitureStoreId, furnitureStoreData) => {
    if (!furnitureStoreId) {
        return { success: false, error: 'Không tìm thấy ID cửa hàng!' };
    }
    try {
        const furnitureStoreRef = doc(db, 'furnitureStores', furnitureStoreId);
        await setDoc(furnitureStoreRef, furnitureStoreData, { merge: true });
        return { success: true, message: 'Thông tin cửa hàng đã được lưu thành công!' };
    } catch (error) {
        console.error('Lỗi khi lưu thông tin cửa hàng:', error.message);
        return { success: false, error: 'Không thể lưu thông tin cửa hàng. Vui lòng thử lại!' };
    }
};
export const fetchFurnitureStoreInfo = async (userId) => {
    try {
        const furnitureStoreRef = doc(db, 'furnitureStores', userId);
        const furnitureStoreSnap = await getDoc(furnitureStoreRef);
        if (furnitureStoreSnap.exists()) {
            const furnitureStoreData = furnitureStoreSnap.data();
            return { success: true, data: furnitureStoreData };
        } else {
            return { success: false, error: 'Không tìm thấy thông tin cửa hàng!' };
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra cửa hàng:', error.message);
        return { success: false, error: 'Không thể kiểm tra thông tin cửa hàng. Vui lòng thử lại!' };
    }
};
export const updateOrderStatus = async (orderId, newStatus) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            return { success: false, message: "Không tìm thấy đơn hàng!" };
        }

        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: new Date()
        });

        return { success: true, message: "Cập nhật trạng thái đơn hàng thành công!" };
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        return { success: false, message: "Lỗi khi cập nhật trạng thái đơn hàng!" };
    }
};
export const searchFurnitures = async (searchText) => {
  try {
    const furnituresRef = collection(db, "furnitures");
    const q = query(
      furnituresRef,
      where("furnitureName", ">=", searchText),
      where("furnitureName", "<=", searchText + "\uf8ff")
    );
    const querySnapshot = await getDocs(q);
    const furnitures = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: furnitures };
  } catch (error) {
    console.error("Error searching furnitures:", error);
    return { success: false, error: error.message };
  }
};
export const cancelOrder = async (orderId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            return { success: false, message: "Không tìm thấy đơn hàng!" };
        }

        const orderData = orderDoc.data();
        
        // Chỉ cho phép hủy đơn hàng trong trạng thái "Chờ giao hàng"
        if (orderData.status !== "Chờ giao hàng") {
            return { success: false, message: "Chỉ có thể hủy đơn hàng trong trạng thái Chờ giao hàng!" };
        }

        await updateDoc(orderRef, {
            status: "Đã hủy",
            updatedAt: new Date()
        });

        return { success: true, message: "Hủy đơn hàng thành công!" };
    } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        return { success: false, message: "Lỗi khi hủy đơn hàng!" };
    }
};
export const removeFavoritesFurniture = async (userId, furnitureId) => {
    try {
        const userRef = doc(db, "User", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const favorites = userData.favorites || [];
            const newFavorites = favorites.filter(item => item !== furnitureId);
            await updateDoc(userRef, { favorites: newFavorites });
            return { success: true, message: "Đã xóa khỏi danh sách yêu thích" };
        } else {
            return { success: false, message: "Không tìm thấy người dùng" };
        }
    } catch (error) {
        console.error("Lỗi khi xóa khỏi danh sách yêu thích:", error);
        return { success: false, message: "Lỗi khi xóa khỏi danh sách yêu thích!" };
    }
}
export const addToFavoritesFurniture = async (userId, furnitureId) => {
    try {
        const userRef = doc(db, "User", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const favorites = userData.favorites || [];
            if (!favorites.includes(furnitureId)) {
                favorites.push(furnitureId);
                await updateDoc(userRef, { favorites });
            }
            return { success: true, message: "Đã thêm vào danh sách yêu thích" };
        } else {
            return { success: false, message: "Không tìm thấy người dùng" };
        }
    } catch (error) {
        console.error("Lỗi khi thêm vào danh sách yêu thích:", error);
        return { success: false, message: "Lỗi khi thêm vào danh sách yêu thích!" };
    }
}