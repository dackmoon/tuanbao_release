// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 创建日程表
    await db.createCollection('schedules')
    return {
      success: true,
      message: '创建成功'
    }
  } catch (e) {
    // 如果集合已存在，会抛出错误，但这不影响使用
    return {
      success: false,
      message: e.message
    }
  }
} 