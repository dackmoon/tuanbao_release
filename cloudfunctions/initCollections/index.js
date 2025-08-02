// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const results = {
    schedules: { success: false, message: '' },
    operationRecords: { success: false, message: '' }
  }
  
  try {
    // 创建日程表
    await db.createCollection('schedules')
    results.schedules = { success: true, message: 'schedules集合创建成功' }
  } catch (e) {
    // 如果集合已存在，会抛出错误，但这不影响使用
    if (e.message.includes('already exists') || e.errCode === -502002) {
      results.schedules = { success: true, message: 'schedules集合已存在' }
    } else {
      results.schedules = { success: false, message: e.message }
    }
  }

  try {
    // 创建操作记录表
    await db.createCollection('operationRecords')
    results.operationRecords = { success: true, message: 'operationRecords集合创建成功' }
  } catch (e) {
    // 如果集合已存在，会抛出错误，但这不影响使用
    if (e.message.includes('already exists') || e.errCode === -502002) {
      results.operationRecords = { success: true, message: 'operationRecords集合已存在' }
    } else {
      results.operationRecords = { success: false, message: e.message }
    }
  }

  // 判断总体是否成功
  const allSuccess = results.schedules.success && results.operationRecords.success
  
  return {
    success: allSuccess,
    message: allSuccess ? '所有集合创建/验证成功' : '部分集合创建失败',
    details: results
  }
}