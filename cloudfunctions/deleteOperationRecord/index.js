// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { _id } = event

  if (!_id) {
    return {
      success: false,
      error: '缺少操作记录ID'
    }
  }

  try {
    // 先获取操作记录，确认权限并获取关联的日程ID
    let operationRecord
    try {
      operationRecord = await db.collection('operationRecords')
        .where({
          _id: _id,
          _openid: openid // 确保只能删除自己的记录
        })
        .get()
    } catch (queryError) {
      // 如果是集合不存在的错误，说明没有任何操作记录
      if (queryError.errCode === -502005 || queryError.message.includes('not exists')) {
        return {
          success: false,
          error: '操作记录不存在'
        }
      } else {
        throw queryError
      }
    }

    if (operationRecord.data.length === 0) {
      return {
        success: false,
        error: '操作记录不存在或无权限删除'
      }
    }

    const record = operationRecord.data[0]
    const scheduleIds = record.scheduleIds || []

    // 开始事务操作
    const transaction = await db.startTransaction()

    try {
      // 1. 删除操作记录
      await transaction.collection('operationRecords').doc(_id).remove()

      // 2. 删除相关的日程记录
      if (scheduleIds.length > 0) {
        // 批量删除相关日程
        for (const scheduleId of scheduleIds) {
          await transaction.collection('schedules').doc(scheduleId).remove()
        }
      }

      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: `成功删除操作记录及其关联的 ${scheduleIds.length} 个日程`,
        deletedScheduleIds: scheduleIds
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('删除操作记录失败:', error)
    return {
      success: false,
      error: error.message || '删除操作记录失败'
    }
  }
}