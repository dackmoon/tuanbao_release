// cloudfunctions/getMemos/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = wxContext.OPENID

  try {
    // 查询当前用户的所有备忘录，按更新时间倒序排列
    const result = await db.collection('memos')
      .where({
        userId: userId
      })
      .orderBy('updateTime', 'desc')
      .get()

    return {
      success: true,
      data: result.data,
      count: result.data.length
    }
  } catch (error) {
    console.error('获取备忘录失败:', error)
    
    // 如果是集合不存在的错误，自动创建集合
    if (error.errCode === -502005) {
      try {
        // 创建集合
        await db.createCollection('memos')
        console.log('memos集合创建成功')
        
        // 重新查询（这时应该返回空数组）
        const retryResult = await db.collection('memos')
          .where({
            userId: userId
          })
          .orderBy('updateTime', 'desc')
          .get()

        return {
          success: true,
          data: retryResult.data,
          count: retryResult.data.length
        }
      } catch (createError) {
        console.error('创建memos集合失败:', createError)
        return {
          success: false,
          error: '数据库初始化失败',
          errorDetail: createError
        }
      }
    }

    return {
      success: false,
      error: '获取备忘录失败',
      errorDetail: error
    }
  }
}