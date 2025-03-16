// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        // 此处请填入环境 ID, 环境 ID 可打开云控制台查看
        // 如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-0gpdzlered1eb63e', // 替换为你的环境ID
        traceUser: true,
      })
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    
    // 检查是否已登录
    this.checkLoginStatus()
  },

  onHide() {
    // 不再在页面隐藏时清除用户信息，保持登录状态
    // 如果需要退出登录，应该提供专门的退出登录功能
  },  

  onShow() {
    // 检查登录状态，但不自动跳转，避免循环跳转
    this.checkLoginStatus()
  },

  // 检查登录状态的方法
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    } else {
      this.globalData.isLoggedIn = false
      // 不在这里直接跳转，而是在页面中根据需要判断
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false
  }
})
