// app.js
App({
  onLaunch() {
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
