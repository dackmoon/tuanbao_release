// 云函数入口文件 - 检查数据库内容
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const result = {
      currentUser: openid,
      collections: {}
    }
    
    // 检查 schedules 集合
    try {
      const schedulesData = await db.collection('schedules').limit(5).get()
      result.collections.schedules = {
        exists: true,
        totalCount: schedulesData.data.length,
        sampleRecords: schedulesData.data.map(item => ({
          _id: item._id,
          _openid: item._openid || '没有_openid字段',
          openid: item.openid || '没有openid字段',
          title: item.title || '没有title字段',
          date: item.date || '没有date字段',
          allFields: Object.keys(item)
        }))
      }
    } catch (error) {
      result.collections.schedules = {
        exists: false,
        error: error.message
      }
    }
    
    // 检查 operationRecords 集合
    try {
      const operationsData = await db.collection('operationRecords').limit(5).get()
      result.collections.operationRecords = {
        exists: true,
        totalCount: operationsData.data.length,
        sampleRecords: operationsData.data.map(item => ({
          _id: item._id,
          _openid: item._openid || '没有_openid字段',
          openid: item.openid || '没有openid字段',
          title: item.title || '没有title字段',
          operationType: item.operationType || '没有operationType字段',
          allFields: Object.keys(item)
        }))
      }
    } catch (error) {
      result.collections.operationRecords = {
        exists: false,
        error: error.message
      }
    }
    
    return {
      success: true,
      message: '数据库检查完成',
      data: result
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}