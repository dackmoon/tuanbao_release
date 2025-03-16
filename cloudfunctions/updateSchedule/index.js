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
    // 确保只能更新自己的日程
    const schedule = await db.collection('schedules').doc(event._id).get()
    if (schedule.data.userId !== userId) {
      return {
        success: false,
        message: '无权限修改此日程'
      }
    }
    
    // 构建更新数据
    const updateData = {}
    
    // 只更新提供的字段
    if (event.title !== undefined) updateData.title = event.title
    if (event.description !== undefined) updateData.description = event.description
    if (event.date !== undefined) updateData.date = event.date
    if (event.eventTime !== undefined) updateData.eventTime = event.eventTime
    if (event.startTime !== undefined) updateData.startTime = event.startTime
    if (event.endTime !== undefined) updateData.endTime = event.endTime
    if (event.completed !== undefined) updateData.completed = event.completed
    if (event.isAllDay !== undefined) updateData.isAllDay = event.isAllDay
    if (event.repeatType !== undefined) updateData.repeatType = event.repeatType
    if (event.repeatEndDate !== undefined) updateData.repeatEndDate = event.repeatEndDate
    if (event.reminder !== undefined) updateData.reminder = event.reminder
    if (event.color !== undefined) updateData.color = event.color
    
    // 添加更新时间
    updateData.updatedAt = db.serverDate()
    
    // 执行更新
    await db.collection('schedules').doc(event._id).update({
      data: updateData
    })
    
    return {
      success: true,
      message: '更新成功'
    }
  } catch (e) {
    return {
      success: false,
      message: e.message
    }
  }
} 