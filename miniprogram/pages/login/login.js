// login.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    isEnlarged: false
  },
  
  onLoad() {
    // 检查是否已登录
    const app = getApp()
    if (app.globalData.isLoggedIn) {
      this.navigateBack()
    }
  },
  
  // 切换logo大小
  toggleLogoSize() {
    this.setData({
      isEnlarged: !this.data.isEnlarged
    })
  },
  
  // 获取微信用户信息并登录
  getUserProfile() {
    wx.showLoading({
      title: '授权中...',
    })
    
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        console.log('获取用户信息成功')
        
        // 更新用户信息
        const userInfo = {
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName
        }
        
        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo)
        
        // 更新全局数据
        const app = getApp()
        app.globalData.userInfo = userInfo
        app.globalData.isLoggedIn = true
        
        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          this.navigateBack()
        }, 1500)
      },
      fail: (err) => {
        console.log('获取用户信息失败', err)
        wx.hideLoading()
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        })
      }
    })
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