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
    const result = await db.collection('schedules').add({
      data: {
        userId: userId,
        title: event.title,
        description: event.description || '无描述',
        date: event.date,
        eventTime: event.eventTime || '12:00',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        completed: event.completed || false,
        isAllDay: event.isAllDay || false,
        repeatType: event.repeatType || 'none',
        repeatEndDate: event.repeatEndDate || '',
        reminder: event.reminder || 0,
        color: event.color || '#1296db',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
    
    return {
      success: true,
      scheduleId: result._id
    }
  } catch (e) {
    return {
      success: false,
      message: e.message
    }
  }
} 