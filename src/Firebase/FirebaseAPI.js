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
        console.log('Attempting login with email:', email); // Debug log
        
        // Đảm bảo email được trim để tránh khoảng trắng
        const cleanEmail = email.trim().toLowerCase();
        
        const userGG = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userGG.user;
        
        console.log('Firebase auth successful, user UID:', user.uid); // Debug log

        // Lấy user document từ Firestore
        const userDoc = await getDoc(doc(db,"User",user.uid));
        if(userDoc.exists()){
            const userData = userDoc.data();
            const role = userData.role;
            
            console.log('User data retrieved, role:', role); // Debug log
            
            // Đảm bảo role được trả về chính xác
            if (!role) {
                console.log('Warning: No role found for user, defaulting to "user"');
                return { success: true , user: { id: user.uid, role: "user", ...userData } };
            }
            
            // Đăng nhập thành công, trả về thông tin user
            return { success: true , user: { id: user.uid, role, ...userData } };
        }
        else{
            console.log('User document not found in Firestore'); // Debug log
            // Logout ngay lập tức nếu không tìm thấy user document
            await auth.signOut();
            return{success:false, error :"Tài khoản hoặc mật khẩu không tồn tại" };
        }
    }
    catch (error) {
        console.error("Login error: ", error.code, error.message);
        
        // Đảm bảo user bị logout nếu có lỗi
        try {
            await auth.signOut();
        } catch (signOutError) {
            console.error("Error signing out:", signOutError);
        }
        
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Sai mật khẩu, vui lòng thử lại!' };
        }
        
        if (error.code === 'auth/user-not-found') {
            return { success: false, error: 'Tài khoản không tồn tại!' };
        }
        
        if (error.code === 'auth/invalid-email') {
            return { success: false, error: 'Email không hợp lệ!' };
        }
        
        if (error.code === 'auth/invalid-credential') {
            return { success: false, error: 'Tài khoản hoặc mật khẩu không đúng!' };
        }
        
        if (error.code === 'auth/too-many-requests') {
            return { success: false, error: 'Quá nhiều lần thử. Vui lòng đợi và thử lại sau!' };
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

export const updateFurnitureDiscount = async (furnitureId, discountPercentage) => {
    if (!furnitureId) {
        return { success: false, error: "Thiếu id sản phẩm" };
    }
    
    const discount = parseFloat(discountPercentage) || 0;
    if (discount < 0 || discount > 100) {
        return { success: false, error: "Phần trăm giảm giá phải từ 0 đến 100" };
    }
    
    try {
        const furnitureReference = doc(db, "furnitures", furnitureId);
        const updateData = {};
        
        if (discount > 0) {
            updateData.discountPercentage = discount;
        } else {
            // Nếu discount = 0, xóa field discountPercentage
            updateData.discountPercentage = null;
        }
        
        await updateDoc(furnitureReference, updateData);
        return { success: true, message: "Đã cập nhật giảm giá sản phẩm" };
    } catch (error) {
        console.error("Cập nhật giảm giá thất bại:", error.message);
        return { success: false, error: "Không thể cập nhật giảm giá. Vui lòng thử lại!" };
    }
};

export const updateFurnitureQuantity = async (furnitureId, newQuantity) => {
    if (!furnitureId) {
        return { success: false, error: "Thiếu id sản phẩm" };
    }
    if (newQuantity < 0) {
        return { success: false, error: "Số lượng không thể âm" };
    }
    try {
        const furnitureReference = doc(db, "furnitures", furnitureId);
        await updateDoc(furnitureReference, {
            quantity: newQuantity
        });
        return { success: true, message: "Đã cập nhật số lượng tồn kho" };
    } catch (error) {
        console.error("Cập nhật số lượng thất bại:", error.message);
        return { success: false, error: "Không thể cập nhật số lượng. Vui lòng thử lại!" };
    }
}

// Helper function để tăng số lượng tồn kho cho các sản phẩm trong đơn hàng
const restoreInventoryFromOrder = async (orderItems, batch) => {
    const restoredItems = [];
    for (const item of orderItems) {
        if (item.furnitureItem && item.furnitureItem.furnitureId && item.soLuong) {
            const furnitureRef = doc(db, "furnitures", item.furnitureItem.furnitureId);
            const furnitureDoc = await getDoc(furnitureRef);
            
            if (furnitureDoc.exists()) {
                const furnitureData = furnitureDoc.data();
                const currentStock = furnitureData.quantity || 0;
                
                // Tăng số lượng tồn kho
                batch.update(furnitureRef, {
                    quantity: currentStock + item.soLuong
                });
                
                restoredItems.push({
                    furnitureName: item.furnitureItem.furnitureName,
                    quantity: item.soLuong,
                    newStock: currentStock + item.soLuong
                });
            }
        }
    }
    return restoredItems;
};

// Hàm tính giá sau khi giảm
export const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
    if (!discountPercentage || discountPercentage <= 0) {
        return originalPrice;
    }
    return originalPrice * (1 - discountPercentage / 100);
};

export const addToCart = async (userId, { furnitureItem, soLuong, tongGia }) => {
    try {
        // Kiểm tra số lượng tồn kho
        const furnitureRef = doc(db, "furnitures", furnitureItem.furnitureId);
        const furnitureDoc = await getDoc(furnitureRef);
        
        if (!furnitureDoc.exists()) {
            return { success: false, message: "Sản phẩm không tồn tại!" };
        }
        
        const furnitureData = furnitureDoc.data();
        const currentStock = furnitureData.quantity || 0;
        
        if (currentStock < soLuong) {
            return { success: false, message: `Chỉ còn ${currentStock} sản phẩm trong kho!` };
        }
        
        const userReference = doc(db, "User", userId);
        const userDoc = await getDoc(userReference);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const cart = userData.cart || [];
            let found = false;
            
            // Tính giá cuối cùng (đã giảm nếu có)
            const finalPrice = calculateDiscountedPrice(furnitureItem.furniturePrice, furnitureItem.discountPercentage);
            
            for (let i = 0; i < cart.length; i++) {
                const cartItem = cart[i];
                const id1 = cartItem.furnitureItem?.furnitureId;
                const id2 = furnitureItem?.furnitureId;
                if (id1 && id2 && id1 === id2) {
                    const newQuantity = cart[i].soLuong + soLuong;
                    if (newQuantity > currentStock) {
                        return { success: false, message: `Chỉ còn ${currentStock} sản phẩm trong kho!` };
                    }
                    cart[i].soLuong = newQuantity;
                    cart[i].tongGia = newQuantity * finalPrice;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (furnitureItem) {
                    // Thêm sản phẩm mới vào ĐẦU array để hiển thị mới nhất trên cùng
                    cart.unshift({ 
                        furnitureItem, 
                        soLuong, 
                        tongGia: soLuong * finalPrice,
                        addedAt: new Date().getTime() // Thêm timestamp để sắp xếp
                    });
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

            // Kiểm tra tồn kho trước khi thanh toán
            const batch = writeBatch(db);
            
            for (const item of ordersToCheckout[0].items) {
                const furnitureRef = doc(db, "furnitures", item.furnitureItem.furnitureId);
                const furnitureDoc = await getDoc(furnitureRef);
                
                if (!furnitureDoc.exists()) {
                    return { success: false, message: `Sản phẩm ${item.furnitureItem.furnitureName} không tồn tại!` };
                }
                
                const furnitureData = furnitureDoc.data();
                const currentStock = furnitureData.quantity || 0;
                
                if (currentStock < item.soLuong) {
                    return { success: false, message: `Sản phẩm ${item.furnitureItem.furnitureName} chỉ còn ${currentStock} trong kho!` };
                }
                
                // Giảm số lượng tồn kho
                batch.update(furnitureRef, {
                    quantity: currentStock - item.soLuong
                });
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
                status: ordersToCheckout[0].status || "Chờ giao hàng",
                createdAt: ordersToCheckout[0].createdAt || new Date(),
                updatedAt: new Date(),
                userId,
                totalAmount: ordersToCheckout[0].totalAmount,
                // Thêm thông tin thanh toán
                paymentMethod: ordersToCheckout[0].paymentMethod || 'cod',
                paymentStatus: ordersToCheckout[0].paymentStatus || 'pending'
            };

            // Lưu đơn hàng vào collection "orders"
            const orderRef = doc(collection(db, "orders"));
            batch.set(orderRef, newOrder);

            // Log thông tin đơn hàng để debug
            console.log("=== CHECKOUT ORDER ===");
            console.log("Payment Method:", newOrder.paymentMethod);
            console.log("Payment Status:", newOrder.paymentStatus);
            console.log("Total Amount:", newOrder.totalAmount);
            console.log("Order Status:", newOrder.status);
            console.log("======================");

            // Xóa giỏ hàng của người dùng
            batch.update(userReference, {
                cart: [], // Đặt giỏ hàng thành rỗng
            });

            // Thực hiện tất cả các thay đổi
            await batch.commit();

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
    
    // Thống kê thanh toán
    let codOrders = 0;
    let qrOrders = 0;
    let ewalletOrders = 0;
    let onlineOrders = 0;
    let paidOrders = 0;
    let unpaidOrders = 0;
    
    // Khởi tạo mảng thống kê theo ngày
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dailyStats = Array(31).fill(0); // Mảng lưu số đơn hàng mỗi ngày
    const dailyRevenue = Array(31).fill(0); // Mảng lưu doanh thu mỗi ngày
    
    // Khởi tạo mảng thống kê theo tháng
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const monthlyStats = Array(12).fill(0); // Mảng lưu số đơn hàng mỗi tháng
    const monthlyRevenue = Array(12).fill(0); // Mảng lưu doanh thu mỗi tháng
    
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
      
      // Thống kê thanh toán
      if (orderData.paymentMethod === 'cod') {
        codOrders++;
      } else if (orderData.paymentMethod === 'qr') {
        qrOrders++;
        onlineOrders++;
      } else if (orderData.paymentMethod === 'ewallet') {
        ewalletOrders++;
        onlineOrders++;
      }
      
      if (orderData.paymentStatus === 'completed') {
        paidOrders++;
      } else if (orderData.paymentStatus === 'pending') {
        unpaidOrders++;
      }
      
      const orderDate = orderData.createdAt?.toDate();
      
      // Thống kê theo ngày
      if (orderDate && orderDate >= firstDayOfMonth && orderDate <= today) {
        const dayIndex = orderDate.getDate() - 1;
        dailyStats[dayIndex]++;
        dailyRevenue[dayIndex] += orderData.totalAmount || 0;
      }
      
      // Thống kê theo tháng
      if (orderDate && orderDate.getFullYear() === today.getFullYear()) {
        const monthIndex = orderDate.getMonth();
        monthlyStats[monthIndex]++;
        monthlyRevenue[monthIndex] += orderData.totalAmount || 0;
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
        // Payment statistics
        codOrders,
        qrOrders,
        ewalletOrders,
        onlineOrders,
        paidOrders,
        unpaidOrders,
        dailyStats: dailyStats.slice(0, today.getDate()), // Chỉ lấy đến ngày hiện tại
        dailyRevenue: dailyRevenue.slice(0, today.getDate()), // Chỉ lấy đến ngày hiện tại
        monthlyStats: monthlyStats.slice(0, today.getMonth() + 1), // Chỉ lấy đến tháng hiện tại
        monthlyRevenue: monthlyRevenue.slice(0, today.getMonth() + 1), // Chỉ lấy đến tháng hiện tại
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

        const orderData = orderDoc.data();
        const batch = writeBatch(db);

        // Cập nhật trạng thái đơn hàng
        batch.update(orderRef, {
            status: newStatus,
            updatedAt: new Date()
        });

        // Nếu trạng thái mới là "Đã hủy" và trạng thái cũ không phải "Đã hủy"
        // thì cần tăng số lượng tồn kho trở lại
        let restoredItems = [];
        if (newStatus === "Đã hủy" && orderData.status !== "Đã hủy") {
            if (orderData.items && Array.isArray(orderData.items)) {
                restoredItems = await restoreInventoryFromOrder(orderData.items, batch);
            }
        }

        // Thực hiện tất cả các thay đổi
        await batch.commit();

        let message = "Cập nhật trạng thái đơn hàng thành công!";
        if (newStatus === "Đã hủy" && orderData.status !== "Đã hủy") {
            const restoredCount = restoredItems.length;
            message = restoredCount > 0 
                ? `Cập nhật trạng thái đơn hàng thành công! Đã hoàn trả ${restoredCount} sản phẩm vào kho.`
                : "Cập nhật trạng thái đơn hàng thành công!";
        }

        return { success: true, message };
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        return { success: false, message: "Lỗi khi cập nhật trạng thái đơn hàng!" };
    }
};
export const searchFurnitures = async (searchText) => {
  try {
    const furnituresRef = collection(db, "furnitures");
    const querySnapshot = await getDocs(furnituresRef);
    
    // Chuyển search text về lowercase để tìm kiếm không phân biệt hoa thường
    const searchLower = searchText.toLowerCase().trim();
    
    // Filter kết quả phía client để tìm kiếm linh hoạt hơn
    const furnitures = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(furniture => {
        const nameLower = (furniture.furnitureName || '').toLowerCase();
        const descLower = (furniture.description || '').toLowerCase();
        const tagsLower = Array.isArray(furniture.tag) 
          ? furniture.tag.map(t => t.toLowerCase()).join(' ')
          : '';
        
        // Tìm trong tên, mô tả và tags
        return nameLower.includes(searchLower) || 
               descLower.includes(searchLower) ||
               tagsLower.includes(searchLower);
      });
    
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

        // Tăng số lượng tồn kho trở lại khi hủy đơn hàng
        const batch = writeBatch(db);
        
        // Cập nhật trạng thái đơn hàng
        batch.update(orderRef, {
            status: "Đã hủy",
            updatedAt: new Date()
        });

        // Tăng số lượng tồn kho cho từng sản phẩm trong đơn hàng
        let restoredItems = [];
        if (orderData.items && Array.isArray(orderData.items)) {
            restoredItems = await restoreInventoryFromOrder(orderData.items, batch);
        }

        // Thực hiện tất cả các thay đổi
        await batch.commit();

        const restoredCount = restoredItems.length;
        const message = restoredCount > 0 
            ? `Hủy đơn hàng thành công! Đã hoàn trả ${restoredCount} sản phẩm vào kho.`
            : "Hủy đơn hàng thành công!";

        return { success: true, message };
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

// Update quantity of an item in cart
export const updateCartQuantity = async (userId, furnitureId, newQuantity) => {
    try {
        if (!userId || !furnitureId) {
            return { success: false, message: "Thiếu thông tin người dùng hoặc sản phẩm" };
        }

        if (newQuantity < 1) {
            return { success: false, message: "Số lượng phải lớn hơn 0" };
        }

        // Kiểm tra tồn kho
        const furnitureRef = doc(db, "furnitures", furnitureId);
        const furnitureDoc = await getDoc(furnitureRef);
        
        if (!furnitureDoc.exists()) {
            return { success: false, message: "Sản phẩm không tồn tại!" };
        }
        
        const furnitureData = furnitureDoc.data();
        const currentStock = furnitureData.quantity || 0;
        
        if (currentStock < newQuantity) {
            return { success: false, message: `Chỉ còn ${currentStock} sản phẩm trong kho!` };
        }

        const userRef = doc(db, "User", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const cart = userData.cart || [];

            // Tìm sản phẩm trong giỏ hàng
            const itemIndex = cart.findIndex(item => 
                item.furnitureItem?.furnitureId === furnitureId
            );

            if (itemIndex === -1) {
                return { success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng" };
            }

            // Tính giá cuối cùng (đã giảm nếu có)
            const finalPrice = calculateDiscountedPrice(
                cart[itemIndex].furnitureItem.furniturePrice,
                cart[itemIndex].furnitureItem.discountPercentage
            );

            // Cập nhật số lượng và tổng giá
            cart[itemIndex].soLuong = newQuantity;
            cart[itemIndex].tongGia = newQuantity * finalPrice;

            await updateDoc(userRef, { cart });
            return { success: true, message: "Đã cập nhật số lượng" };
        } else {
            return { success: false, message: "Không tìm thấy người dùng" };
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật số lượng giỏ hàng:", error);
        return { success: false, message: "Lỗi khi cập nhật số lượng!" };
    }
}

// Remove an item from cart
export const removeFromCart = async (userId, furnitureId) => {
    try {
        if (!userId || !furnitureId) {
            return { success: false, message: "Thiếu thông tin người dùng hoặc sản phẩm" };
        }

        const userRef = doc(db, "User", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const cart = userData.cart || [];

            // Lọc bỏ sản phẩm cần xóa
            const updatedCart = cart.filter(item => 
                item.furnitureItem?.furnitureId !== furnitureId
            );

            if (updatedCart.length === cart.length) {
                return { success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng" };
            }

            await updateDoc(userRef, { cart: updatedCart });
            return { success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng" };
        } else {
            return { success: false, message: "Không tìm thấy người dùng" };
        }
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
        return { success: false, message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng!" };
    }
}

// Function to get review statistics for a furniture item
export const getReviewStats = async (furnitureId) => {
    try {
        if (!furnitureId) {
            return { success: false, error: "Thiếu ID sản phẩm" };
        }

        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('furnitureId', '==', furnitureId));
        const querySnapshot = await getDocs(q);

        const reviews = [];
        const ratings = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        let totalRating = 0;

        querySnapshot.forEach((doc) => {
            const reviewData = { id: doc.id, ...doc.data() };
            reviews.push(reviewData);
            
            const rating = reviewData.rating;
            if (rating >= 1 && rating <= 5) {
                ratings[rating.toString()]++;
                totalRating += rating;
            }
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        return {
            success: true,
            data: {
                reviews,
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân
                ratings,
                distribution: {
                    5: ratings['5'],
                    4: ratings['4'],
                    3: ratings['3'],
                    2: ratings['2'],
                    1: ratings['1']
                }
            }
        };
    } catch (error) {
        console.error("Lỗi khi lấy thống kê review:", error);
        return { success: false, error: error.message };
    }
}

// Function to get similar products based on tags and price range
export const getSimilarProducts = async (currentProduct) => {
    try {
        if (!currentProduct || !currentProduct.id) {
            return { success: false, error: "Thiếu thông tin sản phẩm" };
        }

        const furnituresRef = collection(db, 'furnitures');
        const querySnapshot = await getDocs(furnituresRef);

        const allProducts = [];
        querySnapshot.forEach((doc) => {
            const productData = { id: doc.id, ...doc.data() };
            // Loại bỏ sản phẩm hiện tại
            if (productData.id !== currentProduct.id) {
                allProducts.push(productData);
            }
        });

        // Tính điểm tương đồng cho mỗi sản phẩm
        const currentTags = currentProduct.tag || [];
        const currentPrice = currentProduct.furniturePrice || 0;
        const priceRange = currentPrice * 0.4; // 40% khoảng giá để linh hoạt hơn

        const productsWithScore = allProducts.map(product => {
            let score = 0;
            const productTags = product.tag || [];
            
            // Điểm dựa trên tags chung (mỗi tag chung +20 điểm - tăng trọng số)
            const commonTags = productTags.filter(tag => currentTags.includes(tag));
            score += commonTags.length * 20;

            // Điểm dựa trên khoảng giá gần nhau (trong vòng 40% giá thì +10 điểm)
            const productPrice = product.furniturePrice || 0;
            const priceDiff = Math.abs(productPrice - currentPrice);
            if (priceDiff <= priceRange) {
                // Càng gần giá càng nhiều điểm
                const priceScore = 10 * (1 - priceDiff / priceRange);
                score += priceScore;
            }

            // Ưu tiên sản phẩm còn hàng (+5 điểm)
            if (product.quantity > 0) {
                score += 5;
            }

            // Ưu tiên sản phẩm có giảm giá (+3 điểm)
            if (product.discountPercentage > 0) {
                score += 3;
            }

            return { ...product, similarityScore: score };
        });

        // Sắp xếp theo điểm tương đồng và lấy top 6
        const similarProducts = productsWithScore
            .filter(p => p.similarityScore > 0) // Chỉ lấy sản phẩm có điểm > 0
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, 6);

        return {
            success: true,
            data: similarProducts
        };
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm tương tự:", error);
        return { success: false, error: error.message };
    }
}

// Get Best Selling Products based on actual order data
export const getBestSellingProducts = async () => {
    try {
        // Lấy tất cả đơn hàng đã hoàn thành
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where('status', 'in', ['Đã đặt', 'Đang giao', 'Chờ giao hàng']));
        const ordersSnapshot = await getDocs(ordersQuery);

        // Đếm số lượng bán của mỗi sản phẩm
        const productSales = {};
        
        ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            if (orderData.items && Array.isArray(orderData.items)) {
                orderData.items.forEach(item => {
                    const furnitureId = item.furnitureItem?.furnitureId || item.furnitureItem?.id;
                    const quantity = item.soLuong || 0;
                    
                    if (furnitureId) {
                        if (!productSales[furnitureId]) {
                            productSales[furnitureId] = {
                                id: furnitureId,
                                totalSold: 0,
                                productInfo: item.furnitureItem
                            };
                        }
                        productSales[furnitureId].totalSold += quantity;
                    }
                });
            }
        });

        // Lấy thông tin đầy đủ của các sản phẩm
        const furnituresRef = collection(db, 'furnitures');
        const furnituresSnapshot = await getDocs(furnituresRef);
        
        const furnituresMap = {};
        furnituresSnapshot.forEach((doc) => {
            furnituresMap[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Tạo danh sách sản phẩm bán chạy với thông tin đầy đủ
        const bestSellingList = Object.values(productSales)
            .map(item => {
                const fullProduct = furnituresMap[item.id];
                return {
                    id: item.id,
                    name: fullProduct?.furnitureName || item.productInfo?.furnitureName || 'Sản phẩm',
                    image: fullProduct?.image || fullProduct?.furnitureImage || item.productInfo?.image || item.productInfo?.furnitureImage,
                    totalSold: item.totalSold,
                    price: fullProduct?.furniturePrice || item.productInfo?.furniturePrice,
                    discountPercentage: fullProduct?.discountPercentage || 0
                };
            })
            .filter(item => item.image) // Chỉ lấy sản phẩm có ảnh
            .sort((a, b) => b.totalSold - a.totalSold) // Sắp xếp theo số lượng bán giảm dần
            .slice(0, 5); // Lấy top 5

        return {
            success: true,
            data: bestSellingList
        };
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
        return { success: false, error: error.message };
    }
};

// Get Product Statistics - Thống kê chi tiết từng sản phẩm
export const getProductStatistics = async () => {
    try {
        // Lấy tất cả sản phẩm
        const furnituresRef = collection(db, 'furnitures');
        const furnituresSnapshot = await getDocs(furnituresRef);
        
        const furnituresMap = {};
        furnituresSnapshot.forEach((doc) => {
            const data = doc.data();
            furnituresMap[doc.id] = {
                id: doc.id,
                name: data.furnitureName,
                price: data.furniturePrice,
                image: data.image || data.furnitureImage,
                currentStock: data.quantity || 0,
                discountPercentage: data.discountPercentage || 0,
                totalSold: 0,
                totalRevenue: 0,
                monthlySales: Array(12).fill(0), // Số lượng bán theo tháng
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
            };
        });

        // Lấy tất cả đơn hàng (không bao gồm đơn hủy)
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        
        const today = new Date();
        const currentYear = today.getFullYear();
        
        ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            
            // Bỏ qua đơn đã hủy
            if (orderData.status === 'Đã hủy') return;
            
            const orderDate = orderData.createdAt?.toDate();
            
            if (orderData.items && Array.isArray(orderData.items)) {
                orderData.items.forEach(item => {
                    const furnitureId = item.furnitureItem?.furnitureId || item.furnitureItem?.id;
                    const quantity = item.soLuong || 0;
                    const itemPrice = item.tongGia || 0;
                    
                    if (furnitureId && furnituresMap[furnitureId]) {
                        // Cộng dồn số lượng bán và doanh thu
                        furnituresMap[furnitureId].totalSold += quantity;
                        furnituresMap[furnitureId].totalRevenue += itemPrice;
                        
                        // Thống kê theo tháng (chỉ tính năm hiện tại)
                        if (orderDate && orderDate.getFullYear() === currentYear) {
                            const monthIndex = orderDate.getMonth();
                            furnituresMap[furnitureId].monthlySales[monthIndex] += quantity;
                        }
                    }
                });
            }
        });

        // Lấy thống kê đánh giá cho từng sản phẩm
        const reviewsRef = collection(db, 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);
        
        reviewsSnapshot.forEach((doc) => {
            const reviewData = doc.data();
            const furnitureId = reviewData.furnitureId;
            const rating = reviewData.rating;
            
            if (furnitureId && furnituresMap[furnitureId] && rating >= 1 && rating <= 5) {
                furnituresMap[furnitureId].totalReviews++;
                furnituresMap[furnitureId].ratingDistribution[rating.toString()]++;
            }
        });

        // Tính trung bình rating
        Object.values(furnituresMap).forEach(product => {
            if (product.totalReviews > 0) {
                let totalRating = 0;
                for (let i = 1; i <= 5; i++) {
                    totalRating += i * product.ratingDistribution[i.toString()];
                }
                product.averageRating = totalRating / product.totalReviews;
            }
        });

        // Chỉ lấy tháng hiện tại trở về trước
        const currentMonth = today.getMonth() + 1;
        Object.values(furnituresMap).forEach(product => {
            product.monthlySales = product.monthlySales.slice(0, currentMonth);
        });

        // Chuyển đổi thành array và trả về
        const productStats = Object.values(furnituresMap);
        
        return {
            success: true,
            data: productStats
        };
    } catch (error) {
        console.error("Lỗi khi lấy thống kê sản phẩm:", error);
        return { success: false, error: error.message };
    }
};