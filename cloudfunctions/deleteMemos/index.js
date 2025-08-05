// cloudfunctions/deleteMemos/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = wxContext.OPENID

  const { memoIds } = event

  // 验证输入
  if (!memoIds || !Array.isArray(memoIds) || memoIds.length === 0) {
    return {
      success: false,
      error: '请选择要删除的备忘录'
    }
  }

  try {
    // 首先检查所有备忘录是否存在且属于当前用户
    const checkResult = await db.collection('memos')
      .where({
        _id: _.in(memoIds),
        userId: userId
      })
      .get()

    if (checkResult.data.length === 0) {
      return {
        success: false,
        error: '没有找到可删除的备忘录'
      }
    }

    // 如果找到的备忘录数量少于请求删除的数量，说明有些备忘录不存在或无权限
    if (checkResult.data.length < memoIds.length) {
      const foundIds = checkResult.data.map(item => item._id)
      const notFoundIds = memoIds.filter(id => !foundIds.includes(id))
      console.warn('部分备忘录不存在或无权限删除:', notFoundIds)
    }

    // 批量删除找到的备忘录
    let deletedCount = 0
    
    // 由于微信云数据库的批量删除限制，我们需要逐个删除
    for (const memo of checkResult.data) {
      try {
        await db.collection('memos').doc(memo._id).remove()
        deletedCount++
      } catch (deleteError) {
        console.error(`删除备忘录 ${memo._id} 失败:`, deleteError)
      }
    }

    return {
      success: true,
      message: `成功删除 ${deletedCount} 个备忘录`,
      deletedCount: deletedCount,
      requestedCount: memoIds.length
    }
  } catch (error) {
    console.error('批量删除备忘录失败:', error)
    
    // 如果是集合不存在的错误
    if (error.errCode === -502005) {
      return {
        success: false,
        error: '备忘录数据不存在'
      }
    }

    return {
      success: false,
      error: '删除备忘录失败',
      errorDetail: error
    }
  }
}