// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取所有操作记录，按创建时间倒序排列（最新的在前面）
    let result
    try {
      result = await db.collection('operationRecords')
        .where({
          _openid: openid // 只获取当前用户的操作记录
        })
        .orderBy('operationTime', 'desc')
        .get()
    } catch (queryError) {
      // 如果是集合不存在的错误，先创建集合
      if (queryError.errCode === -502005 || queryError.message.includes('not exists')) {
        console.log('集合不存在，正在创建 operationRecords 集合...')
        
        try {
          // 创建集合
          await db.createCollection('operationRecords')
          console.log('operationRecords 集合创建成功')
          
          // 返回空结果，因为新创建的集合中没有数据
          return {
            success: true,
            data: [],
            total: 0
          }
        } catch (createError) {
          console.error('创建集合失败:', createError)
          // 如果是集合已存在的错误，重新查询
          if (createError.errCode === -502002 || createError.message.includes('already exists')) {
            result = await db.collection('operationRecords')
              .where({
                _openid: openid
              })
              .orderBy('operationTime', 'desc')
              .get()
          } else {
            throw createError
          }
        }
      } else {
        throw queryError
      }
    }
    
    // 处理结果，确保数据格式一致
    const operationRecords = result.data.map(item => {
      return {
        ...item,
        id: item.id || item._id // 如果没有id字段，使用_id
      }
    })
    
    return {
      success: true,
      data: operationRecords,
      total: operationRecords.length
    }
  } catch (error) {
    console.error('获取操作记录失败:', error)
    return {
      success: false,
      error: error.message || '获取操作记录失败'
    }
  }
}