// pages/memo/edit/edit.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,        // 是否为编辑模式（true: 编辑现有备忘录, false: 新增备忘录）
    memoId: '',          // 备忘录ID（编辑模式下使用）
    
    // 表单数据
    title: '',           // 标题
    selectedTag: '',     // 选中的标签
    selectedTagColor: '', // 选中标签的颜色
    content: '',         // 内容
    
    // 标签选项
    tagOptions: [
      { value: 'red', label: '红色', color: '#FF6B6B' },
      { value: 'yellow', label: '黄色', color: '#FFD93D' },
      { value: 'blue', label: '蓝色', color: '#4ECDC4' },
      { value: 'green', label: '绿色', color: '#95E1D3' },
      { value: 'gray', label: '灰色', color: '#A8A8A8' }
    ],
    
    showTagPicker: false,  // 是否显示标签选择器
    
    // 保存按钮状态
    canSave: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('编辑页面加载，参数:', options)
    
    if (options.id) {
      // 编辑模式
      this.setData({
        isEdit: true,
        memoId: options.id
      })
      this.loadMemoData(options.id)
    } else {
      // 新增模式，不设置默认标签，让用户主动选择
      this.validateForm()
    }
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: options.id ? '编辑备忘录' : '新建备忘录'
    })
  },

  /**
   * 加载备忘录数据（编辑模式）
   */
  loadMemoData(memoId) {
    wx.showLoading({
      title: '加载中...'
    })

    // 调用云函数获取所有备忘录，然后查找指定的备忘录
    wx.cloud.callFunction({
      name: 'getMemos',
      data: {},
      success: res => {
        console.log('获取备忘录列表成功:', res)
        if (res.result.success) {
          const memo = res.result.data.find(item => item._id === memoId)
          
          if (memo) {
            // 找到对应的标签颜色
            const tagInfo = this.data.tagOptions.find(item => item.value === memo.tag)
            const tagColor = tagInfo ? tagInfo.color : ''
            
            this.setData({
              title: memo.title,
              content: memo.content,
              selectedTag: memo.tag,
              selectedTagColor: tagColor
            })
            this.validateForm()
          } else {
            wx.showToast({
              title: '备忘录不存在',
              icon: 'none'
            })
            // 延迟返回上一页
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        } else {
          console.error('获取备忘录失败:', res.result.error)
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
   * 标题输入事件
   */
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
    this.validateForm()
  },

  /**
   * 显示标签选择器
   */
  showTagSelector() {
    this.setData({
      showTagPicker: true
    })
  },

  /**
   * 隐藏标签选择器
   */
  hideTagSelector() {
    this.setData({
      showTagPicker: false
    })
  },

  /**
   * 选择标签
   */
  selectTag(e) {
    const tag = e.currentTarget.dataset.tag
    console.log('选择的标签值:', tag)
    
    // 找到对应的标签颜色
    const tagInfo = this.data.tagOptions.find(item => item.value === tag)
    const tagColor = tagInfo ? tagInfo.color : ''
    
    console.log('找到的标签信息:', tagInfo)
    console.log('标签颜色:', tagColor)
    
    this.setData({
      selectedTag: tag,
      selectedTagColor: tagColor,
      showTagPicker: false
    }, () => {
      // setData完成后的回调
      console.log('setData完成后 selectedTag:', this.data.selectedTag)
      console.log('setData完成后 selectedTagColor:', this.data.selectedTagColor)
    })
    
    this.validateForm()
  },

  /**
   * 内容输入事件
   */
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { title, selectedTag } = this.data
    const canSave = title.trim() !== '' && selectedTag !== ''
    
    this.setData({
      canSave
    })
  },

  /**
   * 保存备忘录
   */
  saveMemo() {
    if (!this.data.canSave) {
      this.showValidationError()
      return
    }

    const { title, selectedTag, content, isEdit, memoId } = this.data
    
    wx.showLoading({
      title: '保存中...'
    })

    const memoData = {
      title: title.trim(),
      tag: selectedTag,
      content: content.trim()
    }

    if (isEdit) {
      memoData._id = memoId
    }

    // 调用相应的云函数保存备忘录
    const functionName = isEdit ? 'updateMemo' : 'addMemo'
    
    wx.cloud.callFunction({
      name: functionName,
      data: memoData,
      success: res => {
        console.log(`${functionName}云函数调用成功:`, res)
        if (res.result.success) {
          wx.showToast({
            title: isEdit ? '修改成功' : '添加成功',
            icon: 'success'
          })

          // 返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          console.error(`${functionName}失败:`, res.result.error)
          wx.showToast({
            title: res.result.error || '保存失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error(`调用${functionName}云函数失败:`, err)
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
   * 显示验证错误提示
   */
  showValidationError() {
    if (this.data.title.trim() === '') {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }
    
    if (this.data.selectedTag === '') {
      wx.showToast({
        title: '请选择标签',
        icon: 'none'
      })
      return
    }
  },

  /**
   * 取消编辑
   */
  cancelEdit() {
    wx.showModal({
      title: '确认取消',
      content: '是否放弃当前编辑的内容？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  },

  /**
   * 获取选中标签的显示信息
   */
  getSelectedTagInfo() {
    // 只返回实际选中的标签，不返回默认值
    return this.data.tagOptions.find(item => item.value === this.data.selectedTag) || null
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 防止点击选择器背景时关闭
  }
})