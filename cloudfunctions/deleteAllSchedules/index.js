// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    console.log(`开始删除用户 ${openid} 的所有日程记录...`)
    
    // 分别删除两个集合中的所有用户数据
    let deletedScheduleCount = 0
    let deletedOperationCount = 0

    // 1. 删除所有日程记录
    try {
      const scheduleResult = await db.collection('schedules')
        .where({
          userId: openid
        })
        .remove()
      
      deletedScheduleCount = scheduleResult.stats.removed
      console.log(`删除了 ${deletedScheduleCount} 个日程记录`)
    } catch (scheduleError) {
      if (scheduleError.errCode === -502005 || scheduleError.message.includes('not exists')) {
        console.log('schedules 集合不存在，跳过删除')
      } else {
        console.warn('删除日程记录时出错:', scheduleError.message)
      }
    }

    // 2. 删除所有操作记录
    try {
      const operationResult = await db.collection('operationRecords')
        .where({
          _openid: openid
        })
        .remove()
      
      deletedOperationCount = operationResult.stats.removed
      console.log(`删除了 ${deletedOperationCount} 个操作记录`)
    } catch (operationError) {
      if (operationError.errCode === -502005 || operationError.message.includes('not exists')) {
        console.log('operationRecords 集合不存在，跳过删除')
      } else {
        console.warn('删除操作记录时出错:', operationError.message)
      }
    }

    const totalDeleted = deletedScheduleCount + deletedOperationCount
    
    return {
      success: true,
      message: totalDeleted > 0 
        ? `成功清理完成！删除了 ${deletedScheduleCount} 个日程记录和 ${deletedOperationCount} 个操作记录` 
        : '没有找到需要删除的记录',
      deletedScheduleCount: deletedScheduleCount,
      deletedOperationCount: deletedOperationCount,
      totalDeleted: totalDeleted
    }

  } catch (error) {
    console.error('删除所有日程记录失败:', error)
    return {
      success: false,
      error: error.message || '删除所有日程记录失败',
      details: error
    }
  }
}