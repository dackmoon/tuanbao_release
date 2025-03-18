// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    colors: ['#FF9F43', '#FF6B6B', '#4834D4', '#6AB04C', '#686DE0', '#FF9F43'],
    // 轮播图数据
    swiperList: [
      {
        id: 1,
        imageUrl: 'https://7072-prod-1gra11xn834ed9aa-1347862742.tcb.qcloud.la/static/images/1.jpg?sign=99060d76ec47d076b677a9567c439c68&t=1742004122', // 图片地址预留，稍后手动修改
        
      },
      {
        id: 2,
        imageUrl: 'https://7072-prod-1gra11xn834ed9aa-1347862742.tcb.qcloud.la/static/images/2.jpg?sign=6b1dc781b314c9a840936d3f6fe7b2de&t=1742006305', // 图片地址预留，稍后手动修改
        
      },
      {
        id: 3,
        imageUrl: 'https://7072-prod-1gra11xn834ed9aa-1347862742.tcb.qcloud.la/static/images/3.jpg?sign=d5be03ca3e4a823838fc4b3bc233f855&t=1742006333', // 图片地址预留，稍后手动修改
        
      }
    ],
    // 近期行程数据
    upcomingSchedules: [],
    
    // AI对话相关
    chatMessages: [],
    inputMessage: '',
    isLoading: false,
    sessionId: '',
    // AI助手信息
    botInfo: {
      avatarUrl: 'https://636c-cloud1-0gpdzlered1eb63e-1347862742.tcb.qcloud.la/assert/icon/ai.png?sign=6651ef51cc03582cefe1c35b446fcdd6&t=1742275705',
      nickName: '团宝儿的助手',
    }
  },
  
  onLoad() {
    // 检查是否支持wx.getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取近期行程
    this.getUpcomingSchedules();
    
    // 为AI对话生成会话ID
    this.setData({
      sessionId: this.generateSessionId()
    });
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus()
    // 获取近期行程数据
    this.getUpcomingSchedules()
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    } else {
      // 已登录，更新用户信息
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },
  
  // 获取近期行程数据
  getUpcomingSchedules() {
    wx.showLoading({
      title: '加载中...',
    })
    
    // 调用云函数获取日程数据
    wx.cloud.callFunction({
      name: 'getSchedules',
      data: {},
      success: res => {
        console.log('获取日程成功', res)
        if (res.result && res.result.data) {
          // 处理日程数据，只保留未来7天内的日程
          const schedules = res.result.data || []
          const upcomingSchedules = this.processSchedules(schedules)
          
          this.setData({
            upcomingSchedules: upcomingSchedules
          })
        }
      },
      fail: err => {
        console.error('获取日程失败', err)
        wx.showToast({
          title: '获取日程失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },
  
  // 处理日程数据，筛选出未来7天内的日程并格式化
  processSchedules(schedules) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    
    // 筛选未来7天内的日程
    const filteredSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date)
      return scheduleDate >= today && scheduleDate < nextWeek
    })
    
    // 按日期排序
    filteredSchedules.sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    })
    
    // 不再限制只显示3条
    // const limitedSchedules = filteredSchedules.slice(0, 3)
    
    // 格式化日程数据
    return filteredSchedules.map(schedule => {
      const scheduleDate = new Date(schedule.date)
      const isToday = this.isSameDay(scheduleDate, today)
      
      return {
        id: schedule._id,
        title: schedule.title,
        time: schedule.eventTime || '全天',
        day: scheduleDate.getDate(),
        month: scheduleDate.getMonth() + 1,
        isToday: isToday
      }
    })
  },
  
  // 判断两个日期是否是同一天
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  },
  
  // 导航到指定页面
  navigateTo(e) {
    const page = e.currentTarget.dataset.page;
    // 简化日志输出
    console.log('导航到页面:', page);
    
    if (page === 'schedule') {
      wx.switchTab({
        url: '/pages/schedule/schedule'
      });
    } else if (page === 'record') {
      wx.switchTab({
        url: '/pages/record/record'
      });
    } else {
      // 对于非tabBar页面，使用navigateTo
      wx.navigateTo({
        url: `/pages/${page}/${page}`
      });
    }
  },
  
  // 显示开发中提示
  showDeveloping() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
  },
  
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  
  // 获取微信用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        // 更新用户信息
        const userInfo = res.userInfo
        
        // 保存到全局和本地存储
        const app = getApp()
        app.globalData.userInfo = userInfo
        app.globalData.isLoggedIn = true
        wx.setStorageSync('userInfo', userInfo)
        
        // 更新页面数据
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  
  onRefresh() {
    // 模拟刷新
    setTimeout(() => {
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
      this.setData({
        triggered: false
      });
    }, 1000);
  },
  
  // 为AI对话生成会话ID
  generateSessionId() {
    return 'session_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
  },
  
  // 处理输入框内容变化
  handleInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },
  
  // 发送消息到AI
  sendMessage() {
    const { inputMessage, chatMessages, userInfo, sessionId } = this.data;
    
    // 检查消息是否为空
    if (!inputMessage.trim()) {
      return;
    }
    
    // 检查用户是否已登录
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1000);
      
      return;
    }
    
    // 添加用户消息到聊天记录
    const newMessages = [...chatMessages, {
      type: 'user',
      content: inputMessage,
      time: new Date().getTime()
    }];
    
    // 清空输入框并显示加载状态
    this.setData({
      chatMessages: newMessages,
      inputMessage: '',
      isLoading: true
    });
    
    // 自动滚动到底部
    this.scrollToBottom();
    
    // 设置超时处理
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时，请稍后再试'));
      }, 10000); // 10秒超时
    });
    
    // 调用云函数获取AI回复
    const callFunctionPromise = new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'chatWithAI',
        data: {
          message: inputMessage,
          sessionId: sessionId
        },
        success: res => {
          resolve(res);
        },
        fail: err => {
          reject(err);
        }
      });
    });
    
    // 使用Promise.race竞争处理超时情况
    Promise.race([callFunctionPromise, timeoutPromise])
      .then(res => {
        console.log('AI回复成功', res);
        
        if (res.result && (res.result.response || res.result.reply)) {
          // 添加AI回复到聊天记录
          const aiReplyMessages = [...this.data.chatMessages, {
            type: 'bot',
            content: res.result.response || res.result.reply,
            time: new Date().getTime()
          }];
          
          this.setData({
            chatMessages: aiReplyMessages
          });
          
          // 自动滚动到底部
          this.scrollToBottom();
        } else {
          this.handleAIError('获取回复失败');
        }
      })
      .catch(err => {
        console.error('AI回复失败', err);
        this.handleAIError(err.message);
      })
      .finally(() => {
        this.setData({
          isLoading: false
        });
      });
  },
  
  // 处理AI响应错误
  handleAIError(errorMsg) {
    // 添加错误信息到聊天记录
    const errorMessages = [...this.data.chatMessages, {
      type: 'bot',
      content: '非常抱歉，我暂时无法回复，请稍后再试～',
      time: new Date().getTime(),
      isError: true
    }];
    
    this.setData({
      chatMessages: errorMessages
    });
    
    // 显示提示
    wx.showToast({
      title: errorMsg || '网络错误，请稍后再试',
      icon: 'none'
    });
    
    // 自动滚动到底部
    this.scrollToBottom();
  },
  
  // 滚动到聊天窗口底部
  scrollToBottom() {
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('#chat-container').boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec(res => {
        if (res && res[0] && res[1]) {
          wx.pageScrollTo({
            scrollTop: res[0].bottom,
            duration: 300
          });
        }
      });
    }, 100);
  },
})
