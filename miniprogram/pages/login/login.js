// login.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '微信用户',
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
  
  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '用户隐私保护指引',
      content: '感谢您使用团宝儿的家园小程序。我们非常重视您的个人信息和隐私保护。为了更好地保障您的个人权益，在使用我们的产品前，请您认真阅读并了解《用户隐私保护指引》的全部内容。我们会收集您的微信头像、昵称等信息，用于为您提供更好的服务体验。',
      confirmText: '我知道了',
      showCancel: false
    })
  },
  
  // 处理用户授权结果
  onGetUserInfo(e) {
    console.log('授权结果:', e.detail)
    
    if (e.detail.userInfo) {
      // 用户同意授权
      wx.showLoading({
        title: '登录中...',
      })
      
      // 更新用户信息
      const userInfo = {
        avatarUrl: e.detail.userInfo.avatarUrl || defaultAvatarUrl,
        nickName: e.detail.userInfo.nickName || '微信用户'
      }
      
      // 保存用户信息到本地
      wx.setStorageSync('userInfo', userInfo)
      
      // 更新全局数据
      const app = getApp()
      app.globalData.userInfo = userInfo
      app.globalData.isLoggedIn = true
      
      // 调用云函数保存用户信息到云数据库
      wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: {
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickName
        },
        success: res => {
          console.log('保存用户信息成功:', res)
          // 保存用户ID到本地
          if (res.result && res.result.userId) {
            wx.setStorageSync('userId', res.result.userId)
            app.globalData.userId = res.result.userId
          }
          
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
        fail: err => {
          console.error('保存用户信息失败:', err)
          wx.hideLoading()
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          })
          
          // 即使云函数调用失败，也允许用户登录
          setTimeout(() => {
            this.navigateBack()
          }, 1500)
        }
      })
    } else {
      // 用户拒绝授权
      wx.showToast({
        title: '您已拒绝授权',
        icon: 'none'
      })
    }
  },
  
  // 取消登录，关闭小程序
  cancelLogin() {
    // 直接调用退出小程序API，必须在用户点击事件中直接调用
    wx.exitMiniProgram({
      success: () => {
        console.log('小程序已关闭')
      },
      fail: (err) => {
        console.error('关闭小程序失败:', err)
        // 如果关闭失败，提示用户手动关闭
        wx.showModal({
          title: '提示',
          content: '无法自动关闭小程序，请手动退出',
          showCancel: false
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