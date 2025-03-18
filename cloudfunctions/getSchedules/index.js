// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 获取年月参数，如果没有提供则获取当月
  const { year, month } = event
  
  try {
    let query = {}
    
    // 如果提供了年份和月份，则构建查询条件
    if (year && month) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      let endMonth = month + 1
      let endYear = year
      
      if (month === 12) {
        endMonth = 1
        endYear = year + 1
      }
      
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
      
      query = {
        date: _.gte(startDate).and(_.lt(endDate))
      }
    }
    
    // 查询数据库，不进行用户过滤，获取所有用户的行程
    // 如果只需要当前用户的行程，可以添加: _openid: openid
    const result = await db.collection('schedules').where(query).get()
    
    // 处理结果，将 _id 映射到 id 字段
    const schedules = result.data.map(item => {
      return {
        ...item,
        id: item.id || item._id // 如果没有id字段，使用_id
      }
    })
    
    return {
      success: true,
      data: schedules
    }
  } catch (error) {
    console.error('获取日程失败:', error)
    return {
      success: false,
      error: error
    }
  }
} 