// pages/record/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    momentId: '',
    moment: null,
    userInfo: null,
    isLoggedIn: false,
    userId: '',
    commentContent: '',
    commentFocus: false
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
    this.loadMomentDetail();
    wx.stopPullDownRefresh();
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
    const moment = this.data.moment;
    return {
      title: moment ? (moment.content.substring(0, 30) + (moment.content.length > 30 ? '...' : '')) : '团宝儿的家园 - 动态详情',
      path: `/pages/record/detail/detail?id=${this.data.momentId}`
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
        
        // 处理创建时间的显示
        const createTime = new Date(moment.createTime);
        const year = createTime.getFullYear();
        const month = createTime.getMonth() + 1;
        const date = createTime.getDate();
        const hour = createTime.getHours();
        const minute = createTime.getMinutes();
        moment.createTime = `${year}-${month < 10 ? '0' + month : month}-${date < 10 ? '0' + date : date} ${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
        
        // 初始化点赞和评论数据
        moment.isLiked = false;
        moment.likeCount = 0;
        moment.commentCount = 0;
        moment.likes = [];
        moment.comments = [];
        
        this.setData({
          moment: moment
        });
        
        // 获取点赞和评论信息
        this.fetchLikesAndComments();
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

  // 获取点赞和评论信息
  fetchLikesAndComments() {
    const db = wx.cloud.database();
    const _ = db.command;
    const momentId = this.data.momentId;
    const userId = this.data.userId;
    
    // 获取点赞信息
    const likesPromise = db.collection('likes')
      .where({
        momentId: momentId
      })
      .get();
    
    // 获取评论信息
    const commentsPromise = db.collection('comments')
      .where({
        momentId: momentId
      })
      .orderBy('createTime', 'asc')
      .get();
    
    Promise.all([likesPromise, commentsPromise])
      .then(([likesRes, commentsRes]) => {
        const likes = likesRes.data;
        const comments = commentsRes.data;
        
        // 处理点赞数据
        const moment = { ...this.data.moment };
        moment.likeCount = likes.length;
        moment.isLiked = likes.some(like => like.userId === userId);
        moment.likes = likes;
        
        // 生成点赞文本
        if (likes.length > 0) {
          const likeUsers = likes.map(like => like.userInfo.nickName);
          moment.likesText = likeUsers.join('、');
        }
        
        // 处理评论数据
        moment.commentCount = comments.length;
        
        // 格式化评论时间
        const formattedComments = comments.map(comment => {
          const createTime = new Date(comment.createTime);
          const year = createTime.getFullYear();
          const month = createTime.getMonth() + 1;
          const date = createTime.getDate();
          const hour = createTime.getHours();
          const minute = createTime.getMinutes();
          
          return {
            ...comment,
            createTimeFormatted: `${month < 10 ? '0' + month : month}-${date < 10 ? '0' + date : date} ${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`
          };
        });
        
        moment.comments = formattedComments;
        
        this.setData({
          moment: moment
        });
        
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取点赞和评论信息失败:', err);
        wx.hideLoading();
      });
  },

  // 点赞/取消点赞
  toggleLike() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const momentId = this.data.momentId;
    const isLiked = this.data.moment.isLiked;
    
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
          const moment = { ...this.data.moment };
          moment.isLiked = false;
          moment.likeCount--;
          
          // 更新点赞列表
          const likes = moment.likes.filter(like => like.userId !== this.data.userId);
          moment.likes = likes;
          
          // 更新点赞文本
          if (likes.length > 0) {
            const likeUsers = likes.map(like => like.userInfo.nickName);
            moment.likesText = likeUsers.join('、');
          } else {
            moment.likesText = '';
          }
          
          this.setData({
            moment: moment
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
          const moment = { ...this.data.moment };
          moment.isLiked = true;
          moment.likeCount++;
          
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
          moment.likes.push(newLike);
          
          // 更新点赞文本
          const likes = moment.likes;
          const likeUsers = likes.map(like => like.userInfo.nickName);
          moment.likesText = likeUsers.join('、');
          
          this.setData({
            moment: moment
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

  // 聚焦评论输入框
  focusCommentInput() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      commentFocus: true
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
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
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
      momentId: this.data.momentId,
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
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
        
        this.setData({
          commentContent: ''
        });
        
        // 重新加载评论
        this.fetchLikesAndComments();
      })
      .catch(err => {
        console.error('评论失败:', err);
        wx.showToast({
          title: '评论失败',
          icon: 'none'
        });
      });
  },

  // 删除评论
  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条评论吗？',
      success: res => {
        if (res.confirm) {
          const db = wx.cloud.database();
          
          db.collection('comments')
            .doc(commentId)
            .remove()
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 重新加载评论
              this.fetchLikesAndComments();
            })
            .catch(err => {
              console.error('删除评论失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 显示操作菜单
  showActionSheet() {
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: res => {
        if (res.tapIndex === 0) {
          // 编辑动态
          this.navigateToEdit();
        } else if (res.tapIndex === 1) {
          // 删除动态
          this.deleteMoment();
        }
      }
    });
  },

  // 跳转到编辑页面
  navigateToEdit() {
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${this.data.momentId}`
    });
  },

  // 删除动态
  deleteMoment() {
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
            .doc(this.data.momentId)
            .remove()
            .then(() => {
              // 删除相关的点赞和评论
              const deletePromises = [
                db.collection('likes').where({ momentId: this.data.momentId }).remove(),
                db.collection('comments').where({ momentId: this.data.momentId }).remove()
              ];
              
              return Promise.all(deletePromises);
            })
            .then(() => {
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 返回上一页
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
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