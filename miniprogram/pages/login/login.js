// login.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname')
  },
  
  onLoad() {
    // 检查是否已登录
    const app = getApp()
    if (app.globalData.isLoggedIn) {
      this.navigateBack()
    }
  },
  
  // 获取微信用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        // 简化日志输出，避免复杂对象可能导致的问题
        console.log('获取用户信息成功')
        // 更新用户信息
        this.setData({
          "userInfo.avatarUrl": res.userInfo.avatarUrl,
          "userInfo.nickName": res.userInfo.nickName,
          hasUserInfo: true
        })
      },
      fail: (err) => {
        // 简化错误日志
        console.log('获取用户信息失败')
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },
  
  onChooseAvatar(e) {
    // 直接调用获取用户信息接口
    this.getUserProfile()
  },
  
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  
  login() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请设置头像和昵称',
        icon: 'none'
      })
      return
    }
    
    // 保存用户信息
    wx.setStorageSync('userInfo', this.data.userInfo)
    
    // 更新全局数据
    const app = getApp()
    app.globalData.userInfo = this.data.userInfo
    app.globalData.isLoggedIn = true
    
    // 返回上一页或首页
    this.navigateBack()
  },
  
  navigateBack() {
    // 如果有上一页，返回上一页，否则跳转到首页
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  }
}) 