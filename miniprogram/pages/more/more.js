// pages/more/more.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    isLoggedIn: false,
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.updateUserInfo()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateUserInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 更新用户信息
  updateUserInfo() {
    const app = getApp()
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    })
  },
  
  // 菜单项点击
  handleMenuClick(e) {
    const id = e.currentTarget.dataset.id
    
    if (id === 'profile') {
      // 个人资料
      this.showDeveloping()
    } else if (id === 'settings') {
      // 设置
      this.showDeveloping()
    } else if (id === 'feedback') {
      // 意见反馈
      this.showDeveloping()
    } else if (id === 'about') {
      // 关于我们
      this.showDeveloping()
    }
  },
  
  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo')
          
          // 更新全局数据
          const app = getApp()
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false
          
          // 更新页面数据
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          
          // 跳转到登录页面
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  },
  
  // 显示开发中提示
  showDeveloping() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    })
  }
})