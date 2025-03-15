// pages/schedule/schedule.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    year: 2023,
    month: 5,
    pickerDate: '', // 用于 picker 的日期字符串 (YYYY-MM)
    selectedDate: '',
    formattedDate: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    scheduleList: [],
    showAddOptions: false,
    showSingleAdd: false,
    showBatchAdd: false,
    newSchedule: '',
    batchSchedule: '',
    nextId: 1,
    scheduleDates: {}, // 存储有日程的日期
    dayEvents: [],
    showYearMonthPicker: false,
    yearRange: [],
    yearArray: [],
    monthArray: [],
    yearIndex: 10, // 默认选中当前年份
    monthIndex: 0, // 默认选中当前月份
    eventContent: '',
    eventDesc: '',
    startTime: '08:00',
    endTime: '09:00',
    startDate: '',
    endDate: '',
    nextEventId: 100,
    events: [], // 添加这一行，初始化为空数组
    eventTime: '12:00',
    batchEventTime: '12:00', // 批量添加的时间
    editingEventId: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // 生成年份数组（当前年份前后10年）
    const yearArray = [];
    for (let i = year - 10; i <= year + 10; i++) {
      yearArray.push(i + '年');
    }
    
    // 生成月份数组
    const monthArray = [];
    for (let i = 1; i <= 12; i++) {
      monthArray.push(i + '月');
    }
    
    // 设置当前日期为选中日期
    const today = new Date();
    const formattedDate = this.formatDisplayDate(today);
    
    this.setData({
      year,
      month,
      yearArray,
      monthArray,
      yearIndex: 10,  // 默认选中当前年份（数组中间位置）
      monthIndex: month - 1,  // 默认选中当前月份
      selectedDate: formattedDate,
      formattedDate: formattedDate
    });
    
    // 从本地存储加载事件数据
    const events = wx.getStorageSync('events') || [];
    let nextEventId = 100;
    if (events.length > 0) {
      // 找出最大的ID值，用于新事件的ID生成
      nextEventId = Math.max(...events.map(event => event.id)) + 1;
    }
    
    this.setData({
      events,
      nextEventId
    });
    
    // 生成日历并加载当天的事件
    this.generateCalendar(year, month);
    
    // 设置默认的开始和结束日期
    const formattedDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    this.setData({
      startDate: formattedDateStr,
      endDate: formattedDateStr
    });
    
    // 加载当天的事件
    this.getEventsForDay(formattedDateStr);
  },

  /**
   * 格式化日期为YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化显示日期
   */
  formatDisplayDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}年${month}月${day}日`;
  },

  /**
   * 月份选择器变化
   */
  onMonthChange(e) {
    console.log('月份选择器变化');
    const value = e.detail.value; // 格式为 "YYYY-MM"
    const [yearStr, monthStr] = value.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    
    this.setData({
      year,
      month,
      pickerDate: value
    });
    
    // 重新生成日历
    this.generateCalendar(year, month);
    
    // 如果当前选中的日期不在新的月份中，则选中新月份的第一天
    const currentSelectedDate = new Date(this.data.selectedDate);
    if (currentSelectedDate.getFullYear() !== year || currentSelectedDate.getMonth() !== month - 1) {
      const newSelectedDate = this.formatDate(new Date(year, month - 1, 1));
      this.setData({
        selectedDate: newSelectedDate,
        formattedDate: this.formatDisplayDate(new Date(newSelectedDate))
      });
      
      // 加载选中日期的日程
      this.loadScheduleData();
    }
  },

  /**
   * 上个月
   */
  prevMonth() {
    let year = this.data.year;
    let month = this.data.month - 1;
    
    if (month < 1) {
      year--;
      month = 12;
    }
    
    const monthStr = month.toString().padStart(2, '0');
    const pickerDate = `${year}-${monthStr}`;
    
    this.setData({
      year,
      month,
      pickerDate
    });
    
    this.generateCalendar(year, month);
  },

  /**
   * 下个月
   */
  nextMonth() {
    let year = this.data.year;
    let month = this.data.month + 1;
    
    if (month > 12) {
      year++;
      month = 1;
    }
    
    const monthStr = month.toString().padStart(2, '0');
    const pickerDate = `${year}-${monthStr}`;
    
    this.setData({
      year,
      month,
      pickerDate
    });
    
    this.generateCalendar(year, month);
  },

  /**
   * 生成日历数据
   */
  generateCalendar(year, month) {
    const days = [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      days.push({
        day: '',
        current: false,
        hasEvent: false,
        selected: false
      });
    }
    
    // 填充日期
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const hasEvent = this.checkHasEvent(dateStr);
      
      days.push({
        day: i,
        current: year === currentYear && month === currentMonth && i === currentDay,
        hasEvent: hasEvent,
        selected: false
      });
    }
    
    // 更新选中状态
    if (this.data.selectedDate) {
      const selectedDateObj = new Date(this.data.selectedDate.replace(/(\d+)年(\d+)月(\d+)日/, '$1-$2-$3'));
      if (!isNaN(selectedDateObj.getTime()) && selectedDateObj.getFullYear() === year && selectedDateObj.getMonth() + 1 === month) {
        const selectedDay = selectedDateObj.getDate();
        const firstDayIndex = firstDay; // 日历中第一个日期的索引
        const selectedDayIndex = firstDayIndex + selectedDay - 1; // 选中日期的索引
        
        if (days[selectedDayIndex]) {
          days[selectedDayIndex].selected = true;
        }
      }
    }
    
    this.setData({ days });
  },

  /**
   * 检查日期是否有事件
   */
  checkHasEvent(dateStr) {
    // 检查是否有事件
    return this.data.events.some(event => event.date === dateStr);
  },

  /**
   * 加载所有日程数据的日期标记
   */
  loadScheduleDates() {
    // 获取所有本地存储的键
    const keys = wx.getStorageInfoSync().keys;
    const scheduleDates = {};
    
    // 筛选出日程相关的键
    keys.forEach(key => {
      if (key.startsWith('schedule_')) {
        const date = key.replace('schedule_', '');
        const schedules = wx.getStorageSync(key);
        if (schedules && schedules.length > 0) {
          scheduleDates[date] = true;
        }
      }
    });
    
    this.setData({
      scheduleDates
    });
    
    // 更新日历上的标记
    this.updateCalendarMarkers();
  },

  /**
   * 更新日历上的标记
   */
  updateCalendarMarkers() {
    const daysArray = this.data.days.map(item => {
      if (item.day) {
        return {
          ...item,
          hasEvent: this.data.scheduleDates[`${this.data.year}-${this.data.month}-${item.day}`] || false
        };
      }
      return item;
    });
    
    this.setData({
      days: daysArray
    });
  },

  /**
   * 点击选择日历中的某一天
   */
  selectDay(e) {
    const { day, index } = e.currentTarget.dataset;
    
    if (!day) return;
    
    const dateStr = `${this.data.year}年${this.data.month}月${day}日`;
    const fullDateStr = `${this.data.year}-${this.data.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    this.setData({
      selectedDate: dateStr,
      formattedDate: this.formatDisplayDate(new Date(fullDateStr))
    });
    
    this.updateSelectedDay(day);
    this.getEventsForDay(fullDateStr);
  },

  /**
   * 更新选中的日期
   */
  updateSelectedDay(day) {
    const { days } = this.data;
    
    const updatedDays = days.map(item => {
      return {
        ...item,
        selected: item.day === day
      };
    });
    
    this.setData({ days: updatedDays });
  },

  /**
   * 获取某天的事件
   */
  getEventsForDay(dateStr) {
    const dayEvents = this.data.events.filter(event => event.date === dateStr);
    
    this.setData({ dayEvents });
  },

  /**
   * 加载日程数据
   */
  loadScheduleData() {
    // 从本地存储获取数据
    const scheduleList = wx.getStorageSync(`schedule_${this.data.selectedDate}`) || [];
    let nextId = 1;
    if (scheduleList.length > 0) {
      nextId = Math.max(...scheduleList.map(item => item.id)) + 1;
    }
    this.setData({
      scheduleList,
      nextId
    });
  },

  /**
   * 显示添加选项
   */
  showAddOptions() {
    this.setData({
      showAddOptions: true
    });
  },

  /**
   * 隐藏所有弹出层
   */
  hideAllPopups() {
    this.setData({
      showAddOptions: false,
      showSingleAdd: false,
      showBatchAdd: false
    });
  },

  /**
   * 隐藏添加选项弹窗
   */
  hideAddOptions() {
    this.setData({
      showAddOptions: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    return;
  },

  /**
   * 显示单个添加
   */
  showAddSingle() {
    this.setData({
      showAddOptions: false,
      showSingleAdd: true,
      eventContent: '',
      eventDesc: '',
      eventTime: '12:00'
    });
  },

  /**
   * 隐藏单个添加
   */
  hideSingleAdd() {
    this.setData({
      showSingleAdd: false,
      editingEventId: null // 清除编辑状态
    });
  },

  /**
   * 显示批量添加
   */
  showAddBatch() {
    this.setData({
      showAddOptions: false,
      showBatchAdd: true,
      eventContent: '',
      eventDesc: '',
      batchEventTime: '12:00'
    });
  },

  /**
   * 隐藏批量添加
   */
  hideBatchAdd() {
    this.setData({
      showBatchAdd: false
    });
  },

  /**
   * 取消添加
   */
  cancelAdd() {
    this.setData({
      showSingleAdd: false,
      showBatchAdd: false,
      editingEventId: null
    });
  },

  /**
   * 输入变化
   */
  onInputChange(e) {
    this.setData({
      newSchedule: e.detail.value
    });
  },

  /**
   * 批量输入变化
   */
  onBatchInputChange(e) {
    this.setData({
      batchSchedule: e.detail.value
    });
  },

  /**
   * 保存日程
   */
  saveSchedule() {
    if (!this.data.newSchedule.trim()) {
      wx.showToast({
        title: '请输入日程内容',
        icon: 'none'
      });
      return;
    }

    const newItem = {
      id: this.data.nextId,
      content: this.data.newSchedule,
      date: this.data.selectedDate,
      completed: false
    };

    const scheduleList = [...this.data.scheduleList, newItem];
    
    this.setData({
      scheduleList,
      nextId: this.data.nextId + 1,
      showSingleAdd: false,
      newSchedule: ''
    });

    // 保存到本地存储
    wx.setStorageSync(`schedule_${this.data.selectedDate}`, scheduleList);
    
    // 更新日程日期标记
    this.updateScheduleDateMarker(this.data.selectedDate, true);

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  /**
   * 批量保存日程
   */
  saveBatchSchedule() {
    if (!this.data.batchSchedule.trim()) {
      wx.showToast({
        title: '请输入日程内容',
        icon: 'none'
      });
      return;
    }

    const lines = this.data.batchSchedule.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      wx.showToast({
        title: '请输入有效内容',
        icon: 'none'
      });
      return;
    }

    let nextId = this.data.nextId;
    const newItems = lines.map(line => {
      return {
        id: nextId++,
        content: line.trim(),
        date: this.data.selectedDate,
        completed: false
      };
    });

    const scheduleList = [...this.data.scheduleList, ...newItems];
    
    this.setData({
      scheduleList,
      nextId,
      showBatchAdd: false,
      batchSchedule: ''
    });

    // 保存到本地存储
    wx.setStorageSync(`schedule_${this.data.selectedDate}`, scheduleList);
    
    // 更新日程日期标记
    this.updateScheduleDateMarker(this.data.selectedDate, true);

    wx.showToast({
      title: `成功添加${newItems.length}条日程`,
      icon: 'success'
    });
  },

  /**
   * 删除日程
   */
  deleteSchedule(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条日程吗？',
      success: (res) => {
        if (res.confirm) {
          const scheduleList = this.data.scheduleList.filter(item => item.id !== id);
          
          this.setData({
            scheduleList
          });

          // 保存到本地存储
          wx.setStorageSync(`schedule_${this.data.selectedDate}`, scheduleList);
          
          // 如果删除后没有日程了，更新日期标记
          if (scheduleList.length === 0) {
            this.updateScheduleDateMarker(this.data.selectedDate, false);
          }

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 更新日程日期标记
   */
  updateScheduleDateMarker(date, hasSchedule) {
    const scheduleDates = this.data.scheduleDates;
    scheduleDates[date] = hasSchedule;
    
    this.setData({
      scheduleDates
    });
    
    // 更新日历上的标记
    this.updateCalendarMarkers();
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
    // 每次显示页面时重新加载数据
    // 从本地存储加载事件数据
    const events = wx.getStorageSync('events') || [];
    let nextEventId = 100;
    if (events.length > 0) {
      // 找出最大的ID值，用于新事件的ID生成
      nextEventId = Math.max(...events.map(event => event.id)) + 1;
    }
    
    this.setData({
      events,
      nextEventId
    });
    
    // 更新日历
    this.generateCalendar(this.data.year, this.data.month);
    
    // 如果有选中的日期，加载该日期的事件
    if (this.data.selectedDate) {
      const selectedDateObj = new Date(this.data.selectedDate.replace(/(\d+)年(\d+)月(\d+)日/, '$1-$2-$3'));
      if (!isNaN(selectedDateObj.getTime())) {
        const year = selectedDateObj.getFullYear();
        const month = (selectedDateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDateObj.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        this.getEventsForDay(dateStr);
      }
    }
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
    // 下拉刷新重新加载数据
    this.loadScheduleDates();
    this.loadScheduleData();
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
    return {
      title: '我的日程安排',
      path: '/pages/schedule/schedule'
    };
  },

  /**
   * 显示日程详情
   */
  showScheduleDetail(e) {
    const id = e.currentTarget.dataset.id;
    const schedule = this.data.scheduleList.find(item => item.id === id);
    
    if (schedule) {
      wx.showModal({
        title: '日程详情',
        content: schedule.content,
        showCancel: false,
        confirmText: '确定'
      });
    }
  },

  // 添加事件
  addEvent() {
    wx.showToast({
      title: '添加日程功能开发中',
      icon: 'none'
    });
    // 这里可以跳转到添加日程的页面
    // wx.navigateTo({
    //   url: '/pages/add-event/add-event?date=' + this.data.selectedDate,
    // })
  },
  
  // 编辑事件
  editEvent(e) {
    const { id } = e.currentTarget.dataset;
    // 查找要编辑的事件
    const eventToEdit = this.data.events.find(event => event.id === id);
    
    if (eventToEdit) {
      this.setData({
        showSingleAdd: true,
        eventContent: eventToEdit.title,
        eventDesc: eventToEdit.description === '无描述' ? '' : eventToEdit.description,
        eventTime: eventToEdit.eventTime || '12:00',
        editingEventId: id // 记录正在编辑的事件ID
      });
    } else {
      wx.showToast({
        title: '未找到该日程',
        icon: 'none'
      });
    }
  },
  
  // 删除事件
  deleteEvent(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定要删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          // 从事件列表中删除
          const events = this.data.events.filter(event => event.id !== id);
          
          this.setData({
            events,
            dayEvents: this.data.dayEvents.filter(event => event.id !== id)
          });
          
          // 更新本地存储
          wx.setStorageSync('events', events);

          // 更新日历
          this.generateCalendar(this.data.year, this.data.month);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 点击年月标题，显示选择器
  showYearMonthSelector() {
    this.setData({
      showYearMonthPicker: true
    });
  },

  // 关闭年月选择器
  closeYearMonthSelector() {
    this.setData({
      showYearMonthPicker: false
    });
  },

  // 选择年份
  selectYear(e) {
    const year = parseInt(e.currentTarget.dataset.year);
    this.setData({
      year: year
    });
    this.generateCalendar(year, this.data.month);
  },

  // 选择月份
  selectMonth(e) {
    const month = parseInt(e.currentTarget.dataset.month);
    this.setData({
      month: month,
      showYearMonthPicker: false
    });
    this.generateCalendar(this.data.year, month);
  },

  // 设置今天
  setToday() {
    const today = new Date();
    const formattedDate = this.formatDisplayDate(today);
    this.setData({
      selectedDate: formattedDate,
      formattedDate: formattedDate
    });
    this.generateCalendar(today.getFullYear(), today.getMonth() + 1);
    this.loadScheduleData();
  },

  // 处理日期选择器变化
  bindDateChange(e) {
    const val = e.detail.value;
    const year = parseInt(this.data.yearArray[val[0]]);
    const month = parseInt(this.data.monthArray[val[1]]);
    
    this.setData({
      year,
      month,
      yearIndex: val[0],
      monthIndex: val[1]
    });
    
    this.generateCalendar(year, month);
  },

  // 输入日程内容
  inputEvent(e) {
    this.setData({
      eventContent: e.detail.value
    });
  },

  // 输入日程描述
  inputDesc(e) {
    this.setData({
      eventDesc: e.detail.value
    });
  },

  // 选择开始时间
  bindStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value
    });
  },

  // 选择结束时间
  bindEndTimeChange(e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  // 选择开始日期
  bindStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
  },

  // 选择结束日期
  bindEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  // 选择事件时间
  bindEventTimeChange(e) {
    this.setData({
      eventTime: e.detail.value
    });
  },

  // 选择批量事件时间
  bindBatchEventTimeChange(e) {
    this.setData({
      batchEventTime: e.detail.value
    });
  },

  // 保存单个日程
  saveEvent() {
    if (!this.data.eventContent) {
      wx.showToast({
        title: '请输入日程内容',
        icon: 'none'
      });
      return;
    }
    
    // 使用当前选中的日期
    const dateStr = this.data.selectedDate;
    const formattedDate = this.data.formattedDate;
    
    // 获取日期的标准格式 (YYYY-MM-DD)
    const dateParts = this.data.selectedDate.match(/(\d+)年(\d+)月(\d+)日/);
    const year = dateParts[1];
    const month = dateParts[2].padStart(2, '0');
    const day = dateParts[3].padStart(2, '0');
    const standardDateStr = `${year}-${month}-${day}`;
    
    // 判断是编辑还是新增
    if (this.data.editingEventId) {
      // 编辑现有事件
      const events = this.data.events.map(event => {
        if (event.id === this.data.editingEventId) {
          return {
            ...event,
            title: this.data.eventContent,
            description: this.data.eventDesc || '无描述',
            eventTime: this.data.eventTime
          };
        }
        return event;
      });
      
      this.setData({
        events,
        showSingleAdd: false,
        eventContent: '',
        eventDesc: '',
        eventTime: '12:00',
        editingEventId: null // 清除编辑状态
      });
      
      // 保存到本地存储
      wx.setStorageSync('events', events);
      
      // 更新日历和当天事件列表
      this.generateCalendar(this.data.year, this.data.month);
      this.getEventsForDay(standardDateStr);
      
      wx.showToast({
        title: '修改成功',
        icon: 'success'
      });
    } else {
      // 创建新事件
      const newEvent = {
        id: this.data.nextEventId++,
        date: standardDateStr,
        eventTime: this.data.eventTime,
        title: this.data.eventContent,
        description: this.data.eventDesc || '无描述'
      };
      
      // 添加到事件列表
      const events = [...this.data.events, newEvent];
      
      this.setData({
        events,
        showSingleAdd: false,
        eventContent: '',
        eventDesc: '',
        eventTime: '12:00'
      });
      
      // 保存到本地存储
      wx.setStorageSync('events', events);
      
      // 更新日历和当天事件列表
      this.generateCalendar(this.data.year, this.data.month);
      this.getEventsForDay(standardDateStr);
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    }
  },

  // 批量保存日程
  saveBatchEvent() {
    if (!this.data.eventContent) {
      wx.showToast({
        title: '请输入日程内容',
        icon: 'none'
      });
      return;
    }
    
    const startDate = new Date(this.data.startDate);
    const endDate = new Date(this.data.endDate);
    
    if (startDate > endDate) {
      wx.showToast({
        title: '开始日期不能晚于结束日期',
        icon: 'none'
      });
      return;
    }
    
    // 创建日期范围内的所有事件
    const events = [...this.data.events];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // 创建新事件
      const newEvent = {
        id: this.data.nextEventId++,
        date: dateStr,
        eventTime: this.data.batchEventTime,
        title: this.data.eventContent,
        description: this.data.eventDesc || '无描述'
      };
      
      events.push(newEvent);
      
      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.setData({
      events,
      showBatchAdd: false,
      eventContent: '',
      eventDesc: '',
      batchEventTime: '12:00'
    });
    
    // 保存到本地存储
    wx.setStorageSync('events', events);
    
    // 更新日历和当天事件列表
    this.generateCalendar(this.data.year, this.data.month);
    
    // 如果当前选中日期在批量添加范围内，更新事件列表
    const selectedDateObj = new Date(this.data.selectedDate.replace(/(\d+)年(\d+)月(\d+)日/, '$1-$2-$3'));
    if (selectedDateObj >= startDate && selectedDateObj <= endDate) {
      const year = selectedDateObj.getFullYear();
      const month = (selectedDateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDateObj.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      this.getEventsForDay(dateStr);
    }
    
    wx.showToast({
      title: '批量添加成功',
      icon: 'success'
    });
  }
})
