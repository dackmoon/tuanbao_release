// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取所有日程数据，按创建时间倒序排列（最新的在前面）
    // 这里暂时不进行用户过滤，如果需要只获取当前用户的日程，可以添加查询条件
    const result = await db.collection('schedules')
      .orderBy('_id', 'desc') // 按_id倒序，_id包含创建时间信息
      .get()
    
    // 处理结果，将 _id 映射到 id 字段
    const schedules = result.data.map(item => {
      return {
        ...item,
        id: item.id || item._id, // 如果没有id字段，使用_id
        createTime: item.createTime || item._id // 添加创建时间字段
      }
    })
    
    return {
      success: true,
      data: schedules,
      total: schedules.length
    }
  } catch (error) {
    console.error('获取所有日程失败:', error)
    return {
      success: false,
      error: error.message || '获取数据失败'
    }
  }
}