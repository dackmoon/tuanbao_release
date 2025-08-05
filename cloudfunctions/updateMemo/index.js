// cloudfunctions/updateMemo/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = wxContext.OPENID

  const { _id, title, content, tag } = event

  // 验证必填字段
  if (!_id) {
    return {
      success: false,
      error: '备忘录ID不能为空'
    }
  }

  if (!title || !title.trim()) {
    return {
      success: false,
      error: '标题不能为空'
    }
  }

  if (!tag) {
    return {
      success: false,
      error: '标签不能为空'
    }
  }

  // 验证标签值
  const validTags = ['red', 'yellow', 'blue', 'green', 'gray']
  if (!validTags.includes(tag)) {
    return {
      success: false,
      error: '无效的标签类型'
    }
  }

  try {
    // 首先检查备忘录是否存在且属于当前用户
    const checkResult = await db.collection('memos')
      .where({
        _id: _id,
        userId: userId
      })
      .get()

    if (checkResult.data.length === 0) {
      return {
        success: false,
        error: '备忘录不存在或无权限修改'
      }
    }

    // 更新备忘录数据
    const updateData = {
      title: title.trim(),
      content: (content || '').trim(),
      tag: tag,
      updateTime: new Date()
    }

    const result = await db.collection('memos')
      .doc(_id)
      .update({
        data: updateData
      })

    return {
      success: true,
      message: '备忘录更新成功',
      updated: result.stats.updated
    }
  } catch (error) {
    console.error('更新备忘录失败:', error)
    
    // 如果是集合不存在的错误
    if (error.errCode === -502005) {
      return {
        success: false,
        error: '备忘录数据不存在'
      }
    }

    return {
      success: false,
      error: '更新备忘录失败',
      errorDetail: error
    }
  }
}