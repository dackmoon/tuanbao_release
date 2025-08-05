// cloudfunctions/addMemo/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = wxContext.OPENID

  const { title, content, tag } = event

  // 验证必填字段
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
    const now = new Date()
    
    // 创建备忘录数据
    const memoData = {
      title: title.trim(),
      content: (content || '').trim(),
      tag: tag,
      userId: userId,
      createTime: now,
      updateTime: now
    }

    // 添加到数据库
    const result = await db.collection('memos').add({
      data: memoData
    })

    return {
      success: true,
      memoId: result._id,
      message: '备忘录添加成功'
    }
  } catch (error) {
    console.error('添加备忘录失败:', error)
    
    // 如果是集合不存在的错误，自动创建集合并重试
    if (error.errCode === -502005) {
      try {
        // 创建集合
        await db.createCollection('memos')
        console.log('memos集合创建成功')
        
        // 重新添加备忘录
        const now = new Date()
        const memoData = {
          title: title.trim(),
          content: (content || '').trim(),
          tag: tag,
          userId: userId,
          createTime: now,
          updateTime: now
        }

        const retryResult = await db.collection('memos').add({
          data: memoData
        })

        return {
          success: true,
          memoId: retryResult._id,
          message: '备忘录添加成功'
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
      error: '添加备忘录失败',
      errorDetail: error
    }
  }
}