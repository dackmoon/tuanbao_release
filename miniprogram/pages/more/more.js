// pages/more/more.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    isLoggedIn: false,
    showProfileModal: false,
    tempUserInfo: {
      avatarUrl: '',
      nickName: ''
    }
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
    this.updateUserInfo()
    wx.stopPullDownRefresh()
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

  // 更新本地用户信息
  updateUserInfo() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || null
    const isLoggedIn = !!userInfo
    
    // 更新页面数据
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    })
    
    // 同步更新全局数据
    const app = getApp()
    app.globalData.userInfo = userInfo
    app.globalData.isLoggedIn = isLoggedIn
  },
  
  // 用户信息区域点击
  handleUserInfoClick() {
    // 检查是否已登录
    if (!this.data.isLoggedIn) {
      this.showLoginTip()
      return
    }
    
    // 显示个人资料修改弹窗
    this.setData({
      showProfileModal: true,
      tempUserInfo: {
        avatarUrl: this.data.userInfo.avatarUrl,
        nickName: this.data.userInfo.nickName
      }
    })
  },
  
  // 菜单项点击
  handleMenuClick(e) {
    const id = e.currentTarget.dataset.id
    
    if (id === 'profile') {
      // 个人资料
      if (!this.data.isLoggedIn) {
        this.showLoginTip()
        return
      }
      
      // 显示个人资料修改弹窗
      this.setData({
        showProfileModal: true,
        tempUserInfo: {
          avatarUrl: this.data.userInfo.avatarUrl,
          nickName: this.data.userInfo.nickName
        }
      })
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
  
  // 隐藏个人资料修改弹窗
  hideProfileModal() {
    this.setData({
      showProfileModal: false
    })
  },
  
  // 选择头像
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'tempUserInfo.avatarUrl': tempFilePath
        });
      }
    });
  },
  
  // 输入昵称
  onInputNickname(e) {
    this.setData({
      'tempUserInfo.nickName': e.detail.value
    })
  },
  
  // 保存用户资料
  saveUserProfile() {
    if (!this.data.tempUserInfo.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.tempUserInfo.avatarUrl) {
      wx.showToast({
        title: '请选择头像',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({
      title: '保存中...',
    })
    
    // 获取用户ID
    const app = getApp()
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    
    // 上传头像到云存储
    this.uploadAvatarToCloud(this.data.tempUserInfo.avatarUrl)
      .then(fileID => {
        // 更新用户信息
        const userInfo = {
          avatarUrl: fileID,
          nickName: this.data.tempUserInfo.nickName
        }
        
        // 保存用户信息到本地
        wx.setStorageSync('userInfo', userInfo)
        
        // 更新全局数据
        app.globalData.userInfo = userInfo
        
        // 调用云函数保存用户信息到云数据库
        return wx.cloud.callFunction({
          name: 'saveUserInfo',
          data: {
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            userId: userId
          }
        })
      })
      .then(res => {
        console.log('保存用户信息成功:', res)
        
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        })
        
        // 更新页面数据
        this.updateUserInfo()
        
        // 隐藏弹窗
        this.hideProfileModal()
      })
      .catch(err => {
        console.error('保存失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
      })
  },
  
  // 上传头像到云存储
  uploadAvatarToCloud(tempFilePath) {
    return new Promise((resolve, reject) => {
      // 检查文件路径是否有效
      if (!tempFilePath || typeof tempFilePath !== 'string') {
        console.error('无效的文件路径:', tempFilePath);
        // 如果路径无效，使用当前头像
        resolve(this.data.userInfo.avatarUrl);
        return;
      }
      
      // 如果头像URL已经是云存储的路径或网络图片，则直接返回
      if (tempFilePath.startsWith('cloud://') || tempFilePath.startsWith('http')) {
        resolve(tempFilePath);
        return;
      }
      
      // 检查文件是否存在
      wx.getFileInfo({
        filePath: tempFilePath,
        success: () => {
          // 文件存在，继续上传
          const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`;
          
          wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath,
            success: res => {
              resolve(res.fileID);
            },
            fail: err => {
              console.error('上传头像失败:', err);
              // 上传失败时保持原头像
              resolve(this.data.userInfo.avatarUrl);
            }
          });
        },
        fail: (err) => {
          console.error('文件不存在:', err);
          // 文件不存在时保持原头像
          resolve(this.data.userInfo.avatarUrl);
        }
      });
    });
  },
  
  // 退出登录
  logout() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip()
      return
    }
    
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('userId')
          
          // 更新全局数据
          const app = getApp()
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false
          app.globalData.userId = null
          
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
  },
  
  // 显示登录提示
  showLoginTip() {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})