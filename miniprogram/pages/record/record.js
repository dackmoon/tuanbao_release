// pages/record/record.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    isLoggedIn: false,
    moments: [],
    searchKeyword: '',
    isLoading: false,
    isRefreshing: false,
    loadAll: false,
    pageSize: 10,
    currentPage: 0,
    showCommentInput: false,
    currentMomentId: '',
    currentMomentIndex: -1,
    commentContent: '',
    showPublishModal: false,
    newMoment: {
      content: '',
      images: [],
      video: '',
      identity: ''
    },
    identities: {
      baby: {
        nickName: '团宝宝',
        avatarUrl: '/assert/icon/baby_avatar.png'
      },
      parent: {
        nickName: '团爸爸/团妈妈',
        avatarUrl: '/assert/icon/parent_avatar.png'
      },
      family: {
        nickName: '团家人',
        avatarUrl: '/assert/icon/family_avatar.png'
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkLoginStatus();
    this.loadMoments();
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
    this.refreshMoments();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loadAll && !this.data.isLoading) {
      this.loadMoreMoments();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '团宝儿的家园 - 动态',
      path: '/pages/record/record'
    }
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

    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 加载动态列表
  loadMoments() {
    if (this.data.isLoading) return;

    this.setData({
      isLoading: true,
      currentPage: 0,
      loadAll: false
    });

    const db = wx.cloud.database();
    const _ = db.command;
    const $ = _.aggregate;
    
    // 构建查询条件
    let query = {};
    if (this.data.searchKeyword) {
      query.content = db.RegExp({
        regexp: this.data.searchKeyword,
        options: 'i'
      });
    }

    db.collection('moments')
      .where(query)
      .orderBy('createTime', 'desc')
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const moments = res.data;
        
        if (moments.length < this.data.pageSize) {
          this.setData({ loadAll: true });
        }

        // 处理每条动态的时间显示和点赞状态
        const processedMoments = this.processMomentsData(moments);
        
        // 获取每条动态的点赞和评论信息
        this.fetchLikesAndComments(processedMoments);
      })
      .catch(err => {
        console.error('获取动态列表失败:', err);
        wx.showToast({
          title: '获取动态失败',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      });
  },

  // 加载更多动态
  loadMoreMoments() {
    if (this.data.isLoading || this.data.loadAll) return;

    this.setData({
      isLoading: true,
      currentPage: this.data.currentPage + 1
    });

    const db = wx.cloud.database();
    const _ = db.command;
    
    // 构建查询条件
    let query = {};
    if (this.data.searchKeyword) {
      query.content = db.RegExp({
        regexp: this.data.searchKeyword,
        options: 'i'
      });
    }

    db.collection('moments')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(this.data.currentPage * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const newMoments = res.data;
        
        if (newMoments.length < this.data.pageSize) {
          this.setData({ loadAll: true });
        }

        if (newMoments.length > 0) {
          // 处理每条动态的时间显示和点赞状态
          const processedMoments = this.processMomentsData(newMoments);
          
          // 获取每条动态的点赞和评论信息
          this.fetchLikesAndComments(processedMoments, true);
        } else {
          this.setData({ 
            isLoading: false,
            loadAll: true
          });
        }
      })
      .catch(err => {
        console.error('加载更多动态失败:', err);
        wx.showToast({
          title: '加载更多失败',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      });
  },

  // 刷新动态列表
  refreshMoments() {
    this.setData({
      isRefreshing: true,
      searchKeyword: ''
    });
    
    this.loadMoments();
    
    wx.stopPullDownRefresh();
  },

  // 处理动态数据
  processMomentsData(moments) {
    const now = new Date();
    
    return moments.map(item => {
      // 处理创建时间的显示
      const createTime = new Date(item.createTime);
      const diff = now - createTime;
      const minute = 1000 * 60;
      const hour = minute * 60;
      const day = hour * 24;
      
      let timeText = '';
      if (diff < minute) {
        timeText = '刚刚';
      } else if (diff < hour) {
        timeText = Math.floor(diff / minute) + '分钟前';
      } else if (diff < day) {
        timeText = Math.floor(diff / hour) + '小时前';
      } else if (diff < day * 30) {
        timeText = Math.floor(diff / day) + '天前';
      } else {
        const year = createTime.getFullYear();
        const month = createTime.getMonth() + 1;
        const date = createTime.getDate();
        timeText = `${year}-${month < 10 ? '0' + month : month}-${date < 10 ? '0' + date : date}`;
      }
      
      return {
        ...item,
        createTime: timeText,
        isLiked: false, // 默认未点赞，后续会更新
        likeCount: 0,
        commentCount: 0,
        likes: [],
        comments: []
      };
    });
  },

  // 获取点赞和评论信息
  fetchLikesAndComments(moments, isLoadMore = false) {
    const db = wx.cloud.database();
    const _ = db.command;
    const momentIds = moments.map(item => item._id);
    const userId = this.data.userId;
    
    // 获取点赞信息
    const likesPromise = db.collection('likes')
      .where({
        momentId: _.in(momentIds)
      })
      .get();
    
    // 获取评论信息
    const commentsPromise = db.collection('comments')
      .where({
        momentId: _.in(momentIds)
      })
      .orderBy('createTime', 'asc')
      .get();
    
    Promise.all([likesPromise, commentsPromise])
      .then(([likesRes, commentsRes]) => {
        const likes = likesRes.data;
        const comments = commentsRes.data;
        
        // 处理点赞和评论数据
        moments.forEach(moment => {
          // 处理点赞
          const momentLikes = likes.filter(like => like.momentId === moment._id);
          moment.likeCount = momentLikes.length;
          moment.isLiked = momentLikes.some(like => like.userId === userId);
          moment.likes = momentLikes;
          
          // 生成点赞文本
          if (momentLikes.length > 0) {
            const likeUsers = momentLikes.map(like => like.userInfo.nickName);
            moment.likesText = likeUsers.slice(0, 3).join('、');
            if (momentLikes.length > 3) {
              moment.likesText += `等${momentLikes.length}人`;
            }
          }
          
          // 处理评论
          const momentComments = comments.filter(comment => comment.momentId === moment._id);
          moment.commentCount = momentComments.length;
          moment.comments = momentComments;
        });
        
        // 更新数据
        if (isLoadMore) {
          this.setData({
            moments: [...this.data.moments, ...moments],
            isLoading: false
          });
        } else {
          this.setData({
            moments: moments,
            isLoading: false,
            isRefreshing: false
          });
        }
      })
      .catch(err => {
        console.error('获取点赞和评论信息失败:', err);
        
        // 即使获取点赞和评论失败，也显示动态列表
        if (isLoadMore) {
          this.setData({
            moments: [...this.data.moments, ...moments],
            isLoading: false
          });
        } else {
          this.setData({
            moments: moments,
            isLoading: false,
            isRefreshing: false
          });
        }
      });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  onSearch() {
    this.loadMoments();
  },

  // 显示发布动态弹窗
  showPublishModal() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showPublishModal: true,
      newMoment: {
        content: '',
        images: [],
        video: '',
        identity: ''
      }
    });
  },

  // 隐藏发布动态弹窗
  hidePublishModal() {
    this.setData({
      showPublishModal: false
    });
  },

  // 动态内容输入
  onContentInput(e) {
    this.setData({
      'newMoment.content': e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const count = 9 - this.data.newMoment.images.length;
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
              'newMoment.images': [...this.data.newMoment.images, ...fileIDs]
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
    if (this.data.newMoment.video) {
      wx.showToast({
        title: '只能选择一个视频',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.newMoment.images.length > 0) {
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
              'newMoment.video': res.fileID
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
    const images = [...this.data.newMoment.images];
    const deletedFileID = images.splice(index, 1)[0];
    
    // 从云存储中删除文件
    wx.cloud.deleteFile({
      fileList: [deletedFileID],
      success: res => {
        console.log('删除文件成功:', res);
      },
      fail: err => {
        console.error('删除文件失败:', err);
      }
    });
    
    this.setData({
      'newMoment.images': images
    });
  },

  // 删除视频
  deleteVideo() {
    const videoFileID = this.data.newMoment.video;
    
    // 从云存储中删除文件
    wx.cloud.deleteFile({
      fileList: [videoFileID],
      success: res => {
        console.log('删除文件成功:', res);
      },
      fail: err => {
        console.error('删除文件失败:', err);
      }
    });
    
    this.setData({
      'newMoment.video': ''
    });
  },

  // 选择身份
  selectIdentity(e) {
    const identity = e.currentTarget.dataset.identity;
    this.setData({
      'newMoment.identity': identity
    });
  },

  // 发布动态
  publishMoment() {
    if (!this.data.newMoment.content && this.data.newMoment.images.length === 0 && !this.data.newMoment.video) {
      wx.showToast({
        title: '请输入内容或上传图片/视频',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.newMoment.identity) {
      wx.showToast({
        title: '请选择身份',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '发布中...',
      mask: true
    });
    
    const db = wx.cloud.database();
    const selectedIdentity = this.data.identities[this.data.newMoment.identity];
    
    // 创建动态数据
    const momentData = {
      content: this.data.newMoment.content,
      images: this.data.newMoment.images,
      video: this.data.newMoment.video,
      userId: this.data.userId,
      identity: this.data.newMoment.identity,
      userInfo: {
        nickName: selectedIdentity.nickName,
        avatarUrl: selectedIdentity.avatarUrl
      },
      realUserInfo: {
        nickName: this.data.userInfo.nickName,
        avatarUrl: this.data.userInfo.avatarUrl
      },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };
    
    // 保存到云数据库
    db.collection('moments')
      .add({
        data: momentData
      })
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });
        
        this.setData({
          showPublishModal: false
        });
        
        // 刷新动态列表
        this.refreshMoments();
      })
      .catch(err => {
        console.error('发布动态失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        });
      });
  },

  // 点赞/取消点赞
  toggleLike(e) {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const momentId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const isLiked = this.data.moments[index].isLiked;
    
    const db = wx.cloud.database();
    
    if (isLiked) {
      // 取消点赞
      db.collection('likes')
        .where({
          momentId: momentId,
          userId: this.data.userId
        })
        .remove()
        .then(res => {
          // 更新本地数据
          const moments = [...this.data.moments];
          moments[index].isLiked = false;
          moments[index].likeCount--;
          
          // 更新点赞列表
          const likes = moments[index].likes.filter(like => like.userId !== this.data.userId);
          moments[index].likes = likes;
          
          // 更新点赞文本
          if (likes.length > 0) {
            const likeUsers = likes.map(like => like.userInfo.nickName);
            moments[index].likesText = likeUsers.slice(0, 3).join('、');
            if (likes.length > 3) {
              moments[index].likesText += `等${likes.length}人`;
            }
          } else {
            moments[index].likesText = '';
          }
          
          this.setData({
            moments: moments
          });
        })
        .catch(err => {
          console.error('取消点赞失败:', err);
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          });
        });
    } else {
      // 点赞
      db.collection('likes')
        .add({
          data: {
            momentId: momentId,
            userId: this.data.userId,
            userInfo: {
              nickName: this.data.userInfo.nickName,
              avatarUrl: this.data.userInfo.avatarUrl
            },
            createTime: db.serverDate()
          }
        })
        .then(res => {
          // 更新本地数据
          const moments = [...this.data.moments];
          moments[index].isLiked = true;
          moments[index].likeCount++;
          
          // 更新点赞列表
          const newLike = {
            _id: res._id,
            momentId: momentId,
            userId: this.data.userId,
            userInfo: {
              nickName: this.data.userInfo.nickName,
              avatarUrl: this.data.userInfo.avatarUrl
            }
          };
          moments[index].likes.push(newLike);
          
          // 更新点赞文本
          const likes = moments[index].likes;
          const likeUsers = likes.map(like => like.userInfo.nickName);
          moments[index].likesText = likeUsers.slice(0, 3).join('、');
          if (likes.length > 3) {
            moments[index].likesText += `等${likes.length}人`;
          }
          
          this.setData({
            moments: moments
          });
        })
        .catch(err => {
          console.error('点赞失败:', err);
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          });
        });
    }
  },

  // 显示评论输入框
  showCommentInput(e) {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const momentId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    this.setData({
      showCommentInput: true,
      currentMomentId: momentId,
      currentMomentIndex: index,
      commentContent: ''
    });
  },

  // 隐藏评论输入框
  hideCommentInput() {
    this.setData({
      showCommentInput: false,
      currentMomentId: '',
      currentMomentIndex: -1,
      commentContent: ''
    });
  },

  // 评论内容输入
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  // 提交评论
  submitComment() {
    if (!this.data.commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }
    
    const db = wx.cloud.database();
    
    // 创建评论数据
    const commentData = {
      momentId: this.data.currentMomentId,
      content: this.data.commentContent,
      userId: this.data.userId,
      userInfo: {
        nickName: this.data.userInfo.nickName,
        avatarUrl: this.data.userInfo.avatarUrl
      },
      createTime: db.serverDate()
    };
    
    // 保存到云数据库
    db.collection('comments')
      .add({
        data: commentData
      })
      .then(res => {
        // 更新本地数据
        const moments = [...this.data.moments];
        const index = this.data.currentMomentIndex;
        
        // 添加新评论
        const newComment = {
          _id: res._id,
          ...commentData,
          createTime: new Date()
        };
        moments[index].comments.push(newComment);
        moments[index].commentCount++;
        
        this.setData({
          moments: moments,
          showCommentInput: false,
          commentContent: ''
        });
        
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('评论失败:', err);
        wx.showToast({
          title: '评论失败',
          icon: 'none'
        });
      });
  },

  // 显示操作菜单
  showActionSheet(e) {
    const momentId = e.currentTarget.dataset.id;
    
    // 找到当前动态
    const moment = this.data.moments.find(item => item._id === momentId);
    
    // 判断是否为发布者
    const isPublisher = moment && moment.userId === this.data.userId;
    
    // 根据是否为发布者显示不同的操作选项
    const itemList = isPublisher ? ['编辑', '删除'] : ['删除'];
    
    wx.showActionSheet({
      itemList: itemList,
      success: res => {
        if (isPublisher) {
          // 发布者的操作
          if (res.tapIndex === 0) {
            // 编辑动态
            this.navigateToEdit(momentId);
          } else if (res.tapIndex === 1) {
            // 删除动态
            this.deleteMoment(momentId);
          }
        } else {
          // 非发布者只能删除
          if (res.tapIndex === 0) {
            // 删除动态
            this.deleteMoment(momentId);
          }
        }
      }
    });
  },

  // 跳转到编辑页面
  navigateToEdit(momentId) {
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${momentId}`
    });
  },

  // 删除动态
  deleteMoment(momentId) {
    wx.showModal({
      title: '提示',
      content: '确定要删除这条动态吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          const db = wx.cloud.database();
          const _ = db.command;
          
          // 删除动态
          db.collection('moments')
            .doc(momentId)
            .remove()
            .then(() => {
              // 删除相关的点赞和评论
              const deletePromises = [
                db.collection('likes').where({ momentId: momentId }).remove(),
                db.collection('comments').where({ momentId: momentId }).remove()
              ];
              
              return Promise.all(deletePromises);
            })
            .then(() => {
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 更新本地数据
              const moments = this.data.moments.filter(item => item._id !== momentId);
              this.setData({
                moments: moments
              });
            })
            .catch(err => {
              console.error('删除动态失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 跳转到动态详情页
  navigateToDetail(e) {
    const momentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/record/detail/detail?id=${momentId}`
    });
  },

  // 预览图片
  previewImage(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current;
    
    wx.previewImage({
      urls: urls,
      current: current
    });
  }
})