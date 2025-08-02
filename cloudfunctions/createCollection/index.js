// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('开始创建数据库集合...')
  
  const results = []
  
  // 创建schedules集合
  try {
    // 创建日程表
    await db.createCollection('schedules')
    results.push({ collection: 'schedules', status: 'created', message: '创建成功' })
    console.log('schedules集合创建成功')
  } catch (error) {
    console.log('schedules集合创建结果:', error.message)
    if (error.message && error.message.includes('already exists')) {
      results.push({ collection: 'schedules', status: 'exists', message: '集合已存在' })
    } else {
      results.push({ collection: 'schedules', status: 'error', message: error.message })
    }
  }
  
  // 创建operationRecords集合
  try {
    await db.createCollection('operationRecords')
    results.push({ collection: 'operationRecords', status: 'created', message: '创建成功' })
    console.log('operationRecords集合创建成功')
  } catch (error) {
    console.log('operationRecords集合创建结果:', error.message)
    if (error.message && error.message.includes('already exists')) {
      results.push({ collection: 'operationRecords', status: 'exists', message: '集合已存在' })
    } else {
      results.push({ collection: 'operationRecords', status: 'error', message: error.message })
    }
  }
  
  return {
    success: true,
    message: '集合创建任务完成',
    results: results,
    timestamp: new Date().toISOString()
  }
}