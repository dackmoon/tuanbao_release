// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 先获取当前用户的所有操作记录
    let operationRecords
    try {
      operationRecords = await db.collection('operationRecords')
        .where({
          _openid: openid
        })
        .get()
    } catch (queryError) {
      // 如果是集合不存在的错误，说明没有任何操作记录
      if (queryError.errCode === -502005 || queryError.message.includes('not exists')) {
        return {
          success: true,
          message: '没有需要删除的操作记录',
          deletedCount: 0
        }
      } else {
        throw queryError
      }
    }

    if (operationRecords.data.length === 0) {
      return {
        success: true,
        message: '没有需要删除的操作记录',
        deletedCount: 0
      }
    }

    // 收集所有需要删除的日程ID
    let allScheduleIds = []
    operationRecords.data.forEach(record => {
      if (record.scheduleIds && record.scheduleIds.length > 0) {
        allScheduleIds = allScheduleIds.concat(record.scheduleIds)
      }
    })

    // 开始事务操作
    const transaction = await db.startTransaction()

    try {
      // 1. 删除所有操作记录
      await transaction.collection('operationRecords')
        .where({
          _openid: openid
        })
        .remove()

      // 2. 删除所有相关的日程记录
      if (allScheduleIds.length > 0) {
        // 由于微信云数据库的限制，需要分批删除
        const batchSize = 20 // 每批处理20个
        for (let i = 0; i < allScheduleIds.length; i += batchSize) {
          const batch = allScheduleIds.slice(i, i + batchSize)
          
          for (const scheduleId of batch) {
            try {
              await transaction.collection('schedules').doc(scheduleId).remove()
            } catch (error) {
              // 某个日程可能已经被删除，继续处理其他的
              console.warn(`删除日程 ${scheduleId} 失败:`, error.message)
            }
          }
        }
      }

      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: `成功删除 ${operationRecords.data.length} 个操作记录及其关联的 ${allScheduleIds.length} 个日程`,
        deletedOperationCount: operationRecords.data.length,
        deletedScheduleCount: allScheduleIds.length
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('批量删除操作记录失败:', error)
    return {
      success: false,
      error: error.message || '批量删除操作记录失败'
    }
  }
}