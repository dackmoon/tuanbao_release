// 云函数入口文件 - 获取用户ID
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  return {
    success: true,
    userInfo: {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    },
    message: `你的用户ID是: ${wxContext.OPENID}`
  }
}