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
        temperature: 1,
        max_tokens: 1000 // 降低token数量以减少处理时间
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