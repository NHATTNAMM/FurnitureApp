// Initialize Gemini AI with your API key
const GEMINI_API_KEY = 'AIzaSyD7MO6fHosiAFSksqEJHPGbgt0sSqZ8tlc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// Call Gemini API directly via REST
const callGeminiAPI = async (prompt) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract text from response
    if (data.candidates && data.candidates.length > 0) {
      const content = data.candidates[0].content;
      if (content && content.parts && content.parts.length > 0) {
        return content.parts[0].text;
      }
    }
    
    throw new Error('No response from Gemini AI');
    
  } catch (error) {
    console.error('Gemini API Call Error:', error);
    throw error;
  }
};

// System prompt for Furniture Store chatbot
const SYSTEM_PROMPT = `Bạn là Gemini - trợ lý ảo thông minh của Furniture Store (Cửa hàng Nội thất).

THÔNG TIN CỬA HÀNG:
- Tên: Furniture Store
- Sản phẩm: Nội thất cao cấp (ghế, bàn, sofa, tủ, giường, kệ, tủ quần áo, bàn làm việc...)
- Chính sách: Giao hàng toàn quốc, bảo hành 12 tháng, đổi trả trong 7 ngày
- Thanh toán: COD, Chuyển khoản, Ví điện tử
- Hotline: 0356 057 547
- Email: support@furniturestore.com

NHIỆM VỤ CỦA BẠN:
1. TƯ VẤN SẢN PHẨM:
   - Giải thích chi tiết về sản phẩm nội thất
   - So sánh các loại sản phẩm (chất liệu, kích thước, màu sắc)
   - Gợi ý sản phẩm phù hợp với nhu cầu
   - Giới thiệu sản phẩm bán chạy, giảm giá

2. HỖ TRỢ MUA HÀNG:
   - Hướng dẫn đặt hàng, thanh toán
   - Giải thích quy trình giao hàng
   - Hỗ trợ kiểm tra đơn hàng
   - Hướng dẫn sử dụng giỏ hàng

3. DỊCH VỤ KHÁCH HÀNG:
   - Giải đáp chính sách bảo hành, đổi trả
   - Hỗ trợ tài khoản (đăng ký, đăng nhập, quên mật khẩu)
   - Hướng dẫn đánh giá sản phẩm
   - Xử lý khiếu nại, yêu cầu

4. TƯƠNG TÁC THÔNG MINH:
   - Nhớ ngữ cảnh cuộc trò chuyện
   - Đặt câu hỏi ngược để hiểu rõ nhu cầu
   - Gợi ý hành động tiếp theo
   - Chuyển cho admin khi cần hỗ trợ chuyên sâu

PHONG CÁCH TRẢ LỜI:
✅ Thân thiện, nhiệt tình, chuyên nghiệp
✅ Trả lời ngắn gọn (2-4 câu), dễ hiểu
✅ Dùng emoji phù hợp (🛋️ 📦 ⭐ 💳 🚚)
✅ Luôn gợi ý hành động cụ thể
✅ Hỏi lại nếu chưa rõ yêu cầu

❌ Không dài dòng, lan man
❌ Không trả lời chủ đề ngoài nội thất
❌ Không đưa ra thông tin sai lệch

CÁCH XỬ LÝ CÂU HỎI:
1. CÂU HỎI VỀ SẢN PHẨM:
   - Mô tả chi tiết (chất liệu, kích thước, màu sắc, giá)
   - Gợi ý sản phẩm tương tự
   - Hướng dẫn vào app xem hình ảnh
   - Đặt câu hỏi: "Bạn cần tư vấn thêm về...?"

2. CÂU HỎI VỀ ĐƠN HÀNG:
   - Hướng dẫn kiểm tra đơn trong app (mục "Đơn hàng")
   - Giải thích trạng thái đơn
   - Cung cấp thông tin vận chuyển
   - Gợi ý liên hệ admin nếu có vấn đề

3. CÂU HỎI CHUNG CHUNG:
   - Làm rõ yêu cầu: "Bạn muốn hỏi về sản phẩm hay đơn hàng?"
   - Đưa ra các lựa chọn
   - Gợi ý các tính năng của app

4. CÂU HỎI NGOÀI LĨNH VỰC:
   - Lịch sự từ chối: "Tôi chỉ có thể hỗ trợ về nội thất và dịch vụ của cửa hàng"
   - Quay lại chủ đề: "Bạn có muốn tìm hiểu về sản phẩm nào không?"

VÍ DỤ TRẢ LỜI TỐT:
User: "Tủ quần áo có màu gì?"
Bot: "Chúng tôi có tủ quần áo với nhiều màu sắc: trắng, nâu gỗ, đen, xám. Bạn vào mục 'Sản phẩm' → 'Tủ' để xem hình ảnh chi tiết nhé! 🛋️
Bạn thích phong cách hiện đại hay cổ điển?"

User: "Đơn hàng của tôi đến khi nào?"
Bot: "Để kiểm tra đơn hàng, bạn vào mục 'Đơn hàng' trong app nhé. Đơn hàng thường giao trong 3-5 ngày. �
Bạn cần hỗ trợ gì thêm về đơn hàng không?"

User: "Giá ghế gaming bao nhiêu?"
Bot: "Ghế gaming của chúng tôi có nhiều mức giá từ 1.5 triệu đến 5 triệu tùy model. Bạn vào mục 'Sản phẩm' → 'Ghế' để xem chi tiết và chọn mẫu phù hợp! 🪑
Bạn có ngân sách mong muốn không?"

LƯU Ý QUAN TRỌNG:
- Luôn kết thúc bằng câu hỏi hoặc gợi ý hành động
- Nếu không chắc chắn, hỏi lại thay vì đoán
- Khuyến khích user khám phá app
- Đề xuất chat với admin khi cần hỗ trợ chuyên sâu`;


/**
 * Get AI response from Gemini
 * @param {string} userMessage - User's message
 * @param {object} context - Conversation context (optional)
 * @returns {Promise<object>} - AI response with text and suggestions
 */
export const getGeminiResponse = async (userMessage, context = {}) => {
  try {
    // Build enriched prompt with context
    let prompt = SYSTEM_PROMPT + '\n\n';
    
    // Add conversation history (last 3 messages for context)
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += '=== LỊCH SỬ CHAT GẦN ĐÂY ===\n';
      context.conversationHistory.slice(-3).forEach((msg, idx) => {
        prompt += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
      });
      prompt += '\n';
    }
    
    // Add user info for personalization
    if (context.userName) {
      prompt += `Thông tin user: ${context.userName}`;
      if (context.userEmail) prompt += ` (${context.userEmail})`;
      prompt += '\n';
    }
    
    // Add current browsing context
    if (context.lastProducts && context.lastProducts.length > 0) {
      prompt += `User đang xem: ${context.lastProducts.join(', ')}\n`;
    }
    if (context.lastIntent) {
      prompt += `Chủ đề gần nhất: ${context.lastIntent}\n`;
    }
    
    // Add current message
    prompt += `\n=== TIN NHẮN MỚI ===\nUser: ${userMessage}\n\n`;
    prompt += '=== YÊU CẦU ===\n';
    prompt += 'Hãy trả lời tin nhắn trên theo phong cách đã hướng dẫn.\n';
    prompt += 'Trả lời ngắn gọn (2-4 câu), thân thiện, có emoji, và luôn kết thúc bằng câu hỏi hoặc gợi ý.\n\n';
    prompt += 'Bot:';
    
    // Call Gemini API
    const text = await callGeminiAPI(prompt);
    
    // Parse and format response
    return {
      text: text.trim(),
      suggestions: generateSmartSuggestions(userMessage, text, context),
      source: 'gemini',
      confidence: 0.95,
    };
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Return fallback response
    return {
      text: 'Xin lỗi, tôi đang gặp chút vấn đề. Vui lòng:\n\n' +
        '🔄 Thử lại sau vài giây\n' +
        '� Chat với admin để được hỗ trợ ngay\n' +
        '📞 Hotline: 0356 057 547\n' +
        '📧 Email: support@furniturestore.com',
      suggestions: ['Thử lại', 'Chat với admin', 'Xem sản phẩm'],
      source: 'fallback',
      confidence: 0.1,
      error: error.message,
    };
  }
};

/**
 * Generate smart suggestions based on user message and AI response
 * @param {string} userMessage - User's message
 * @param {string} aiResponse - AI's response
 * @param {object} context - Conversation context
 * @returns {Array<string>} - Array of suggestions
 */
const generateSmartSuggestions = (userMessage, aiResponse, context = {}) => {
  const msg = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();
  const suggestions = [];
  
  // Product related
  if (msg.includes('sản phẩm') || msg.includes('ghế') || msg.includes('bàn') || 
      msg.includes('sofa') || msg.includes('tủ') || msg.includes('giường') ||
      response.includes('sản phẩm') || response.includes('xem')) {
    suggestions.push('📱 Xem sản phẩm');
    suggestions.push('⭐ Sản phẩm bán chạy');
    suggestions.push('🎁 Sản phẩm giảm giá');
  }
  
  // Order related
  else if (msg.includes('đơn hàng') || msg.includes('order') || msg.includes('kiểm tra') ||
           response.includes('đơn hàng') || response.includes('giao hàng')) {
    suggestions.push('📦 Kiểm tra đơn hàng');
    suggestions.push('🛒 Đặt hàng mới');
    suggestions.push('🔄 Chính sách đổi trả');
  }
  
  // Cart related
  else if (msg.includes('giỏ hàng') || msg.includes('cart') || msg.includes('thanh toán')) {
    suggestions.push('🛒 Xem giỏ hàng');
    suggestions.push('💳 Thanh toán');
    suggestions.push('🛍️ Tiếp tục mua sắm');
  }
  
  // Policy/Support related
  else if (msg.includes('bảo hành') || msg.includes('đổi trả') || msg.includes('chính sách') ||
           msg.includes('liên hệ') || msg.includes('hỗ trợ') || msg.includes('admin')) {
    suggestions.push('💬 Chat với admin');
    suggestions.push('🛡️ Chính sách bảo hành');
    suggestions.push('📞 Thông tin liên hệ');
  }
  
  // Account related
  else if (msg.includes('tài khoản') || msg.includes('đăng nhập') || msg.includes('đăng ký')) {
    suggestions.push('👤 Thông tin tài khoản');
    suggestions.push('🔐 Đổi mật khẩu');
    suggestions.push('❤️ Yêu thích của tôi');
  }
  
  // Review related
  else if (msg.includes('đánh giá') || msg.includes('review') || msg.includes('nhận xét')) {
    suggestions.push('⭐ Đánh giá sản phẩm');
    suggestions.push('💬 Xem đánh giá');
    suggestions.push('📝 Viết đánh giá');
  }
  
  // Default smart suggestions based on conversation history
  if (suggestions.length === 0) {
    // If user asked question, provide exploration options
    if (msg.includes('?') || msg.includes('như thế nào') || msg.includes('có')) {
      suggestions.push('📱 Xem thêm chi tiết');
      suggestions.push('💬 Hỏi admin');
      suggestions.push('❓ Trợ giúp khác');
    } else {
      suggestions.push('🛋️ Khám phá sản phẩm');
      suggestions.push('📦 Đơn hàng của tôi');
      suggestions.push('💬 Chat với admin');
    }
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
};

/**
 * Check if Gemini API is working
 * @returns {Promise<boolean>}
 */
export const testGeminiConnection = async () => {
  try {
    const text = await callGeminiAPI('Xin chào');
    return text && text.length > 0;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};

export default {
  getGeminiResponse,
  testGeminiConnection,
};
