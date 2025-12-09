import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from './FirebaseConfig';
import { getGeminiResponse } from './GeminiConfig';

// Send a message to the chat
export const sendMessage = async (userId, messageData) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    await addDoc(chatRef, {
      ...messageData,
      timestamp: new Date(),
      isRead: messageData.sender === 'user', // User messages are auto-marked as read
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

// Load chat messages in real-time
export const loadChatMessages = (userId, setMessages) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Filter out deleted messages (both soft and permanent delete)
      const activeMessages = messages.filter(msg => !msg.isDeleted && !msg.deletedByUser);
      setMessages(activeMessages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error loading messages:', error);
    setMessages([]);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, where('isRead', '==', false), where('sender', '==', 'bot'));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.update(document.ref, { isRead: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
};

// Soft delete chat history (can be undone within 1 day)
export const deleteChatHistory = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const snapshot = await getDocs(chatRef);

    const batch = writeBatch(db);
    const deleteTime = new Date();
    
    snapshot.docs.forEach((document) => {
      batch.update(document.ref, { 
        isDeleted: true,
        deletedAt: deleteTime,
      });
    });

    await batch.commit();
    return { success: true, deletedAt: deleteTime };
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return { success: false, error: error.message };
  }
};

// Undo delete chat history (restore messages)
export const undoDeleteChatHistory = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, where('isDeleted', '==', true));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    const now = new Date();
    
    snapshot.docs.forEach((document) => {
      const data = document.data();
      // Only restore if deleted within 1 day (24 hours)
      if (data.deletedAt) {
        const deletedTime = data.deletedAt.toDate();
        const hoursDiff = (now - deletedTime) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          batch.update(document.ref, { 
            isDeleted: false,
            deletedAt: null,
          });
        }
      }
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error undoing delete:', error);
    return { success: false, error: error.message };
  }
};

// Check if there are deleted messages that can be restored
export const checkDeletedMessages = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, where('isDeleted', '==', true), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { hasDeleted: false };
    }
    
    const firstDeleted = snapshot.docs[0].data();
    const deletedTime = firstDeleted.deletedAt?.toDate();
    
    if (!deletedTime) {
      return { hasDeleted: false };
    }
    
    const now = new Date();
    const hoursDiff = (now - deletedTime) / (1000 * 60 * 60);
    
    // Can restore if deleted within 24 hours
    if (hoursDiff <= 24) {
      return { 
        hasDeleted: true, 
        canRestore: true,
        deletedAt: deletedTime,
        hoursRemaining: Math.ceil(24 - hoursDiff),
      };
    }
    
    return { hasDeleted: true, canRestore: false };
  } catch (error) {
    console.error('Error checking deleted messages:', error);
    return { hasDeleted: false };
  }
};

// Permanently delete messages older than 1 day (run this periodically)
export const permanentlyDeleteOldMessages = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, where('isDeleted', '==', true));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    const now = new Date();
    let deletedCount = 0;
    
    snapshot.docs.forEach((document) => {
      const data = document.data();
      if (data.deletedAt) {
        const deletedTime = data.deletedAt.toDate();
        const hoursDiff = (now - deletedTime) / (1000 * 60 * 60);
        
        // Permanently delete if older than 24 hours
        if (hoursDiff > 24) {
          batch.delete(document.ref);
          deletedCount++;
        }
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }
    
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error permanently deleting messages:', error);
    return { success: false, error: error.message };
  }
};

// Permanently delete ALL messages for USER (admin still can see)
export const permanentlyDeleteAllMessages = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const snapshot = await getDocs(chatRef);

    const batch = writeBatch(db);
    const deleteTime = new Date();
    
    snapshot.docs.forEach((document) => {
      // Don't actually delete, just mark as deleted by user
      batch.update(document.ref, { 
        deletedByUser: true,
        deletedByUserAt: deleteTime,
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error permanently deleting all messages:', error);
    return { success: false, error: error.message };
  }
};

// Get unread message count
export const getUnreadMessageCount = async (userId) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, where('isRead', '==', false), where('sender', '==', 'bot'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Recall/Delete a single message
export const recallMessage = async (userId, messageId) => {
  try {
    const messageRef = doc(db, 'chats', userId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message not found' };
    }
    
    const messageData = messageDoc.data();
    
    // Only allow user to recall their own messages
    if (messageData.sender !== 'user') {
      return { success: false, error: 'Can only recall your own messages' };
    }
    
    // Check if message is within recall time limit (e.g., 24 hours)
    const messageTime = messageData.timestamp?.toDate ? messageData.timestamp.toDate() : new Date(messageData.timestamp);
    const hoursSinceMessage = (new Date() - messageTime) / (1000 * 60 * 60);
    
    if (hoursSinceMessage > 24) {
      return { success: false, error: 'Cannot recall messages older than 24 hours' };
    }
    
    // Mark as recalled (admin can still see)
    await updateDoc(messageRef, {
      isRecalled: true,
      recalledAt: new Date(),
      originalText: messageData.text, // Save original for admin
      text: 'Tin nhắn đã được thu hồi',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error recalling message:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ENHANCED AI FEATURES
// ============================================

// Fuzzy matching for typos
const fuzzyMatch = (input, pattern) => {
  const inputLower = input.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Exact match
  if (inputLower.includes(patternLower)) return true;
  
  // Check with common typos
  const typoMap = {
    'sản phẩm': ['san pham', 'sanpham', 'sp'],
    'đơn hàng': ['don hang', 'donhang', 'don'],
    'giỏ hàng': ['gio hang', 'giohang'],
    'thanh toán': ['thanh toan', 'thanhtoan'],
    'vận chuyển': ['van chuyen', 'vanchuyen'],
    'bảo hành': ['bao hanh', 'baohanh'],
  };
  
  for (const [correct, typos] of Object.entries(typoMap)) {
    if (patternLower.includes(correct) && typos.some(typo => inputLower.includes(typo))) {
      return true;
    }
  }
  
  return false;
};

// Extract numbers from text (for product IDs, order numbers, etc.)
const extractNumbers = (text) => {
  const matches = text.match(/\d+/g);
  return matches ? matches.map(Number) : [];
};

// Detect multiple intents in one message
const detectMultipleIntents = (message) => {
  const detectedIntents = [];
  const intentPatterns = {
    product: /(sản phẩm|sp|product|furniture)/i,
    order: /(đơn hàng|order|đặt hàng)/i,
    cart: /(giỏ hàng|cart)/i,
    payment: /(thanh toán|payment|pay)/i,
    shipping: /(giao hàng|ship|vận chuyển)/i,
  };
  
  for (const [intent, pattern] of Object.entries(intentPatterns)) {
    if (pattern.test(message)) {
      detectedIntents.push(intent);
    }
  }
  
  return detectedIntents;
};

// Context storage (simple in-memory for demo, should use Firebase for production)
const conversationContext = new Map();

const getContext = (userId) => {
  return conversationContext.get(userId) || { lastIntent: null, lastProduct: null };
};

const setContext = (userId, context) => {
  conversationContext.set(userId, { ...getContext(userId), ...context });
};

// AI Chatbot Response Logic - ENHANCED
export const getChatbotResponse = async (userMessage, userId) => {
  const message = userMessage.toLowerCase().trim();

  try {
    // Load user data for personalized responses
    const userDoc = await getDoc(doc(db, 'User', userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    // Get conversation history for context (last 5 messages)
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(
      chatRef, 
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
    const snapshot = await getDocs(q);
    const conversationHistory = snapshot.docs
      .map(doc => doc.data())
      .reverse(); // Oldest first
    
    // Get context
    const context = getContext(userId);
    
    // ============================================
    // GEMINI AI - Primary Response System
    // ============================================
    console.log('🤖 Using Gemini AI for intelligent response...');
    
    try {
      // Prepare enriched context for Gemini
      const geminiContext = {
        userName: userData?.fullName,
        userEmail: userData?.email,
        conversationHistory: conversationHistory,
        lastIntent: context.lastIntent,
        lastProducts: context.lastProducts,
      };
      
      // Get AI response from Gemini
      const aiResponse = await getGeminiResponse(userMessage, geminiContext);
      
      // Save context for next interaction
      setContext(userId, { 
        lastIntent: detectIntent(message),
        lastMessage: userMessage,
        lastResponse: aiResponse.text,
        lastProducts: context.lastProducts || [],
      });
      
      return aiResponse;
      
    } catch (geminiError) {
      console.error('❌ Gemini AI Error:', geminiError);
      
      // Check if it's quota error
      const isQuotaError = geminiError.message && geminiError.message.includes('quota');
      if (isQuotaError) {
        console.log('💡 Gemini API quota exceeded - using smart pattern matching instead');
      } else {
        console.log('⚠️ Gemini unavailable - falling back to local pattern matching...');
      }
      
      // Fallback to local pattern matching
      const fallbackResponse = await getLocalPatternResponse(message, userId, userData);
      
      // Add a subtle note only if pattern matching also has low confidence
      if (fallbackResponse.confidence < 0.5 && !isQuotaError) {
        fallbackResponse.text = fallbackResponse.text + 
          '\n\n💬 Bạn cũng có thể chat với admin để được hỗ trợ tốt hơn!';
        if (!fallbackResponse.suggestions.includes('Chat với admin')) {
          fallbackResponse.suggestions.unshift('Chat với admin');
        }
      }
      
      return fallbackResponse;
    }
  } catch (error) {
    console.error('Error in chatbot response:', error);
    return {
      text: '🙏 Rất xin lỗi vì sự bất tiện này!\n\n' +
        'Tôi đang gặp một chút vấn đề kỹ thuật. Bạn vui lòng:\n\n' +
        '🔄 Thử lại sau giây lát\n' +
        '💬 Chat trực tiếp với admin (nhanh hơn)\n' +
        '📞 Gọi hotline: 0356 057 547\n\n' +
        'Chúng tôi luôn sẵn sàng hỗ trợ bạn! ❤️',
      suggestions: ['Thử lại', 'Chat admin', 'Xem sản phẩm'],
      source: 'error',
      confidence: 0,
    };
  }
};

// Detect intent from message (for context tracking)
const detectIntent = (message) => {
  const intents = {
    productInfo: /(sản phẩm|ghế|bàn|tủ|giường|sofa)/i,
    orderStatus: /(đơn hàng|order|kiểm tra)/i,
    cart: /(giỏ hàng|cart)/i,
    payment: /(thanh toán|payment|pay)/i,
    shipping: /(giao hàng|vận chuyển|ship)/i,
    support: /(hỗ trợ|admin|help)/i,
  };
  
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(message)) return intent;
  }
  
  return 'general';
};

// Local pattern response (fallback when Gemini fails)
const getLocalPatternResponse = async (message, userId, userData) => {
  // Extract useful info from message
  const numbers = extractNumbers(message);
  const lowerMessage = message.toLowerCase().trim();

  // ENHANCED Intent Detection with PRIORITY SYSTEM
  // Higher priority = more specific patterns, checked first
  const intents = [
    // PRIORITY 1: Very specific patterns (exact matches)
    { name: 'greeting', priority: 1, pattern: /^(hi|hello|xin chào|chào|hey|hế lu|hế lô|alo|chao|xinchao|chao ban|xin chao|ê|êi|chào bạn)$/i },
    { name: 'yes', priority: 1, pattern: /^(yes|có|co|ok|được|duoc|đồng ý|dong y|oke|okay|uhm|uh|đúng|dung)$/i },
    { name: 'no', priority: 1, pattern: /^(no|không|khong|ko|k|thôi|thoi|bye|tạm biệt|tam biet)$/i },
    { name: 'thanks', priority: 1, pattern: /(cảm ơn|cam on|camon|thanks|thank you|cám ơn|cam on)/i },

    // PRIORITY 2: Specific multi-word patterns
    { name: 'shippingFee', priority: 2, pattern: /(phí ship|phi ship|phí giao hàng|phi giao hang|phí vận chuyển|phi van chuyen|ship fee|miễn phí ship|mien phi ship|free ship)/i },
    { name: 'shippingTime', priority: 2, pattern: /(thời gian giao|thoi gian giao|mấy ngày giao|may ngay giao|bao lâu giao|bao lau giao|khi nào đến|khi nao den|delivery time)/i },
    { name: 'orderDelivery', priority: 2, pattern: /(thông tin giao hàng|thong tin giao hang|thông tin vận chuyển|thong tin van chuyen|quy trình giao|quy trinh giao)/i },
    { name: 'storeHours', priority: 2, pattern: /(giờ mở cửa|gio mo cua|giờ làm việc|gio lam viec|mở cửa|mo cua|đóng cửa|dong cua|working hours|opening hours|mấy giờ mở|may gio mo)/i },
    { name: 'storeLocation', priority: 2, pattern: /(địa chỉ|dia chi|ở đâu|o dau|cửa hàng ở đâu|cua hang o dau|location|address|vị trí|vi tri)/i },
    { name: 'bestSeller', priority: 2, pattern: /(bán chạy|ban chay|phổ biến|pho bien|hot|best seller|top|nổi bật|noi bat|trending|nhiều người mua|nhieu nguoi mua)/i },
    { name: 'productDiscount', priority: 2, pattern: /(giảm giá|giam gia|khuyến mãi|khuyen mai|sale|discount|ưu đãi|uu dai|promotions?|giá tốt|gia tot|rẻ|re|giá rẻ|gia re|km)/i },
    { name: 'forgotPassword', priority: 2, pattern: /(quên mật khẩu|quen mat khau|forgot password|reset password|đặt lại mật khẩu|dat lai mat khau|quên pass|quen pass)/i },
    { name: 'returnPolicy', priority: 2, pattern: /(chính sách đổi trả|chinh sach doi tra|return policy|refund policy|đổi trả như thế nào|doi tra nhu the nao|hoàn tiền|hoan tien)/i },
    { name: 'orderCancel', priority: 2, pattern: /(hủy đơn|huy don|cancel order|không muốn mua|khong muon mua|xóa đơn|xoa don|hủy|huy)/i },
    { name: 'orderReturn', priority: 2, pattern: /(đổi trả|doi tra|hoàn trả|hoan tra|return|trả hàng|tra hang|refund|đổi|doi|trả|tra)/i },
    { name: 'productBudget', priority: 2, pattern: /(ngân sách|ngan sach|budget|bao nhiêu tiền|bao nhieu tien|khoảng bao nhiêu|khoang bao nhieu|từ .* đến|tu .* den|giá từ|gia tu)/i },
    { name: 'productCombo', priority: 2, pattern: /(bộ sản phẩm|bo san pham|combo|set|đôi|doi|cặp|cap|ghép|ghep|kèm|kem|đi kèm|di kem)/i },
    { name: 'installation', priority: 2, pattern: /(lắp đặt|lap dat|lắp ráp|lap rap|cài đặt|cai dat|install|assembly|hướng dẫn lắp|huong dan lap)/i },
    { name: 'maintenance', priority: 2, pattern: /(bảo quản|bao quan|bảo dưỡng|bao duong|vệ sinh|ve sinh|chăm sóc|cham soc|maintenance|clean|làm sạch|lam sach)/i },

    // PRIORITY 3: Product-specific patterns
    { name: 'productStock', priority: 3, pattern: /(còn hàng|con hang|hết hàng|het hang|tồn kho|ton kho|có sẵn|co san|availability|stock|sẵn|san|còn|con|hết|het)/i },
    { name: 'productSize', priority: 3, pattern: /(size|kích thước|kich thuoc|kích cỡ|kich co|to|nhỏ|nho|lớn|lon|rộng|rong|dài|dai|cao|ngang)/i },
    { name: 'productColor', priority: 3, pattern: /(màu|mau|màu sắc|mau sac|color|trắng|trang|đen|den|nâu|nau|xám|xam|xanh|vàng|vang|đỏ|do)/i },
    { name: 'productStyle', priority: 3, pattern: /(phong cách|phong cach|style|hiện đại|hien dai|cổ điển|co dien|tối giản|toi gian|bắc âu|bac au|minimalist|scandinavian|vintage)/i },
    { name: 'productRoom', priority: 3, pattern: /(phòng khách|phong khach|phòng ngủ|phong ngu|phòng làm việc|phong lam viec|phòng bếp|phong bep|phòng ăn|phong an|living room|bedroom|office)/i },
    { name: 'productMaterial', priority: 3, pattern: /(chất liệu|chat lieu|gỗ|go|kim loại|kim loai|da|vải|vai|nhựa|nhua|gỗ công nghiệp|go cong nghiep|gỗ tự nhiên|go tu nhien|inox|thép|thep)/i },
    { name: 'productCompare', priority: 3, pattern: /(so sánh|so sanh|khác nhau|khac nhau|khác gì|khac gi|tốt hơn|tot hon|nên chọn|nen chon|hay|hoặc|hoac|khác biệt|khac biet|hơn|hon)/i },
    { name: 'productRecommend', priority: 3, pattern: /(gợi ý|goi y|đề xuất|de xuat|tư vấn sản phẩm|tu van san pham|nên mua|nen mua|phù hợp|phu hop|recommend|suggest)/i },
    { name: 'productInfo', priority: 3, pattern: /(thông tin|thong tin|chi tiết|chi tiet|mô tả|mo ta).*(sản phẩm|san pham|sp|nội thất|noi that|bàn|ban|ghế|ghe|tủ|tu|giường|giuong|sofa)/i },
    { name: 'productSearch', priority: 3, pattern: /(tìm|tim|search|xem|có|co|bán|ban|mua|cho|muốn|muon|cần|can|kiếm|kiem).*(sản phẩm|san pham|sp|nội thất|noi that|bàn|ban|ghế|ghe|tủ|tu|giường|giuong|sofa|kệ|ke|furniture|đồ|đò)/i },

    // PRIORITY 4: General patterns
    { name: 'orderStatus', priority: 4, pattern: /(đơn hàng|don hang|donhang|order|kiểm tra đơn|kiem tra don|trạng thái đơn|trang thai don|theo dõi đơn|theo doi don|track)/i },
    { name: 'orderCreate', priority: 4, pattern: /(đặt hàng|dat hang|dathang|order|checkout|place order)/i },
    { name: 'cart', priority: 4, pattern: /(giỏ hàng|gio hang|giohang|cart|shopping cart|giỏ|gio)/i },
    { name: 'addToCart', priority: 4, pattern: /(thêm vào giỏ|them vao gio|add to cart|cho vào giỏ|cho vao gio|thêm giỏ|them gio)/i },
    { name: 'account', priority: 4, pattern: /(tài khoản|tai khoan|taikhoan|account|profile|thông tin cá nhân|thong tin ca nhan|info|hồ sơ|ho so)/i },
    { name: 'login', priority: 4, pattern: /(đăng nhập|dang nhap|dangnhap|login|sign in|signin)/i },
    { name: 'register', priority: 4, pattern: /(đăng ký|dang ky|dangky|register|sign up|signup|tạo tài khoản|tao tai khoan)/i },
    { name: 'favorites', priority: 4, pattern: /(yêu thích|yeu thich|yeuthich|favorite|wishlist|danh sách yêu thích|danh sach yeu thich|wish list)/i },
    { name: 'payment', priority: 4, pattern: /(thanh toán|thanh toan|thanhtoan|payment|phương thức thanh toán|phuong thuc thanh toan|pay|trả tiền|tra tien|cod|chuyển khoản|chuyen khoan|ví điện tử|vi dien tu|momo|zalopay)/i },
    { name: 'warranty', priority: 4, pattern: /(bảo hành|bao hanh|baohanh|warranty|guarantee|bh|đảm bảo|dam bao)/i },
    { name: 'contact', priority: 4, pattern: /(liên hệ|lien he|lienhe|contact|support|hỗ trợ|ho tro|hotro|admin|help desk|gọi|goi|phone|số điện thoại|so dien thoai|hotline)/i },
    { name: 'help', priority: 4, pattern: /(giúp|giup|help|hướng dẫn|huong dan|huongdan|guide|tutorial|hdsd|cách|cach|làm sao|lam sao|thế nào|the nao)/i },
    { name: 'review', priority: 4, pattern: /(đánh giá|danh gia|danhgia|review|rating|nhận xét|nhan xet|comment|feedback|sao|star)/i },
  ];

  // Find all matching intents with their priorities
  const matches = [];
  for (const intent of intents) {
    if (intent.pattern.test(message)) {
      matches.push(intent);
    }
  }

  // Sort by priority (lower number = higher priority)
  matches.sort((a, b) => a.priority - b.priority);

  // Use the highest priority match
  if (matches.length > 0) {
    const bestIntent = matches[0].name;
    const response = await handleIntent(bestIntent, message, userId, userData);
    return {
      ...response,
      source: 'local-fallback',
      confidence: 0.9,
    };
  }

    // Final fallback if no pattern matched - Polite and helpful with variety
    const fallbackMessages = [
      {
        text: '😊 Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn.\n\n' +
          'Bạn có thể diễn đạt lại theo cách khác hoặc hỏi tôi về:\n\n' +
          '• 🛋️ Tìm kiếm và tư vấn sản phẩm\n' +
          '• 📦 Kiểm tra trạng thái đơn hàng\n' +
          '• 🛒 Quản lý giỏ hàng\n' +
          '• 💳 Hướng dẫn thanh toán\n' +
          '• 🔄 Chính sách đổi trả\n\n' +
          '👉 Hoặc chat trực tiếp với admin để được tư vấn chi tiết hơn!',
      },
      {
        text: '🙏 Rất tiếc, tôi chưa nắm bắt được ý của bạn.\n\n' +
          'Bạn hãy thử hỏi lại bằng cách khác hoặc để tôi gợi ý một số chủ đề:\n\n' +
          '🔍 "Tìm ghế sofa giá rẻ"\n' +
          '📦 "Kiểm tra đơn hàng của tôi"\n' +
          '⭐ "Sản phẩm bán chạy"\n' +
          '🎁 "Có khuyến mãi gì không"\n' +
          '📞 "Thông tin liên hệ"\n\n' +
          'Tôi luôn sẵn sàng hỗ trợ bạn! 😊',
      },
      {
        text: '👋 Xin chào! Có vẻ câu hỏi của bạn khá phức tạp...\n\n' +
          'Để tôi hỗ trợ bạn tốt nhất, bạn có thể:\n\n' +
          '1️⃣ Hỏi cụ thể hơn (ví dụ: "Xem ghế gaming")\n' +
          '2️⃣ Chọn một trong các chủ đề bên dưới\n' +
          '3️⃣ Chat trực tiếp với admin để được tư vấn nhanh hơn\n\n' +
          'Tôi đang học hỏi để phục vụ bạn tốt hơn mỗi ngày! 💪',
      },
    ];
    
    // Randomly select a fallback message for variety
    const selectedMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    return {
      text: selectedMessage.text,
      suggestions: ['Xem sản phẩm', 'Sản phẩm bán chạy', 'Giảm giá', 'Chat admin'],
      source: 'fallback',
      confidence: 0.1,
    };
};

// Handle different intents - Enhanced with context awareness
const handleIntent = async (intent, message, userId, userData) => {
  const context = getContext(userId);
  const numbers = extractNumbers(message);
  
  switch (intent) {
    case 'greeting':
      // Personalized greeting based on user history
      const userOrders = await getUserOrders(userId);
      const hasOrders = userOrders && userOrders.length > 0;
      const lastOrder = hasOrders ? userOrders[0] : null;
      
      let greetingText = `Xin chào ${userData?.fullName || 'bạn'}! 👋\n\nTôi là trợ lý ảo của Furniture Store. `;
      
      if (hasOrders && lastOrder) {
        const daysSinceLastOrder = Math.floor((Date.now() - lastOrder.createdAt.toMillis()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastOrder < 7) {
          greetingText += `\n\n📦 Đơn hàng gần nhất của bạn đang ${lastOrder.status}.\n\n`;
        }
      }
      
      greetingText += 'Tôi có thể giúp bạn:\n\n' +
        '🛋️ Tìm kiếm và tư vấn sản phẩm\n' +
        '📦 Kiểm tra đơn hàng\n' +
        '🛒 Quản lý giỏ hàng\n' +
        '⭐ Xem đánh giá sản phẩm\n' +
        '💳 Hướng dẫn thanh toán\n\n' +
        'Bạn cần tôi hỗ trợ gì?';
      
      setContext(userId, { lastIntent: 'greeting', lastGreeting: Date.now() });
      
      return {
        text: greetingText,
        suggestions: [
          'Xem sản phẩm bán chạy',
          'Kiểm tra đơn hàng',
          'Sản phẩm giảm giá',
          'Hướng dẫn đặt hàng',
        ],
      };

    case 'productSearch':
    case 'productInfo':
      // Smart product search with fuzzy matching
      const searchQuery = message.toLowerCase();
      let furnitures = await getTopFurnitures(5);
      
      // Enhanced keyword detection with more categories
      const productCategories = {
        'ghế': ['ghế', 'ghe', 'chair'],
        'bàn': ['bàn', 'ban', 'table', 'desk'],
        'sofa': ['sofa', 'ghế sofa', 'ghe sofa'],
        'tủ': ['tủ', 'tu', 'cabinet', 'tủ quần áo', 'tu quan ao'],
        'giường': ['giường', 'giuong', 'bed', 'giường ngủ', 'giuong ngu'],
        'kệ': ['kệ', 'ke', 'shelf', 'kệ sách', 'ke sach'],
      };
      
      let matchedCategory = null;
      for (const [category, keywords] of Object.entries(productCategories)) {
        if (keywords.some(kw => searchQuery.includes(kw))) {
          matchedCategory = category;
          break;
        }
      }
      
      // Filter by matched category
      if (matchedCategory) {
        const allFurnitures = await getTopFurnitures(20);
        furnitures = allFurnitures.filter(p => {
          const nameLower = p.furnitureName.toLowerCase();
          return productCategories[matchedCategory].some(kw => nameLower.includes(kw));
        }).slice(0, 5);
      }
      
      if (furnitures.length > 0) {
        const productList = furnitures.map((p, i) => {
          const discountPrice = p.discountPercentage 
            ? calculateDiscountPrice(p.furniturePrice, p.discountPercentage)
            : p.furniturePrice;
          const priceText = p.discountPercentage
            ? `${formatPrice(discountPrice)} ~(Giảm ${p.discountPercentage}%)~`
            : formatPrice(p.furniturePrice);
          
          let stockText = '';
          if (p.quantity !== undefined) {
            stockText = p.quantity > 0 ? '✅ Còn hàng' : '❌ Hết hàng';
          }
          
          return `${i + 1}. *${p.furnitureName}*\n   💰 ${priceText}\n   ${stockText}`;
        }).join('\n\n');
        
        // Save to context for follow-up questions
        setContext(userId, { 
          lastIntent: 'productSearch', 
          lastProducts: furnitures.map(p => p.id),
          lastSearch: searchQuery,
          lastCategory: matchedCategory,
        });
        
        const categoryText = matchedCategory ? `*${matchedCategory}*` : 'sản phẩm nổi bật';
        
        return {
          text: `🛋️ Đây là các ${categoryText} cho bạn:\n\n${productList}\n\n💡 Xem chi tiết và hình ảnh trong mục *Sản phẩm* của ứng dụng.\n\nBạn muốn biết thêm về sản phẩm nào?`,
          suggestions: [
            'Xem chi tiết',
            'So sánh sản phẩm',
            'Sản phẩm giảm giá',
            'Thêm vào giỏ',
          ],
          actionType: 'viewProducts',
        };
      }
      
      // No products found - provide helpful alternatives
      return {
        text: `🔍 Không tìm thấy sản phẩm "${message}"\n\n` +
          'Bạn có thể thử:\n' +
          '• Tìm theo danh mục: ghế, bàn, sofa, tủ, giường, kệ\n' +
          '• Xem sản phẩm bán chạy\n' +
          '• Xem sản phẩm giảm giá\n\n' +
          'Hoặc liên hệ admin để được tư vấn chi tiết!',
        suggestions: ['Sản phẩm bán chạy', 'Giảm giá', 'Chat admin'],
      };

    case 'productStock':
      return {
        text: 'Để kiểm tra tình trạng còn hàng của sản phẩm cụ thể:\n\n' +
          '1. Vào mục "Sản phẩm"\n' +
          '2. Chọn sản phẩm bạn quan tâm\n' +
          '3. Xem thông tin tồn kho\n\n' +
          'Sản phẩm còn hàng sẽ hiển thị "Còn hàng" màu xanh ✅\n' +
          'Sản phẩm hết hàng sẽ hiển thị "Hết hàng" màu đỏ ❌',
        suggestions: ['Xem tất cả sản phẩm', 'Sản phẩm bán chạy'],
      };

    case 'productDiscount':
      const discountProducts = await getDiscountedFurnitures(5);
      if (discountProducts.length > 0) {
        const discountList = discountProducts.map((p, i) => 
          `${i + 1}. ${p.furnitureName}\n   Giảm ${p.discountPercentage}% - Chỉ còn ${formatPrice(calculateDiscountPrice(p.furniturePrice, p.discountPercentage))}`
        ).join('\n\n');
        
        setContext(userId, { 
          lastIntent: 'productDiscount', 
          lastProducts: discountProducts.map(p => p.id) 
        });
        
        return {
          text: `🔥 Các sản phẩm đang giảm giá:\n\n${discountList}\n\nNhanh tay đặt hàng để không bỏ lỡ!`,
          suggestions: ['Xem tất cả giảm giá', 'Thêm vào giỏ hàng'],
        };
      }
      return {
        text: 'Hiện tại chưa có sản phẩm giảm giá. Hãy theo dõi thường xuyên để không bỏ lỡ các chương trình khuyến mãi!',
        suggestions: ['Xem sản phẩm mới', 'Đăng ký nhận thông báo'],
      };

    case 'bestSeller':
      const bestSellers = await getBestSellingFurnitures(5);
      if (bestSellers.length > 0) {
        const bestSellerList = bestSellers.map((p, i) => {
          const discountPrice = p.discountPercentage 
            ? calculateDiscountPrice(p.furniturePrice, p.discountPercentage)
            : p.furniturePrice;
          const priceText = p.discountPercentage
            ? `${formatPrice(discountPrice)} (Giảm ${p.discountPercentage}%)`
            : formatPrice(p.furniturePrice);
          return `${i + 1}. ${p.furnitureName}\n   💰 ${priceText}\n   ⭐ Đánh giá: ${p.rating || 'Chưa có'}`;
        }).join('\n\n');
        
        setContext(userId, { 
          lastIntent: 'bestSeller', 
          lastProducts: bestSellers.map(p => p.id) 
        });
        
        return {
          text: `⭐ Top sản phẩm bán chạy nhất:\n\n${bestSellerList}\n\n🔥 Đây là những sản phẩm được khách hàng yêu thích và mua nhiều nhất!\n\nBạn muốn xem chi tiết sản phẩm nào?`,
          suggestions: ['Xem chi tiết', 'Thêm vào giỏ hàng', 'So sánh giá'],
        };
      }
      return {
        text: 'Danh sách sản phẩm bán chạy đang được cập nhật. Bạn có thể xem tất cả sản phẩm!',
        suggestions: ['Xem tất cả sản phẩm', 'Sản phẩm giảm giá'],
      };

    case 'productCompare':
      return {
        text: '🔍 So sánh sản phẩm:\n\n' +
          'Để so sánh chi tiết các sản phẩm, bạn có thể:\n\n' +
          '1️⃣ Xem thông tin chi tiết từng sản phẩm trong app\n' +
          '2️⃣ So sánh về:\n' +
          '   • Giá cả và khuyến mãi\n' +
          '   • Chất liệu (gỗ tự nhiên, công nghiệp, kim loại...)\n' +
          '   • Kích thước phù hợp không gian\n' +
          '   • Đánh giá từ khách hàng\n' +
          '   • Phong cách (hiện đại, cổ điển, tối giản...)\n\n' +
          '💡 Mẹo: Sản phẩm có nhiều đánh giá 5⭐ thường chất lượng tốt!\n\n' +
          'Bạn đang quan tâm so sánh loại sản phẩm nào?',
        suggestions: ['Ghế sofa', 'Bàn làm việc', 'Giường ngủ', 'Tủ quần áo'],
      };

    case 'productRecommend':
      // Smart recommendations based on user preferences
      const topProducts = await getTopFurnitures(3);
      const discountedProducts = await getDiscountedFurnitures(2);
      
      let recommendText = '💡 Gợi ý sản phẩm dành cho bạn:\n\n';
      
      if (topProducts.length > 0) {
        recommendText += '🌟 Được yêu thích nhất:\n';
        topProducts.forEach((p, i) => {
          recommendText += `${i + 1}. ${p.furnitureName} - ${formatPrice(p.furniturePrice)}\n`;
        });
      }
      
      if (discountedProducts.length > 0) {
        recommendText += '\n🔥 Đang giảm giá:\n';
        discountedProducts.forEach((p, i) => {
          const salePrice = calculateDiscountPrice(p.furniturePrice, p.discountPercentage);
          recommendText += `${i + 1}. ${p.furnitureName} - ${formatPrice(salePrice)} (Giảm ${p.discountPercentage}%)\n`;
        });
      }
      
      recommendText += '\n✨ Để tư vấn chính xác hơn, bạn có thể cho tôi biết:\n' +
        '• Sản phẩm cho phòng nào? (khách, ngủ, làm việc...)\n' +
        '• Phong cách yêu thích? (hiện đại, cổ điển, tối giản...)\n' +
        '• Ngân sách dự kiến?';
      
      return {
        text: recommendText,
        suggestions: ['Phòng khách', 'Phòng ngủ', 'Phòng làm việc', 'Xem tất cả'],
      };

    case 'productMaterial':
      return {
        text: '🪵 Thông tin chất liệu nội thất:\n\n' +
          '1️⃣ GỖ TỰ NHIÊN:\n' +
          '   ✅ Sang trọng, bền đẹp\n' +
          '   ✅ Thân thiện môi trường\n' +
          '   ⚠️ Giá cao, cần bảo dưỡng\n\n' +
          '2️⃣ GỖ CÔNG NGHIỆP:\n' +
          '   ✅ Giá phải chăng\n' +
          '   ✅ Đa dạng màu sắc\n' +
          '   ⚠️ Kém bền hơn gỗ tự nhiên\n\n' +
          '3️⃣ KIM LOẠI:\n' +
          '   ✅ Chắc chắn, hiện đại\n' +
          '   ✅ Dễ vệ sinh\n' +
          '   ⚠️ Nặng, dễ trầy\n\n' +
          '4️⃣ DA/VẢI:\n' +
          '   ✅ Mềm mại, thoải mái\n' +
          '   ✅ Phù hợp ghế sofa\n' +
          '   ⚠️ Cần vệ sinh thường xuyên\n\n' +
          'Bạn quan tâm chất liệu nào?',
        suggestions: ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kim loại', 'Xem sản phẩm'],
      };

    case 'productSize':
      return {
        text: '📏 Hướng dẫn chọn kích thước:\n\n' +
          '🛋️ GHẾ SOFA:\n' +
          '• 1-2 người: 150-180cm\n' +
          '• 3 người: 200-220cm\n' +
          '• Góc L: 250-300cm\n\n' +
          '🪑 BÀN LÀM VIỆC:\n' +
          '• Nhỏ: 100x60cm\n' +
          '• Trung bình: 120x60cm\n' +
          '• Lớn: 140-160x70cm\n\n' +
          '🛏️ GIƯỜNG NGỦ:\n' +
          '• Đơn: 100x200cm\n' +
          '• Đôi: 160x200cm\n' +
          '• King: 180x200cm\n\n' +
          '💡 Mẹo: Đo kích thước phòng trước khi mua!\n\n' +
          'Bạn cần tư vấn kích thước cho sản phẩm nào?',
        suggestions: ['Ghế sofa', 'Bàn làm việc', 'Giường ngủ', 'Tủ quần áo'],
      };

    case 'productColor':
      return {
        text: '🎨 Tư vấn màu sắc nội thất:\n\n' +
          '⚪ MÀU TRẮNG/XÁM:\n' +
          '• Phong cách: Hiện đại, tối giản\n' +
          '• Phù hợp: Mọi không gian\n' +
          '• Ưu điểm: Thoáng, rộng rãi\n\n' +
          '🟤 MÀU NÂU/GỖ:\n' +
          '• Phong cách: Ấm cúng, cổ điển\n' +
          '• Phù hợp: Phòng khách, phòng ngủ\n' +
          '• Ưu điểm: Sang trọng, dễ phối\n\n' +
          '⚫ MÀU ĐEN:\n' +
          '• Phong cách: Hiện đại, công nghiệp\n' +
          '• Phù hợp: Văn phòng, phòng làm việc\n' +
          '• Ưu điểm: Lịch lãm, ít bẩn\n\n' +
          '🎨 Các sản phẩm của chúng tôi có đa dạng màu sắc. Xem chi tiết trong mục Sản phẩm!\n\n' +
          'Bạn thích màu nào?',
        suggestions: ['Trắng/Xám', 'Nâu/Gỗ', 'Đen', 'Xem sản phẩm'],
      };

    case 'productStyle':
      return {
        text: '✨ Các phong cách nội thất:\n\n' +
          '1️⃣ HIỆN ĐẠI (Modern):\n' +
          '• Đường nét đơn giản, gọn gàng\n' +
          '• Màu trung tính: trắng, xám, đen\n' +
          '• Chất liệu: kim loại, kính\n\n' +
          '2️⃣ CỔ ĐIỂN (Classic):\n' +
          '• Họa tiết tinh xảo, tỉ mỉ\n' +
          '• Màu ấm: nâu, vàng đồng\n' +
          '• Chất liệu: gỗ tự nhiên\n\n' +
          '3️⃣ TỐI GIẢN (Minimalist):\n' +
          '• Tối giản, tiện dụng\n' +
          '• Màu đơn sắc\n' +
          '• "Less is more"\n\n' +
          '4️⃣ BẮC ÂU (Scandinavian):\n' +
          '• Ấm cúng, thoải mái\n' +
          '• Màu sáng, gỗ sáng\n' +
          '• Gần gũi thiên nhiên\n\n' +
          'Bạn yêu thích phong cách nào?',
        suggestions: ['Hiện đại', 'Cổ điển', 'Tối giản', 'Bắc Âu'],
      };

    case 'productRoom':
      return {
        text: '🏠 Tư vấn nội thất theo phòng:\n\n' +
          '🛋️ PHÒNG KHÁCH:\n' +
          '• Sofa, bàn trà, kệ tivi\n' +
          '• Trọng tâm: thoải mái, sang trọng\n\n' +
          '🛏️ PHÒNG NGỦ:\n' +
          '• Giường, tủ quần áo, bàn trang điểm\n' +
          '• Trọng tâm: thư giãn, riêng tư\n\n' +
          '💼 PHÒNG LÀM VIỆC:\n' +
          '• Bàn làm việc, ghế ergonomic, kệ sách\n' +
          '• Trọng tâm: tập trung, năng suất\n\n' +
          '🍽️ PHÒNG BẾP/ĂN:\n' +
          '• Bàn ăn, ghế ăn, tủ bếp\n' +
          '• Trọng tâm: tiện nghi, sum họp\n\n' +
          'Bạn đang tìm nội thất cho phòng nào?',
        suggestions: ['Phòng khách', 'Phòng ngủ', 'Phòng làm việc', 'Phòng bếp'],
      };

    case 'productBudget':
      return {
        text: '💰 Tư vấn theo ngân sách:\n\n' +
          '💸 DƯỚI 5 TRIỆU:\n' +
          '• Ghế làm việc, kệ sách nhỏ\n' +
          '• Bàn học, tủ đầu giường\n' +
          '• Chất liệu: gỗ công nghiệp\n\n' +
          '💵 5-10 TRIỆU:\n' +
          '• Bàn làm việc, ghế sofa nhỏ\n' +
          '• Tủ quần áo 2 cánh\n' +
          '• Chất liệu: gỗ công nghiệp cao cấp\n\n' +
          '💴 10-20 TRIỆU:\n' +
          '• Sofa 3 chỗ, bàn ăn 4-6 người\n' +
          '• Giường ngủ + tủ quần áo\n' +
          '• Chất liệu: gỗ tự nhiên, da\n\n' +
          '💎 TRÊN 20 TRIỆU:\n' +
          '• Bộ sofa cao cấp, giường tủ sang trọng\n' +
          '• Chất liệu: gỗ tự nhiên, da thật\n\n' +
          'Ngân sách của bạn khoảng bao nhiêu?',
        suggestions: ['Dưới 5 triệu', '5-10 triệu', '10-20 triệu', 'Trên 20 triệu'],
      };

    case 'productCombo':
      return {
        text: '🎁 Bộ sản phẩm combo:\n\n' +
          '✅ Mua combo tiết kiệm hơn 10-15%!\n\n' +
          '📦 COMBO PHỔ BIẾN:\n' +
          '• Bộ phòng khách: Sofa + Bàn trà\n' +
          '• Bộ phòng ngủ: Giường + Tủ + Bàn trang điểm\n' +
          '• Bộ làm việc: Bàn + Ghế + Kệ sách\n' +
          '• Bộ bàn ăn: Bàn + 4-6 ghế\n\n' +
          '🎯 ƯU ĐIỂM:\n' +
          '• Giá ưu đãi\n' +
          '• Phong cách thống nhất\n' +
          '• Giao hàng cùng lúc\n\n' +
          'Bạn quan tâm bộ nào?',
        suggestions: ['Bộ phòng khách', 'Bộ phòng ngủ', 'Bộ làm việc', 'Xem tất cả'],
      };

    case 'shippingFee':
      return {
        text: '💰 Phí vận chuyển:\n\n' +
          '🎁 MIỄN PHÍ SHIP:\n' +
          '• Đơn hàng từ 500.000đ trở lên\n' +
          '• Áp dụng toàn quốc\n\n' +
          '🚚 PHÍ VẬN CHUYỂN:\n' +
          '• Dưới 500k: 30.000-50.000đ\n' +
          '• Tùy khoảng cách và kích thước\n\n' +
          '📍 ƯỚC TÍNH TỰ ĐỘNG:\n' +
          'Phí ship sẽ được tính khi bạn:\n' +
          '• Thêm sản phẩm vào giỏ\n' +
          '• Nhập địa chỉ giao hàng\n' +
          '• Xem tổng tiền trước khi thanh toán\n\n' +
          '💡 Mẹo: Mua từ 500k để FREE SHIP!',
        suggestions: ['Xem giỏ hàng', 'Tiếp tục mua', 'Tìm sản phẩm'],
      };

    case 'shippingTime':
      return {
        text: '⏰ Thời gian giao hàng:\n\n' +
          '🏃 NHANH (1-2 ngày):\n' +
          '• Nội thành TP.HCM\n' +
          '• Sản phẩm có sẵn kho\n\n' +
          '🚗 TRUNG BÌNH (2-4 ngày):\n' +
          '• Ngoại thành, các tỉnh lân cận\n' +
          '• Miền Nam\n\n' +
          '🚚 TIÊU CHUẨN (3-7 ngày):\n' +
          '• Miền Trung, Miền Bắc\n' +
          '• Vùng xa\n\n' +
          '📦 Bạn có thể theo dõi đơn hàng realtime trong app!\n\n' +
          '⚡ Lưu ý: Sản phẩm đặt trước có thể mất 7-14 ngày.',
        suggestions: ['Kiểm tra đơn hàng', 'Đặt hàng ngay', 'Liên hệ hỗ trợ'],
      };

    case 'orderDelivery':
      return {
        text: '🚚 Thông tin giao hàng:\n\n' +
          '📍 QUY TRÌNH:\n' +
          '1️⃣ Xác nhận đơn hàng (1-2 giờ)\n' +
          '2️⃣ Đóng gói và xuất kho\n' +
          '3️⃣ Vận chuyển đến bạn\n' +
          '4️⃣ Giao hàng + lắp đặt (nếu cần)\n\n' +
          '⏱️ THỜI GIAN:\n' +
          '• Nội thành: 1-2 ngày\n' +
          '• Ngoại thành: 2-4 ngày\n' +
          '• Tỉnh khác: 3-7 ngày\n\n' +
          '💰 PHÍ SHIP:\n' +
          '• FREE với đơn > 500.000đ\n' +
          '• 30.000-150.000đ tùy khu vực\n\n' +
          'Kiểm tra đơn hàng trong mục "Đơn hàng"!',
        suggestions: ['Kiểm tra đơn hàng', 'Tính phí ship', 'Liên hệ hỗ trợ'],
      };

    case 'storeHours':
      return {
        text: '🕐 Giờ làm việc:\n\n' +
          '📍 CỬA HÀNG:\n' +
          '• Thứ 2 - Thứ 7: 8:00 - 21:00\n' +
          '• Chủ nhật: 9:00 - 20:00\n' +
          '• Lễ Tết: 9:00 - 18:00\n\n' +
          '💬 HỖ TRỢ ONLINE:\n' +
          '• Chatbot AI: 24/7 (luôn sẵn sàng!)\n' +
          '• Tư vấn viên: 8:00 - 21:00\n\n' +
          '📞 HOTLINE:\n' +
          '• 0356 057 547\n' +
          '• Hoạt động: 8:00 - 21:00\n\n' +
          '📱 MUA SẮM ONLINE:\n' +
          'Đặt hàng 24/7 qua app!\n\n' +
          'Bạn muốn ghé thăm cửa hàng hay mua online?',
        suggestions: ['Liên hệ cửa hàng', 'Mua online', 'Chat admin'],
      };

    case 'storeLocation':
      return {
        text: '📍 Liên hệ cửa hàng:\n\n' +
          '🏢 FURNITURE STORE\n' +
          '☎️ Hotline: 0356 057 547 (8:00-21:00 hàng ngày)\n' +
          '📧 Email: support@furniturestore.com\n\n' +
          '🕐 GIỜ MỞ CỬA:\n' +
          '• T2-T7: 8:00 - 21:00\n' +
          '• CN: 9:00 - 20:00\n\n' +
          '📍 CHI NHÁNH:\n' +
          'Hệ thống cửa hàng trên toàn quốc\n\n' +
          '📱 MUA SẮM ONLINE:\n' +
          'Giao hàng tận nơi toàn quốc\n' +
          'Thanh toán linh hoạt, đa dạng\n\n' +
          'Bạn muốn mua online hay ghé thăm cửa hàng?',
        suggestions: ['Mua online', 'Chat với admin', 'Gọi hotline'],
      };

    case 'installation':
      return {
        text: '🔧 Dịch vụ lắp đặt:\n\n' +
          '✅ MIỄN PHÍ LẮP ĐẶT:\n' +
          '• Đơn hàng từ 500.000đ\n' +
          '• Sản phẩm: giường, tủ, bàn lớn\n' +
          '• Áp dụng toàn quốc\n\n' +
          '💰 PHÍ LẮP ĐẶT:\n' +
          '• Sản phẩm nhỏ: 100.000-200.000đ\n' +
          '• Sản phẩm lớn: 200.000-500.000đ\n' +
          '• Khu vực xa: Phụ thu 50.000đ\n\n' +
          '📋 QUY TRÌNH:\n' +
          '1️⃣ Thợ giao hàng + lắp đặt\n' +
          '2️⃣ Kiểm tra sản phẩm\n' +
          '3️⃣ Lắp ráp theo hướng dẫn\n' +
          '4️⃣ Dọn dẹp, vệ sinh\n\n' +
          '💡 Hướng dẫn lắp đặt có kèm theo sản phẩm!',
        suggestions: ['Xem hướng dẫn', 'Đặt lịch lắp đặt', 'Liên hệ hỗ trợ'],
      };

    case 'maintenance':
      return {
        text: '🧹 Hướng dẫn bảo quản nội thất:\n\n' +
          '🪵 GỖ TỰ NHIÊN:\n' +
          '• Lau bằng khăn ẩm, tránh nước trực tiếp\n' +
          '• Đánh vecni 6 tháng/lần\n' +
          '• Tránh ánh nắng trực tiếp\n\n' +
          '🛋️ SOFA DA/VẢI:\n' +
          '• Hút bụi hàng tuần\n' +
          '• Vệ sinh vết bẩn ngay\n' +
          '• Dùng sản phẩm chuyên dụng\n\n' +
          '⚙️ KIM LOẠI:\n' +
          '• Lau khô để tránh gỉ\n' +
          '• Dùng dung dịch tẩy gỉ nếu cần\n\n' +
          '❄️ MẸO CHUNG:\n' +
          '• Tránh ẩm ướt\n' +
          '• Vệ sinh định kỳ\n' +
          '• Bảo quản trong môi trường khô ráo\n\n' +
          '📞 Cần hỗ trợ? Liên hệ: 0356 057 547',
        suggestions: ['Mua sản phẩm bảo quản', 'Liên hệ hỗ trợ', 'Xem video HD'],
      };

    case 'orderStatus':
      const orders = await getUserOrders(userId);
      if (orders.length > 0) {
        const orderList = orders.slice(0, 3).map((o, i) => {
          const statusEmoji = getStatusEmoji(o.status);
          return `${i + 1}. Đơn hàng #${o.id.substring(0, 8)}\n   ${statusEmoji} ${o.status}\n   ${formatPrice(o.totalAmount)}`;
        }).join('\n\n');
        
        return {
          text: `📦 Đơn hàng gần nhất của bạn:\n\n${orderList}\n\nXem chi tiết trong mục "Đơn hàng".`,
          suggestions: [
            'Xem tất cả đơn hàng',
            'Đặt hàng mới',
            'Hủy đơn hàng',
          ],
          actionType: 'viewOrders',
        };
      }
      return {
        text: 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay! 🛍️',
        suggestions: ['Xem sản phẩm', 'Sản phẩm bán chạy'],
      };

    case 'orderCreate':
      return {
        text: '📝 Hướng dẫn đặt hàng:\n\n' +
          '1. Chọn sản phẩm bạn thích\n' +
          '2. Nhấn "Thêm vào giỏ hàng"\n' +
          '3. Vào "Giỏ hàng" kiểm tra\n' +
          '4. Nhấn "Thanh toán"\n' +
          '5. Xác nhận thông tin và địa chỉ\n' +
          '6. Hoàn tất đặt hàng\n\n' +
          '💡 Lưu ý: Vui lòng cập nhật đầy đủ địa chỉ giao hàng trong phần "Hồ sơ".',
        suggestions: [
          'Xem giỏ hàng',
          'Cập nhật địa chỉ',
          'Xem sản phẩm',
        ],
      };

    case 'orderCancel':
      return {
        text: '❌ Hủy đơn hàng:\n\n' +
          'Bạn chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái "Chờ giao hàng".\n\n' +
          'Cách hủy:\n' +
          '1. Vào mục "Đơn hàng"\n' +
          '2. Chọn đơn hàng cần hủy\n' +
          '3. Nhấn nút "Hủy đơn"\n' +
          '4. Xác nhận hủy\n\n' +
          '⚠️ Đơn hàng đang giao hoặc đã giao không thể hủy.',
        suggestions: [
          'Xem đơn hàng',
          'Chính sách đổi trả',
          'Liên hệ hỗ trợ',
        ],
      };

    case 'orderReturn':
      return {
        text: '🔄 Chính sách đổi trả:\n\n' +
          '✅ Đổi trả trong vòng 7 ngày\n' +
          '✅ Sản phẩm còn nguyên vẹn, chưa qua sử dụng\n' +
          '✅ Còn đầy đủ hóa đơn, phụ kiện\n\n' +
          'Các trường hợp được đổi trả:\n' +
          '• Sản phẩm bị lỗi do nhà sản xuất\n' +
          '• Giao sai sản phẩm\n' +
          '• Sản phẩm bị hư hỏng trong quá trình vận chuyển\n\n' +
          'Liên hệ hỗ trợ để được xử lý nhanh nhất!',
        suggestions: ['Liên hệ hỗ trợ', 'Xem chính sách chi tiết'],
      };

    case 'cart':
      const cart = userData?.cart || [];
      if (cart.length > 0) {
        const totalItems = cart.reduce((sum, item) => sum + item.soLuong, 0);
        const totalPrice = cart.reduce((sum, item) => sum + item.tongGia, 0);
        
        return {
          text: `🛒 Giỏ hàng của bạn:\n\n` +
            `Số lượng sản phẩm: ${totalItems}\n` +
            `Tổng tiền: ${formatPrice(totalPrice)}\n\n` +
            `Bạn có thể xem chi tiết và thanh toán trong mục "Giỏ hàng".`,
          suggestions: [
            'Xem giỏ hàng',
            'Thanh toán ngay',
            'Tiếp tục mua sắm',
          ],
          actionType: 'viewCart',
        };
      }
      return {
        text: 'Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm yêu thích! 🛍️',
        suggestions: ['Xem sản phẩm', 'Sản phẩm bán chạy'],
      };

    case 'addToCart':
      return {
        text: '🛒 Thêm sản phẩm vào giỏ hàng:\n\n' +
          '1. Vào trang sản phẩm\n' +
          '2. Chọn sản phẩm bạn muốn mua\n' +
          '3. Chọn số lượng\n' +
          '4. Nhấn "Thêm vào giỏ hàng"\n\n' +
          'Sản phẩm sẽ được lưu trong giỏ hàng của bạn.',
        suggestions: ['Xem sản phẩm', 'Xem giỏ hàng'],
      };

    case 'account':
      return {
        text: `👤 Thông tin tài khoản:\n\n` +
          `Họ tên: ${userData?.fullName || 'Chưa cập nhật'}\n` +
          `Email: ${userData?.email || 'Chưa cập nhật'}\n` +
          `Số điện thoại: ${userData?.phone || 'Chưa cập nhật'}\n` +
          `Địa chỉ: ${userData?.address || 'Chưa cập nhật'}\n\n` +
          `Bạn có thể cập nhật thông tin trong mục "Hồ sơ".`,
        suggestions: [
          'Cập nhật thông tin',
          'Đổi mật khẩu',
          'Xem đơn hàng',
        ],
      };

    case 'login':
      return {
        text: '🔐 Đăng nhập tài khoản:\n\n' +
          'Vui lòng thoát khỏi chat và đăng nhập qua trang chủ ứng dụng.\n\n' +
          'Nếu bạn chưa có tài khoản, hãy đăng ký ngay!',
        suggestions: ['Đăng ký tài khoản', 'Quên mật khẩu'],
      };

    case 'register':
      return {
        text: '📝 Đăng ký tài khoản:\n\n' +
          'Để đăng ký tài khoản mới:\n' +
          '1. Thoát khỏi chat\n' +
          '2. Nhấn "Đăng ký" ở trang chủ\n' +
          '3. Điền đầy đủ thông tin\n' +
          '4. Xác nhận đăng ký\n\n' +
          'Sau khi đăng ký thành công, bạn có thể đăng nhập và mua sắm!',
        suggestions: ['Đăng nhập', 'Quên mật khẩu'],
      };

    case 'forgotPassword':
      return {
        text: '🔑 Quên mật khẩu:\n\n' +
          'Để đặt lại mật khẩu:\n' +
          '1. Nhấn "Quên mật khẩu" ở trang đăng nhập\n' +
          '2. Nhập email đã đăng ký\n' +
          '3. Kiểm tra email để nhận link đặt lại mật khẩu\n' +
          '4. Nhấn vào link và tạo mật khẩu mới\n\n' +
          '💡 Lưu ý: Kiểm tra cả hộp thư Spam nếu không thấy email.',
        suggestions: ['Đăng nhập', 'Liên hệ hỗ trợ'],
      };

    case 'favorites':
      const favorites = userData?.favorites || [];
      if (favorites.length > 0) {
        return {
          text: `⭐ Danh sách yêu thích:\n\n` +
            `Bạn có ${favorites.length} sản phẩm yêu thích.\n\n` +
            `Xem chi tiết trong mục "Yêu thích" của ứng dụng.`,
          suggestions: [
            'Xem yêu thích',
            'Thêm vào giỏ hàng',
          ],
          actionType: 'viewFavorites',
        };
      }
      return {
        text: 'Bạn chưa có sản phẩm yêu thích nào. Hãy thêm những sản phẩm bạn thích! ❤️',
        suggestions: ['Xem sản phẩm', 'Sản phẩm bán chạy'],
      };

    case 'shipping':
      return {
        text: '🚚 Thông tin vận chuyển:\n\n' +
          '⏱️ Thời gian giao hàng:\n' +
          '• Nội thành: 1-2 ngày\n' +
          '• Ngoại thành: 2-4 ngày\n' +
          '• Tỉnh khác: 3-7 ngày\n\n' +
          '💰 Phí vận chuyển:\n' +
          '• Đơn hàng > 5.000.000đ: Miễn phí\n' +
          '• Đơn hàng < 5.000.000đ: 50.000đ\n\n' +
          '📦 Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng".',
        suggestions: [
          'Kiểm tra đơn hàng',
          'Đặt hàng mới',
        ],
      };

    case 'payment':
      return {
        text: '💳 Phương thức thanh toán:\n\n' +
          '✅ Thanh toán khi nhận hàng (COD)\n' +
          '✅ Chuyển khoản ngân hàng\n' +
          '✅ Ví điện tử (Momo, ZaloPay)\n' +
          '✅ Thẻ tín dụng/ghi nợ\n\n' +
          '💡 Lưu ý:\n' +
          '• COD: Thanh toán bằng tiền mặt khi nhận hàng\n' +
          '• Chuyển khoản: Đơn hàng sẽ được xử lý sau khi nhận được tiền\n' +
          '• Thanh toán online: Xử lý nhanh chóng',
        suggestions: [
          'Đặt hàng ngay',
          'Xem giỏ hàng',
        ],
      };

    case 'warranty':
      return {
        text: '🛡️ Chính sách bảo hành:\n\n' +
          '✅ THỜI GIAN BẢO HÀNH:\n' +
          '• Nội thất gỗ: 12-24 tháng\n' +
          '• Kim loại, nhựa: 12 tháng\n' +
          '• Đệm, nệm: 6-12 tháng\n' +
          '• Phụ kiện: 3-6 tháng\n\n' +
          '✅ ĐƯỢC BẢO HÀNH:\n' +
          '• Lỗi sản xuất, vật liệu\n' +
          '• Hư hỏng trong quá trình vận chuyển\n' +
          '• Bảo trì, thay thế linh kiện\n\n' +
          '❌ KHÔNG BẢO HÀNH:\n' +
          '• Hư hỏng do người dùng\n' +
          '• Thiên tai, hỏa hoạn\n' +
          '• Đã sửa chữa ở nơi khác\n' +
          '• Hết thời gian bảo hành\n\n' +
          '📞 Yêu cầu bảo hành: Chat admin hoặc hotline!',
        suggestions: ['Liên hệ bảo hành', 'Xem chính sách', 'Chat admin'],
      };

    case 'returnPolicy':
      return {
        text: '🔄 Chính sách đổi trả:\n\n' +
          '✅ Thời gian: Trong vòng 7 ngày kể từ ngày nhận hàng\n' +
          '✅ Điều kiện: Sản phẩm còn nguyên vẹn, chưa qua sử dụng\n' +
          '✅ Hoàn tiền: 100% giá trị sản phẩm (nếu lỗi nhà sản xuất)\n\n' +
          'Quy trình đổi trả:\n' +
          '1. Liên hệ bộ phận hỗ trợ\n' +
          '2. Gửi ảnh/video sản phẩm lỗi\n' +
          '3. Đóng gói sản phẩm\n' +
          '4. Chờ nhân viên đến lấy hàng\n' +
          '5. Nhận sản phẩm mới hoặc hoàn tiền',
        suggestions: ['Liên hệ hỗ trợ', 'Xem đơn hàng'],
      };

    case 'contact':
      return {
        text: '📞 Liên hệ hỗ trợ:\n\n' +
          '🏢 Furniture Store - Nội thất cao cấp\n\n' +
          '📱 LIÊN HỆ TRỰC TIẾP:\n' +
          '• Hotline: 0356 057 547 (8:00-21:00)\n' +
          '• Email: support@furniturestore.com\n' +
          '• Chat trong app: 24/7\n\n' +
          '💬 HỖ TRỢ NHANH:\n' +
          '• Chat với tôi (AI): 24/7\n' +
          '• Tư vấn viên: 8:00-21:00\n\n' +
          '🕐 THỜI GIAN:\n' +
          '• Thứ 2-7: 8:00 - 21:00\n' +
          '• Chủ nhật: 9:00 - 20:00\n\n' +
          'Bạn cần hỗ trợ về vấn đề gì?',
        suggestions: [
          'Chat ngay',
          'Gọi hotline',
          'Gửi email',
        ],
      };

    case 'help':
      return {
        text: '❓ Trợ giúp:\n\n' +
          'Tôi có thể giúp bạn với:\n\n' +
          '🛋️ Tìm kiếm và xem sản phẩm\n' +
          '🛒 Quản lý giỏ hàng\n' +
          '📦 Theo dõi đơn hàng\n' +
          '⭐ Xem đánh giá sản phẩm\n' +
          '💳 Hướng dẫn thanh toán\n' +
          '🔄 Chính sách đổi trả\n' +
          '🛡️ Bảo hành sản phẩm\n' +
          '👤 Quản lý tài khoản\n\n' +
          'Hãy hỏi tôi bất cứ điều gì bạn cần!',
        suggestions: [
          'Xem sản phẩm',
          'Kiểm tra đơn hàng',
          'Chính sách đổi trả',
          'Liên hệ hỗ trợ',
        ],
      };

    case 'review':
      return {
        text: '⭐ Đánh giá sản phẩm:\n\n' +
          'Để viết đánh giá:\n' +
          '1. Vào mục "Đơn hàng"\n' +
          '2. Chọn đơn hàng đã hoàn thành\n' +
          '3. Nhấn "Đánh giá"\n' +
          '4. Chọn số sao (1-5)\n' +
          '5. Viết nhận xét\n' +
          '6. Thêm ảnh (nếu có)\n' +
          '7. Gửi đánh giá\n\n' +
          '💡 Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ và giúp khách hàng khác đưa ra quyết định tốt hơn!',
        suggestions: [
          'Xem đơn hàng',
          'Xem đánh giá của tôi',
        ],
      };

    // NEW: Follow-up intent handlers
    case 'yes':
      // Handle "yes" based on context
      if (context.lastIntent === 'productSearch' || context.lastIntent === 'bestSeller' || context.lastIntent === 'productDiscount') {
        return {
          text: '👍 Tuyệt vời! Để thêm sản phẩm vào giỏ hàng:\n\n' +
            '1. Vào mục "Sản phẩm"\n' +
            '2. Chọn sản phẩm bạn thích\n' +
            '3. Nhấn "Thêm vào giỏ hàng"\n\n' +
            'Hoặc bạn muốn tôi gợi ý thêm sản phẩm khác?',
          suggestions: ['Xem giỏ hàng', 'Gợi ý thêm', 'Thanh toán'],
        };
      } else if (context.lastIntent === 'orderStatus') {
        return {
          text: 'Bạn muốn làm gì với đơn hàng?',
          suggestions: ['Xem chi tiết', 'Hủy đơn hàng', 'Liên hệ hỗ trợ'],
        };
      }
      return {
        text: 'Tôi có thể giúp gì thêm cho bạn?',
        suggestions: ['Xem sản phẩm', 'Kiểm tra đơn hàng', 'Trợ giúp'],
      };

    case 'no':
      return {
        text: 'Không sao! Tôi luôn sẵn sàng hỗ trợ bạn. Hẹn gặp lại! 👋',
        suggestions: ['Xem sản phẩm', 'Trợ giúp'],
      };

    case 'thanks':
      return {
        text: `Rất vui được giúp đỡ bạn, ${userData?.fullName || 'bạn'}! 😊\n\n` +
          'Nếu cần gì thêm, đừng ngại hỏi tôi nhé!',
        suggestions: ['Xem sản phẩm', 'Kiểm tra đơn hàng'],
      };

    default:
      // Polite and encouraging response for unhandled cases
      return {
        text: '😊 Cảm ơn bạn đã hỏi! Tôi đang cố gắng hiểu yêu cầu của bạn...\n\n' +
          'Bạn có thể diễn đạt cụ thể hơn được không? \n\n' +
          'Ví dụ:\n' +
          '• "Tìm bàn làm việc giá rẻ"\n' +
          '• "Kiểm tra đơn hàng"\n' +
          '• "Cách thanh toán"\n\n' +
          'Hoặc chat với admin để được hỗ trợ ngay! 👍',
        suggestions: ['Xem sản phẩm', 'Kiểm tra đơn hàng', 'Chat admin', 'Trợ giúp'],
      };
  }
};

// Helper Functions

const getTopFurnitures = async (limitCount = 5) => {
  try {
    const furnituresRef = collection(db, 'furnitures');
    const q = query(furnituresRef, limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting furnitures:', error);
    return [];
  }
};

const getDiscountedFurnitures = async (limitCount = 5) => {
  try {
    const furnituresRef = collection(db, 'furnitures');
    const snapshot = await getDocs(furnituresRef);
    const discountedProducts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.discountPercentage && p.discountPercentage > 0)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, limitCount);
    return discountedProducts;
  } catch (error) {
    console.error('Error getting discounted furnitures:', error);
    return [];
  }
};

const getBestSellingFurnitures = async (limitCount = 5) => {
  try {
    const furnituresRef = collection(db, 'furnitures');
    const q = query(furnituresRef, limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting best sellers:', error);
    return [];
  }
};

const getUserOrders = async (userId) => {
  try {
    const ordersRef = collection(db, 'orders');
    // Simplified query - only filter by userId, sort manually
    const q = query(ordersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    // Sort by createdAt manually in JavaScript
    const orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA; // Descending order
      })
      .slice(0, 10); // Limit to 10
    
    return orders;
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const calculateDiscountPrice = (price, discount) => {
  if (!discount || discount <= 0) return price;
  return price * (1 - discount / 100);
};

const getStatusEmoji = (status) => {
  const emojiMap = {
    'Chờ xác nhận': '⏳',
    'Chờ giao hàng': '📦',
    'Đang giao': '🚚',
    'Đã đặt': '✅',
    'Đã hủy': '❌',
  };
  return emojiMap[status] || '📋';
};

// Admin Functions (for admin panel)
export const getAllUserChats = async () => {
  try {
    const usersRef = collection(db, 'User');
    const usersSnapshot = await getDocs(usersRef);
    
    const chatsData = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      const chatRef = collection(db, 'chats', userId, 'messages');
      const q = query(chatRef, orderBy('timestamp', 'desc'), limit(1));
      const chatSnapshot = await getDocs(q);
      
      if (!chatSnapshot.empty) {
        const lastMessage = chatSnapshot.docs[0].data();
        const unreadCount = await getUnreadMessageCount(userId);
        
        chatsData.push({
          userId,
          userName: userData.fullName || 'Unknown',
          userEmail: userData.email || '',
          lastMessage: lastMessage.text,
          lastMessageTime: lastMessage.timestamp,
          unreadCount,
        });
      }
    }
    
    return { success: true, data: chatsData };
  } catch (error) {
    console.error('Error getting all user chats:', error);
    return { success: false, error: error.message };
  }
};

// Load ALL chat messages for ADMIN (including deleted by user, but NOT recalled)
export const loadChatMessagesForAdmin = (userId, setMessages) => {
  try {
    const chatRef = collection(db, 'chats', userId, 'messages');
    const q = query(chatRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Admin sees deleted messages BUT NOT recalled messages
      // Filter out recalled messages (user thu hồi = admin cũng không thấy)
      const visibleMessages = messages.filter(msg => !msg.isRecalled);
      setMessages(visibleMessages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error loading messages for admin:', error);
    setMessages([]);
  }
};

export const sendAdminMessage = async (userId, messageText) => {
  try {
    await sendMessage(userId, {
      text: messageText,
      sender: 'admin',
      timestamp: new Date(),
      isRead: false,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending admin message:', error);
    return { success: false, error: error.message };
  }
};
