// pages/record/edit/edit.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    momentId: '',
    moment: {
      content: '',
      images: [],
      video: ''
    },
    userInfo: null,
    isLoggedIn: false,
    userId: '',
    originalImages: [], // 用于记录原始图片，以便比较删除了哪些
    originalVideo: '' // 用于记录原始视频，以便比较是否删除
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({
        momentId: options.id
      });
      
      this.checkLoginStatus();
      this.loadMomentDetail();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
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
    this.checkLoginStatus();
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

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = app.globalData.isLoggedIn;
    const userId = app.globalData.userId;

    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn,
      userId: userId
    });
  },

  // 加载动态详情
  loadMomentDetail() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const db = wx.cloud.database();
    
    // 获取动态详情
    db.collection('moments')
      .doc(this.data.momentId)
      .get()
      .then(res => {
        const moment = res.data;
        
        if (!moment) {
          wx.hideLoading();
          wx.showToast({
            title: '动态不存在',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          return;
        }
        
        // 检查是否是动态发布者
        if (moment.userId !== this.data.userId) {
          wx.hideLoading();
          wx.showToast({
            title: '无权编辑该动态',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          return;
        }
        
        // 保存原始媒体文件信息
        this.setData({
          moment: {
            content: moment.content,
            images: moment.images || [],
            video: moment.video || ''
          },
          originalImages: [...(moment.images || [])],
          originalVideo: moment.video || ''
        });
        
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取动态详情失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '获取详情失败',
          icon: 'none'
        });
      });
  },

  // 动态内容输入
  onContentInput(e) {
    this.setData({
      'moment.content': e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const count = 9 - this.data.moment.images.length;
    if (count <= 0) {
      wx.showToast({
        title: '最多选择9张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths;
        
        // 显示上传中
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传图片到云存储
        const uploadTasks = tempFilePaths.map(filePath => {
          const cloudPath = `moments/${this.data.userId}/${Date.now()}_${Math.random().toString(36).substr(2)}.${filePath.match(/\.(\w+)$/)[1]}`;
          return wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: filePath
          });
        });
        
        Promise.all(uploadTasks)
          .then(results => {
            const fileIDs = results.map(res => res.fileID);
            
            this.setData({
              'moment.images': [...this.data.moment.images, ...fileIDs]
            });
            
            wx.hideLoading();
          })
          .catch(err => {
            console.error('上传图片失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '上传图片失败',
              icon: 'none'
            });
          });
      }
    });
  },

  // 选择视频
  chooseVideo() {
    if (this.data.moment.video) {
      wx.showToast({
        title: '只能选择一个视频',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.moment.images.length > 0) {
      wx.showToast({
        title: '不能同时选择图片和视频',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: res => {
        const tempFilePath = res.tempFilePath;
        
        // 显示上传中
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传视频到云存储
        const cloudPath = `moments/${this.data.userId}/${Date.now()}_${Math.random().toString(36).substr(2)}.mp4`;
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: res => {
            this.setData({
              'moment.video': res.fileID
            });
            wx.hideLoading();
          },
          fail: err => {
            console.error('上传视频失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '上传视频失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.moment.images];
    const deletedFileID = images.splice(index, 1)[0];
    
    // 如果是新上传的图片，从云存储中删除
    if (!this.data.originalImages.includes(deletedFileID)) {
      wx.cloud.deleteFile({
        fileList: [deletedFileID],
        success: res => {
          console.log('删除文件成功:', res);
        },
        fail: err => {
          console.error('删除文件失败:', err);
        }
      });
    }
    
    this.setData({
      'moment.images': images
    });
  },

  // 删除视频
  deleteVideo() {
    const videoFileID = this.data.moment.video;
    
    // 如果是新上传的视频，从云存储中删除
    if (videoFileID !== this.data.originalVideo) {
      wx.cloud.deleteFile({
        fileList: [videoFileID],
        success: res => {
          console.log('删除文件成功:', res);
        },
        fail: err => {
          console.error('删除文件失败:', err);
        }
      });
    }
    
    this.setData({
      'moment.video': ''
    });
  },

  // 取消编辑
  cancelEdit() {
    // 如果有新上传的图片，需要删除
    const newImages = this.data.moment.images.filter(image => !this.data.originalImages.includes(image));
    if (newImages.length > 0) {
      wx.cloud.deleteFile({
        fileList: newImages,
        success: res => {
          console.log('删除新上传图片成功:', res);
        },
        fail: err => {
          console.error('删除新上传图片失败:', err);
        }
      });
    }
    
    // 如果有新上传的视频，需要删除
    if (this.data.moment.video && this.data.moment.video !== this.data.originalVideo) {
      wx.cloud.deleteFile({
        fileList: [this.data.moment.video],
        success: res => {
          console.log('删除新上传视频成功:', res);
        },
        fail: err => {
          console.error('删除新上传视频失败:', err);
        }
      });
    }
    
    wx.navigateBack();
  },

  // 保存编辑
  saveEdit() {
    if (!this.data.moment.content && this.data.moment.images.length === 0 && !this.data.moment.video) {
      wx.showToast({
        title: '请输入内容或上传图片/视频',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    const db = wx.cloud.database();
    
    // 需要删除的原始图片
    const deletedImages = this.data.originalImages.filter(image => !this.data.moment.images.includes(image));
    if (deletedImages.length > 0) {
      wx.cloud.deleteFile({
        fileList: deletedImages,
        success: res => {
          console.log('删除原始图片成功:', res);
        },
        fail: err => {
          console.error('删除原始图片失败:', err);
        }
      });
    }
    
    // 需要删除的原始视频
    if (this.data.originalVideo && this.data.originalVideo !== this.data.moment.video) {
      wx.cloud.deleteFile({
        fileList: [this.data.originalVideo],
        success: res => {
          console.log('删除原始视频成功:', res);
        },
        fail: err => {
          console.error('删除原始视频失败:', err);
        }
      });
    }
    
    // 更新动态数据
    db.collection('moments')
      .doc(this.data.momentId)
      .update({
        data: {
          content: this.data.moment.content,
          images: this.data.moment.images,
          video: this.data.moment.video,
          updateTime: db.serverDate()
        }
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('保存动态失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      });
  }
}) 