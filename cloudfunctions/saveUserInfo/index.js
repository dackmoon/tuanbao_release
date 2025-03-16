// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取用户信息
  const { avatarUrl, nickName } = event
  
  try {
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    // 如果用户不存在，则创建新用户
    if (userResult.data.length === 0) {
      // 创建新用户
      const result = await db.collection('users').add({
        data: {
          _openid: openid,
          avatarUrl: avatarUrl,
          nickName: nickName,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        isNewUser: true,
        userId: result._id
      }
    } else {
      // 更新现有用户信息
      const userId = userResult.data[0]._id
      await db.collection('users').doc(userId).update({
        data: {
          avatarUrl: avatarUrl,
          nickName: nickName,
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        isNewUser: false,
        userId: userId
      }
    }
  } catch (error) {
    console.error('保存用户信息失败:', error)
    return {
      success: false,
      error: error
    }
  }
} 