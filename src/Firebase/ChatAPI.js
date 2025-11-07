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
      
      // Fallback to local pattern matching if Gemini fails
      console.log('⚠️ Falling back to local pattern matching...');
      return await getLocalPatternResponse(message, userId, userData);
    }
  } catch (error) {
    console.error('Error in chatbot response:', error);
    return {
      text: '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng:\n\n' +
        '🔄 Thử lại\n' +
        '💬 Chat với admin\n' +
        '📞 Hotline: 0356 057 547',
      suggestions: ['Thử lại', 'Chat với admin', 'Trợ giúp'],
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

  // ENHANCED Intent Detection with fuzzy matching & context awareness
  const intents = {
      // Greeting - Enhanced with context
      greeting: /^(hi|hello|xin chào|chào|hey|hế lu|hế lô|alo|chao|xinchao)/i,

      // Product related - Enhanced with fuzzy matching
      productInfo: /(thông tin|thong tin|chi tiết|chi tiet|mô tả|mo ta|giá|gia|kích thước|kich thuoc|chất liệu|chat lieu|màu sắc|mau sac).*(sản phẩm|san pham|sp|nội thất|noi that|bàn|ban|ghế|ghe|tủ|tu|giường|giuong|sofa)/i,
      productSearch: /(tìm|tim|search|xem|có|co|bán|ban|mua).*(sản phẩm|san pham|sp|nội thất|noi that|bàn|ban|ghế|ghe|tủ|tu|giường|giuong|sofa|furniture)/i,
      productStock: /(còn hàng|con hang|hết hàng|het hang|tồn kho|ton kho|có sẵn|co san|availability|stock)/i,
      productDiscount: /(giảm giá|giam gia|khuyến mãi|khuyen mai|sale|discount|ưu đãi|uu dai|promotions?)/i,
      bestSeller: /(bán chạy|ban chay|phổ biến|pho bien|hot|best seller|top|nổi bật|noi bat|trending)/i,

      // Order related - Enhanced with context & fuzzy
      orderStatus: /(đơn hàng|don hang|donhang|order|kiểm tra đơn|kiem tra don|trạng thái đơn|trang thai don|theo dõi đơn|theo doi don|track)/i,
      orderCreate: /(đặt hàng|dat hang|dathang|mua|order|thanh toán|thanh toan|checkout|place order)/i,
      orderCancel: /(hủy đơn|huy don|cancel|không muốn mua|khong muon mua|xóa đơn|xoa don)/i,
      orderReturn: /(đổi trả|doi tra|hoàn trả|hoan tra|return|trả hàng|tra hang|refund)/i,

      // Cart related - Enhanced
      cart: /(giỏ hàng|gio hang|giohang|cart|shopping cart|giỏ|gio)/i,
      addToCart: /(thêm vào giỏ|them vao gio|add to cart|cho vào giỏ|cho vao gio|thêm giỏ|them gio)/i,

      // Account related - Enhanced
      account: /(tài khoản|tai khoan|taikhoan|account|profile|thông tin cá nhân|thong tin ca nhan|info)/i,
      login: /(đăng nhập|dang nhap|dangnhap|login|sign in|signin)/i,
      register: /(đăng ký|dang ky|dangky|register|sign up|signup|tạo tài khoản|tao tai khoan)/i,
      forgotPassword: /(quên mật khẩu|quen mat khau|forgot password|reset password|đặt lại mật khẩu|dat lai mat khau)/i,

      // Favorites - Enhanced
      favorites: /(yêu thích|yeu thich|yeuthich|favorite|wishlist|danh sách yêu thích|danh sach yeu thich|wish list)/i,

      // Shipping - Enhanced
      shipping: /(giao hàng|giao hang|giaohang|vận chuyển|van chuyen|vanchuyen|ship|delivery|thời gian giao|thoi gian giao|ship fee)/i,

      // Payment - Enhanced  
      payment: /(thanh toán|thanh toan|thanhtoan|payment|phương thức thanh toán|phuong thuc thanh toan|pay|trả tiền|tra tien|cod)/i,

      // Policy - Enhanced
      warranty: /(bảo hành|bao hanh|baohanh|warranty|guarantee|bh)/i,
      returnPolicy: /(chính sách đổi trả|chinh sach doi tra|return policy|refund policy|đổi trả|doi tra)/i,

      // Support - Enhanced
      contact: /(liên hệ|lien he|lienhe|contact|support|hỗ trợ|ho tro|hotro|admin|help desk)/i,
      help: /(giúp|giup|help|hướng dẫn|huong dan|huongdan|guide|tutorial|hdsd)/i,

      // Reviews - Enhanced
      review: /(đánh giá|danh gia|danhgia|review|rating|nhận xét|nhan xet|comment|feedback)/i,
      
      // NEW: Smart follow-up intents
      yes: /^(yes|có|co|ok|được|duoc|đồng ý|dong y|oke|okay|uhm|uh|đúng|dung)/i,
      no: /^(no|không|khong|ko|k|thôi|thoi|bye|tạm biệt|tam biet)/i,
      thanks: /(cảm ơn|cam on|camon|thanks|thank you|cám ơn|cam on)/i,
    };

    // Check intents with confidence scoring
    let bestIntent = null;
    let bestConfidence = 0;
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        bestIntent = intent;
        bestConfidence = 0.9; // High confidence for pattern match
        break;
      }
    }

    // If intent found with high confidence, use local handler
    if (bestIntent && bestConfidence >= 0.8) {
      const response = await handleIntent(bestIntent, message, userId, userData);
      return {
        ...response,
        source: 'local-fallback',
        confidence: bestConfidence,
      };
    }

    // Final fallback if no pattern matched
    return {
      text: '🤖 Xin lỗi, tôi chưa hiểu rõ yêu cầu. Bạn có thể hỏi về:\n\n' +
        '🛋️ Sản phẩm nội thất\n' +
        '📦 Đơn hàng\n' +
        '🛒 Giỏ hàng\n' +
        '� Hỗ trợ\n\n' +
        'Hoặc chat với admin để được hỗ trợ!',
      suggestions: ['Xem sản phẩm', 'Kiểm tra đơn hàng', 'Chat admin'],
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
      
      // Try to filter by keywords in message
      const keywords = ['ghế', 'ghe', 'bàn', 'ban', 'sofa', 'tủ', 'tu', 'giường', 'giuong', 'kệ', 'ke'];
      const matchedKeyword = keywords.find(kw => fuzzyMatch(searchQuery, kw, 0.7));
      
      if (matchedKeyword) {
        const allFurnitures = await getTopFurnitures(20);
        furnitures = allFurnitures.filter(p => 
          fuzzyMatch(p.furnitureName.toLowerCase(), matchedKeyword, 0.6)
        ).slice(0, 5);
      }
      
      if (furnitures.length > 0) {
        const productList = furnitures.map((p, i) => 
          `${i + 1}. ${p.furnitureName} - ${formatPrice(p.furniturePrice)}${p.discountPercentage ? ` (Giảm ${p.discountPercentage}%)` : ''}`
        ).join('\n');
        
        // Save to context for follow-up questions
        setContext(userId, { 
          lastIntent: 'productSearch', 
          lastProducts: furnitures.map(p => p.id),
          lastSearch: searchQuery 
        });
        
        return {
          text: `Đây là ${matchedKeyword ? `sản phẩm ${matchedKeyword}` : 'một số sản phẩm nổi bật'}:\n\n${productList}\n\nBạn có thể xem chi tiết trong mục Sản phẩm của ứng dụng.`,
          suggestions: [
            'Xem sản phẩm bán chạy',
            'Sản phẩm giảm giá',
            'Thêm vào giỏ hàng',
          ],
          actionType: 'viewProducts',
        };
      }
      return {
        text: 'Hiện tại chưa có sản phẩm nào phù hợp. Vui lòng thử từ khóa khác!',
        suggestions: ['Xem tất cả sản phẩm', 'Liên hệ hỗ trợ'],
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
        const bestSellerList = bestSellers.map((p, i) => 
          `${i + 1}. ${p.furnitureName} - ${formatPrice(p.furniturePrice)}`
        ).join('\n');
        
        setContext(userId, { 
          lastIntent: 'bestSeller', 
          lastProducts: bestSellers.map(p => p.id) 
        });
        
        return {
          text: `⭐ Top sản phẩm bán chạy:\n\n${bestSellerList}\n\nĐây là những sản phẩm được khách hàng yêu thích nhất!`,
          suggestions: ['Xem chi tiết', 'Thêm vào giỏ hàng'],
        };
      }
      return {
        text: 'Danh sách sản phẩm bán chạy đang được cập nhật.',
        suggestions: ['Xem tất cả sản phẩm'],
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
          '✅ Bảo hành 12-24 tháng tùy sản phẩm\n' +
          '✅ Bảo hành các lỗi do nhà sản xuất\n' +
          '✅ Hỗ trợ sửa chữa, thay thế linh kiện\n\n' +
          'Không bảo hành:\n' +
          '❌ Lỗi do người dùng\n' +
          '❌ Hư hỏng do thiên tai\n' +
          '❌ Sản phẩm đã qua sửa chữa ở nơi khác\n\n' +
          'Liên hệ hỗ trợ để được tư vấn chi tiết!',
        suggestions: ['Liên hệ hỗ trợ', 'Xem chính sách chi tiết'],
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
          '🏢 Furniture Store\n' +
          '📍 Địa chỉ: 123 Nguyễn Văn Linh, Q.7, TP.HCM\n' +
          '☎️ Hotline: 1900 xxxx\n' +
          '📧 Email: support@furniturestore.com\n' +
          '⏰ Giờ làm việc: 8:00 - 22:00 (Hàng ngày)\n\n' +
          'Hoặc chat trực tiếp với tôi, tôi sẽ chuyển cho admin nếu cần hỗ trợ chuyên sâu!',
        suggestions: [
          'Chat với admin',
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
      return {
        text: 'Tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể nói rõ hơn không?',
        suggestions: ['Trợ giúp', 'Liên hệ admin'],
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
