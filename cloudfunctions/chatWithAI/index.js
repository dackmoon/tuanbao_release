// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 设置axios超时时间
const axiosInstance = axios.create({
  timeout: 25000, // 25秒超时
  timeoutErrorMessage: '请求超时，请稍后再试'
});

// 云函数入口函数
exports.main = async (event, context) => {
  const { message, sessionId } = event
  const wxContext = cloud.getWXContext()

  // 使用更简短的回复示例，降低处理时间
  const quickResponses = {
    '你好': '您好！我是团宝儿的AI助手，很高兴为您服务。',
    '帮助': '我可以回答问题、提供建议或者与您聊天。请告诉我您需要什么帮助？',
    '再见': '再见！有需要随时找我聊天哦。',
  };

  // 检查是否有简单回复可用
  for (const keyword in quickResponses) {
    if (message.includes(keyword)) {
      return {
        success: true,
        response: quickResponses[keyword],
        sessionId: sessionId || Date.now().toString(),
        fromCache: true
      };
    }
  }

  try {
    // 调用通义千问API（降低token数量以加快响应）
    const response = await axiosInstance({
      method: 'post',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY || 'sk-d282b1312f09400d91662ba895f35610'}`
      },
      data: {
        model: 'qwen-max',
        messages: [
          { role: 'system', content: '你是团宝儿的AI助手。回答简短友好。' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 100 // 降低token数量以减少处理时间
      }
    });

    // 返回AI的回复
    return {
      success: true,
      response: response.data.choices[0].message.content,
      sessionId: sessionId || Date.now().toString()
    }
  } catch (error) {
    console.error('调用AI接口失败:', error);
    
    // 返回友好的错误信息
    return {
      success: false,
      response: "非常抱歉，我现在有点忙，请稍后再试～",
      error: error.message,
      sessionId: sessionId || Date.now().toString()
    }
  }
} 