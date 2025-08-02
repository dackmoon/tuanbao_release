// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 创建操作记录
    const operationRecord = {
      ...event,
      _openid: openid,
      createdAt: new Date(),
      // 确保使用正确的时间字段
      operationTime: event.operationTime || new Date().toISOString()
    }

    // 尝试添加记录，如果集合不存在则先创建
    let result
    try {
      result = await db.collection('operationRecords').add({
        data: operationRecord
      })
    } catch (addError) {
      // 如果是集合不存在的错误，先创建集合再重试
      if (addError.errCode === -502005 || addError.message.includes('not exists')) {
        console.log('集合不存在，正在创建 operationRecords 集合...')
        
        try {
          // 创建集合
          await db.createCollection('operationRecords')
          console.log('operationRecords 集合创建成功')
          
          // 重新尝试添加记录
          result = await db.collection('operationRecords').add({
            data: operationRecord
          })
        } catch (createError) {
          console.error('创建集合失败:', createError)
          // 如果是集合已存在的错误，忽略并重试添加
          if (createError.errCode === -502002 || createError.message.includes('already exists')) {
            result = await db.collection('operationRecords').add({
              data: operationRecord
            })
          } else {
            throw createError
          }
        }
      } else {
        throw addError
      }
    }
    
    return {
      success: true,
      recordId: result._id,
      message: '操作记录创建成功'
    }
  } catch (error) {
    console.error('创建操作记录失败:', error)
    return {
      success: false,
      error: error.message || '创建操作记录失败'
    }
  }
}