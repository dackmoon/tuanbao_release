// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = wxContext.OPENID
  
  try {
    // 确保只能删除自己的日程
    const schedule = await db.collection('schedules').doc(event._id).get()
    if (schedule.data.userId !== userId) {
      return {
        success: false,
        message: '无权限删除此日程'
      }
    }
    
    // 执行删除
    await db.collection('schedules').doc(event._id).remove()
    
    return {
      success: true,
      message: '删除成功'
    }
  } catch (e) {
    return {
      success: false,
      message: e.message
    }
  }
} 