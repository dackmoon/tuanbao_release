// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 通过openid查询用户
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    // 如果用户存在，返回用户信息
    if (userResult.data.length > 0) {
      return {
        success: true,
        userInfo: userResult.data[0]
      }
    } else {
      // 用户不存在
      return {
        success: false,
        message: '用户不存在'
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      error: error
    }
  }
} 