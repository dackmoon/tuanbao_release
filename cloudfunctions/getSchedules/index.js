// 云函数入口文件
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
    // 如果提供了日期，则查询指定日期的日程
    if (event.date) {
      const result = await db.collection('schedules')
        .where({
          userId: userId,
          date: event.date
        })
        .orderBy('eventTime', 'asc')
        .get()
      
      return {
        success: true,
        data: result.data
      }
    } 
    // 如果提供了月份，则查询整个月的日程
    else if (event.year && event.month) {
      const year = event.year
      const month = event.month.toString().padStart(2, '0')
      
      // 构建日期范围查询
      const startDate = `${year}-${month}-01`
      const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
      const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
      const endDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-01`
      
      const result = await db.collection('schedules')
        .where({
          userId: userId,
          date: db.command.gte(startDate).and(db.command.lt(endDate))
        })
        .orderBy('date', 'asc')
        .orderBy('eventTime', 'asc')
        .get()
      
      return {
        success: true,
        data: result.data
      }
    }
    // 如果没有提供查询条件，则返回最近30天的日程
    else {
      const today = new Date()
      const year = today.getFullYear()
      const month = (today.getMonth() + 1).toString().padStart(2, '0')
      const day = today.getDate().toString().padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`
      
      // 30天后的日期
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const futureYear = futureDate.getFullYear()
      const futureMonth = (futureDate.getMonth() + 1).toString().padStart(2, '0')
      const futureDay = futureDate.getDate().toString().padStart(2, '0')
      const futureDateStr = `${futureYear}-${futureMonth}-${futureDay}`
      
      const result = await db.collection('schedules')
        .where({
          userId: userId,
          date: db.command.gte(todayStr).and(db.command.lte(futureDateStr))
        })
        .orderBy('date', 'asc')
        .orderBy('eventTime', 'asc')
        .get()
      
      return {
        success: true,
        data: result.data
      }
    }
  } catch (e) {
    return {
      success: false,
      message: e.message
    }
  }
} 