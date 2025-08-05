// pages/memo/memo.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchValue: '',        // 搜索框的值
    memoList: [],          // 备忘录列表
    isEditMode: false,     // 是否处于编辑模式
    selectedMemos: [],     // 选中的备忘录ID列表
    
    // 标签颜色映射
    tagColors: {
      red: '#FF6B6B',
      yellow: '#FFD93D',
      blue: '#4ECDC4',
      green: '#95E1D3',
      gray: '#A8A8A8'
    },
    
    // 标签名称映射
    tagNames: {
      red: '红色',
      yellow: '黄色',
      blue: '蓝色',
      green: '绿色',
      gray: '灰色'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('备忘录页面加载')
    this.loadMemoList()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时重新加载数据（可能从编辑页面返回）
    this.loadMemoList()
  },

  /**
   * 加载备忘录列表
   */
  loadMemoList() {
    wx.showLoading({
      title: '加载中...'
    })

    // 调用云函数获取备忘录列表
    wx.cloud.callFunction({
      name: 'getMemos',
      data: {},
      success: res => {
        console.log('获取备忘录列表成功:', res)
        if (res.result.success) {
          // 处理时间格式
          const memoList = res.result.data.map(memo => ({
            ...memo,
            updateTime: new Date(memo.updateTime)
          }))
          
          this.setData({
            memoList: memoList
          })
        } else {
          console.error('获取备忘录列表失败:', res.result.error)
          wx.showToast({
            title: res.result.error || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('调用getMemos云函数失败:', err)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  /**
   * 搜索输入事件
   */
  onSearchInput(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    
    // 如果搜索框被清空，重新加载所有备忘录
    if (!value.trim()) {
      this.loadMemoList()
    }
  },

  /**
   * 清除搜索并重新加载
   */
  clearSearch() {
    this.setData({
      searchValue: ''
    })
    this.loadMemoList()
  },

  /**
   * 执行搜索
   */
  performSearch() {
    const searchValue = this.data.searchValue.trim()
    
    if (!searchValue) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '搜索中...'
    })

    // 调用云函数进行搜索
    wx.cloud.callFunction({
      name: 'searchMemos',
      data: {
        keyword: searchValue
      },
      success: res => {
        console.log('搜索备忘录成功:', res)
        if (res.result.success) {
          // 处理时间格式
          const searchResults = res.result.data.map(memo => ({
            ...memo,
            updateTime: new Date(memo.updateTime)
          }))
          
          this.setData({
            memoList: searchResults
          })
          
          wx.showToast({
            title: `找到${res.result.count}个结果`,
            icon: 'success'
          })
        } else {
          console.error('搜索备忘录失败:', res.result.error)
          wx.showToast({
            title: res.result.error || '搜索失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('调用searchMemos云函数失败:', err)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.setData({
      isEditMode: !this.data.isEditMode,
      selectedMemos: [] // 清空选中状态
    })
  },

  /**
   * 选择/取消选择备忘录
   */
  toggleMemoSelection(e) {
    const memoId = e.currentTarget.dataset.id
    const selectedMemos = [...this.data.selectedMemos]
    
    const index = selectedMemos.indexOf(memoId)
    if (index > -1) {
      selectedMemos.splice(index, 1)
    } else {
      selectedMemos.push(memoId)
    }
    
    this.setData({
      selectedMemos
    })
  },

  /**
   * 批量删除选中的备忘录
   */
  deleteSelectedMemos() {
    const selectedMemos = this.data.selectedMemos
    
    if (selectedMemos.length === 0) {
      wx.showToast({
        title: '请选择要删除的备忘录',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除${selectedMemos.length}个备忘录吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          })

          // 调用云函数批量删除
          wx.cloud.callFunction({
            name: 'deleteMemos',
            data: {
              memoIds: selectedMemos
            },
            success: res => {
              console.log('批量删除备忘录成功:', res)
              if (res.result.success) {
                wx.showToast({
                  title: res.result.message || '删除成功',
                  icon: 'success'
                })

                // 退出编辑模式并重新加载数据
                this.setData({
                  isEditMode: false,
                  selectedMemos: []
                })
                this.loadMemoList()
              } else {
                console.error('批量删除备忘录失败:', res.result.error)
                wx.showToast({
                  title: res.result.error || '删除失败',
                  icon: 'none'
                })
              }
            },
            fail: err => {
              console.error('调用deleteMemos云函数失败:', err)
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              })
            },
            complete: () => {
              wx.hideLoading()
            }
          })
        }
      }
    })
  },

  /**
   * 跳转到添加备忘录页面
   */
  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/memo/edit/edit'
    })
  },

  /**
   * 跳转到编辑备忘录页面
   */
  navigateToEdit(e) {
    if (this.data.isEditMode) {
      // 编辑模式下点击是选择，不是跳转
      this.toggleMemoSelection(e)
      return
    }

    const memoId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/memo/edit/edit?id=${memoId}`
    })
  },

  /**
   * 格式化更新时间
   */
  formatUpdateTime(date) {
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    
    if (days === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    }
  }
})