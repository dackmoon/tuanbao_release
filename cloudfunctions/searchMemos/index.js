// cloudfunctions/searchMemos/index.js
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

  const { keyword } = event

  // 验证输入
  if (!keyword || !keyword.trim()) {
    return {
      success: false,
      error: '搜索关键词不能为空'
    }
  }

  const searchKeyword = keyword.trim()

  try {
    // 构建搜索条件 - 在标题和内容中搜索关键词
    const searchCondition = {
      userId: userId,
      $or: [
        {
          title: db.RegExp({
            regexp: searchKeyword,
            options: 'i'  // 不区分大小写
          })
        },
        {
          content: db.RegExp({
            regexp: searchKeyword,
            options: 'i'  // 不区分大小写
          })
        }
      ]
    }

    // 执行搜索
    const result = await db.collection('memos')
      .where(searchCondition)
      .orderBy('updateTime', 'desc')
      .get()

    return {
      success: true,
      data: result.data,
      count: result.data.length,
      keyword: searchKeyword
    }
  } catch (error) {
    console.error('搜索备忘录失败:', error)
    
    // 如果是集合不存在的错误
    if (error.errCode === -502005) {
      return {
        success: true,
        data: [],
        count: 0,
        keyword: searchKeyword,
        message: '暂无备忘录数据'
      }
    }

    // 如果是正则表达式不支持的错误，使用简单的文本匹配
    if (error.errCode === -502001 || error.message.includes('RegExp')) {
      try {
        console.log('正则表达式搜索失败，尝试简单匹配')
        
        // 获取所有用户的备忘录，然后在前端进行过滤
        const allMemosResult = await db.collection('memos')
          .where({
            userId: userId
          })
          .orderBy('updateTime', 'desc')
          .get()

        // 在云函数中进行简单的文本匹配
        const filteredMemos = allMemosResult.data.filter(memo => {
          const titleMatch = memo.title && memo.title.toLowerCase().includes(searchKeyword.toLowerCase())
          const contentMatch = memo.content && memo.content.toLowerCase().includes(searchKeyword.toLowerCase())
          return titleMatch || contentMatch
        })

        return {
          success: true,
          data: filteredMemos,
          count: filteredMemos.length,
          keyword: searchKeyword
        }
      } catch (fallbackError) {
        console.error('备用搜索方法也失败:', fallbackError)
        return {
          success: false,
          error: '搜索功能暂时不可用',
          errorDetail: fallbackError
        }
      }
    }

    return {
      success: false,
      error: '搜索备忘录失败',
      errorDetail: error
    }
  }
}