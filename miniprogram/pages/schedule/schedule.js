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
    dayEvents: [],
    showAddOptions: false,
    showYearMonthPicker: false,
    yearRange: [],
    yearArray: [],
    monthArray: [],
    yearIndex: 10, // 默认选中当前年份
    monthIndex: 0, // 默认选中当前月份
    nextEventId: 100,
    events: [], // 事件列表，从云数据库获取
    editingEventId: null,
    showTaskManagement: false, // 是否显示任务管理弹窗
    allTasks: [], // 任务管理列表（操作记录列表）
    
    // 新的统一表单数据
    scheduleTitle: '',          // 日程主题
    scheduleDate: '',           // 选择的日期
    scheduleStartTime: '',      // 开始时间
    scheduleEndTime: '',        // 结束时间
    scheduleStartTimeIndex: 0,  // 开始时间索引
    scheduleEndTimeIndex: 2,    // 结束时间索引
    repeatType: 'none',         // 重复类型：none/daily/weekly
    scheduleDescription: '',    // 日程描述
    
    // 时间选择器选项
    timeOptions: [],           // 半小时步长的时间选项
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
    
    // 从云数据库加载事件数据
    this.loadEventsFromCloud();
    
    // 生成日历并加载当天的事件
    this.generateCalendar(year, month);
    
    // 设置默认的开始和结束日期
    const formattedDateStr = `${year}-${month.toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    this.setData({
      startDate: formattedDateStr,
      endDate: formattedDateStr
    });
    
    // 初始化新表单数据
    this.initializeNewScheduleForm();
    
    // 加载当天的事件
    this.getEventsForDay(formattedDateStr);
  },

  /**
   * 初始化新的日程表单数据
   */
  initializeNewScheduleForm() {
    // 生成半小时步长的时间选项 (00:00 - 23:30)
    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeOptions.push(timeStr);
      }
    }
    
    // 获取当前时间
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 计算当前时间对应的半小时时间点
    const roundedMinute = currentMinute >= 30 ? 30 : 0;
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
    
    // 计算结束时间（开始时间+1小时）
    let endHour = currentHour + 1;
    let endMinute = roundedMinute;
    
    // 处理跨天情况
    if (endHour >= 24) {
      endHour = 23;
      endMinute = 30;
    }
    
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // 格式化当前日期
    const today = new Date();
    const currentDateStr = this.formatDate(today);
    
    // 计算时间选择器的索引
    const startTimeIndex = timeOptions.indexOf(currentTimeStr);
    const endTimeIndex = timeOptions.indexOf(endTimeStr);
    
    this.setData({
      timeOptions: timeOptions,
      scheduleDate: currentDateStr,
      scheduleStartTime: currentTimeStr,
      scheduleEndTime: endTimeStr,
      scheduleStartTimeIndex: startTimeIndex >= 0 ? startTimeIndex : 0,
      scheduleEndTimeIndex: endTimeIndex >= 0 ? endTimeIndex : 1,
      scheduleTitle: '',
      scheduleDescription: '',
      repeatType: 'none'
    });
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
    
    // 重新加载该月份的数据
    this.loadEventsFromCloud(year, month);
    
    // 如果当前选中的日期不在新的月份中，则选中新月份的第一天
    const currentSelectedDate = new Date(this.data.selectedDate);
    if (currentSelectedDate.getFullYear() !== year || currentSelectedDate.getMonth() !== month - 1) {
      const newSelectedDate = this.formatDate(new Date(year, month - 1, 1));
      this.setData({
        selectedDate: newSelectedDate,
        formattedDate: this.formatDisplayDate(new Date(newSelectedDate))
      });
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
    
    // 重新加载该月份的数据
    this.loadEventsFromCloud(year, month);
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
    
    // 重新加载该月份的数据
    this.loadEventsFromCloud(year, month);
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
   * 显示添加选项
   */
  showAddOptions() {
    this.setData({
      showAddOptions: true
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

  // ==================== 新表单事件处理函数 ====================

  /**
   * 主题输入事件
   */
  onScheduleTitleInput(e) {
    this.setData({
      scheduleTitle: e.detail.value
    });
  },

  /**
   * 日期选择事件
   */
  onScheduleDateChange(e) {
    this.setData({
      scheduleDate: e.detail.value
    });
  },

  /**
   * 开始时间选择事件
   */
  onScheduleStartTimeChange(e) {
    const selectedIndex = parseInt(e.detail.value);
    const selectedTime = this.data.timeOptions[selectedIndex];
    
    // 检查结束时间是否需要调整
    let endTimeIndex = this.data.scheduleEndTimeIndex;
    if (selectedIndex >= endTimeIndex) {
      // 如果开始时间晚于或等于结束时间，自动调整结束时间
      endTimeIndex = Math.min(selectedIndex + 2, this.data.timeOptions.length - 1); // 至少间隔1小时
    }
    
    this.setData({
      scheduleStartTime: selectedTime,
      scheduleStartTimeIndex: selectedIndex,
      scheduleEndTime: this.data.timeOptions[endTimeIndex],
      scheduleEndTimeIndex: endTimeIndex
    });
  },

  /**
   * 结束时间选择事件
   */
  onScheduleEndTimeChange(e) {
    const selectedIndex = parseInt(e.detail.value);
    const selectedTime = this.data.timeOptions[selectedIndex];
    
    // 检查是否早于开始时间
    if (selectedIndex <= this.data.scheduleStartTimeIndex) {
      wx.showToast({
        title: '结束时间不能早于开始时间',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      scheduleEndTime: selectedTime,
      scheduleEndTimeIndex: selectedIndex
    });
  },

  /**
   * 重复类型选择事件
   */
  selectRepeatType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      repeatType: type
    });
  },

  /**
   * 描述输入事件
   */
  onScheduleDescInput(e) {
    this.setData({
      scheduleDescription: e.detail.value
    });
  },

  /**
   * 取消添加新日程
   */
  cancelScheduleAdd() {
    this.setData({
      showAddOptions: false
    });
    
    // 重置表单数据
    this.initializeNewScheduleForm();
  },

  /**
   * 保存新日程
   */
  saveNewSchedule() {
    // 验证标题不能为空
    if (!this.data.scheduleTitle.trim()) {
      wx.showToast({
        title: '请输入日程标题',
        icon: 'none'
      });
      return;
    }
    
    // 验证时间范围
    if (this.data.scheduleStartTimeIndex >= this.data.scheduleEndTimeIndex) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      });
      return;
    }
    
    // 保存输入数据，防止在处理过程中被清空
    const scheduleData = {
      title: this.data.scheduleTitle.trim(),
      date: this.data.scheduleDate,
      startTime: this.data.scheduleStartTime,
      endTime: this.data.scheduleEndTime,
      repeatType: this.data.repeatType,
      description: this.data.scheduleDescription.trim() || '无描述'
    };
    
    // 生成完整的事件时间描述
    const eventTimeDescription = `${scheduleData.startTime}-${scheduleData.endTime}`;
    
    wx.showLoading({
      title: '保存中',
    });
    
    // 根据重复类型生成日程
    this.generateSchedulesBasedOnRepeat(scheduleData, eventTimeDescription);
  },

  /**
   * 根据重复类型生成日程
   */
  generateSchedulesBasedOnRepeat(scheduleData, eventTimeDescription) {
    const startDate = new Date(scheduleData.date);
    let scheduleCount = 1;
    let dateRangeStr = scheduleData.date;
    
    // 计算需要生成的日期列表
    let datesToGenerate = [];
    
    switch (scheduleData.repeatType) {
      case 'none':
        // 不重复，只生成一个日程
        datesToGenerate = [scheduleData.date];
        scheduleCount = 1;
        dateRangeStr = scheduleData.date;
        break;
        
      case 'daily':
        // 每天重复，生成30天
        scheduleCount = 30;
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          datesToGenerate.push(this.formatDateToString(currentDate));
        }
        
        // 计算结束日期
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 29);
        dateRangeStr = `${scheduleData.date} 至 ${this.formatDateToString(endDate)}`;
        break;
        
      case 'weekly':
        // 每周重复，生成4周（28天，每7天一次）
        scheduleCount = 4;
        for (let i = 0; i < 4; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + (i * 7));
          datesToGenerate.push(this.formatDateToString(currentDate));
        }
        
        // 计算结束日期
        const weeklyEndDate = new Date(startDate);
        weeklyEndDate.setDate(startDate.getDate() + 21); // 3周后
        dateRangeStr = `${scheduleData.date} 至 ${this.formatDateToString(weeklyEndDate)} (每周)`;
        break;
        
      default:
        datesToGenerate = [scheduleData.date];
        scheduleCount = 1;
        dateRangeStr = scheduleData.date;
    }
    
    // 开始批量添加日程
    this.addMultipleSchedules(scheduleData, datesToGenerate, eventTimeDescription, dateRangeStr, scheduleCount);
  },

  /**
   * 批量添加多个日程
   */
  addMultipleSchedules(scheduleData, datesToGenerate, eventTimeDescription, dateRangeStr, totalCount) {
    let successCount = 0;
    let failCount = 0;
    let addedScheduleIds = [];
    let completedCount = 0;
    
    // 批量添加的处理函数
    const addSingleSchedule = (dateStr, index) => {
      wx.cloud.callFunction({
        name: 'addSchedule',
        data: {
          title: scheduleData.title,
          description: scheduleData.description,
          date: dateStr,
          eventTime: eventTimeDescription
        },
        success: res => {
          if (res.result.success) {
            successCount++;
            addedScheduleIds.push(res.result.scheduleId);
            
            // 创建新事件对象并添加到本地数据
            const newEvent = {
              id: this.data.nextEventId + index,
              _id: res.result.scheduleId,
              date: dateStr,
              eventTime: eventTimeDescription,
              title: scheduleData.title,
              description: scheduleData.description,
              completed: false,
              color: '#1296db'
            };
            
            // 添加到事件列表
            const events = [...this.data.events, newEvent];
            this.setData({ events });
          } else {
            failCount++;
          }
        },
        fail: () => {
          failCount++;
        },
        complete: () => {
          completedCount++;
          
          // 检查是否所有请求都完成了
          if (completedCount === datesToGenerate.length) {
            this.handleScheduleAddComplete(scheduleData, successCount, failCount, addedScheduleIds, dateRangeStr, totalCount);
          }
        }
      });
    };
    
    // 执行批量添加
    datesToGenerate.forEach((dateStr, index) => {
      addSingleSchedule(dateStr, index);
    });
  },

  /**
   * 处理日程添加完成后的逻辑
   */
  handleScheduleAddComplete(scheduleData, successCount, failCount, addedScheduleIds, dateRangeStr, totalCount) {
    wx.hideLoading();
    
    // 更新 nextEventId
    this.setData({
      nextEventId: this.data.nextEventId + totalCount
    });
    
    // 创建操作记录
    if (successCount > 0) {
      const operationType = scheduleData.repeatType === 'none' ? 'single' : 'batch';
      const operationTitle = operationType === 'single' 
        ? `添加日程：${scheduleData.title}`
        : `${this.getRepeatTypeDescription(scheduleData.repeatType)}添加：${scheduleData.title}`;
      
      this.createOperationRecord({
        operationType: operationType,
        title: operationTitle,
        scheduleCount: successCount,
        scheduleIds: addedScheduleIds,
        dateRange: dateRangeStr,
        content: scheduleData.title,
        repeatType: scheduleData.repeatType
      });
    }
    
    // 显示结果
    if (failCount === 0) {
      wx.showToast({
        title: successCount === 1 ? '日程添加成功' : `成功添加${successCount}个日程`,
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: `成功${successCount}个，失败${failCount}个`,
        icon: 'none'
      });
    }
    
    // 关闭弹窗并重置表单
    this.setData({
      showAddOptions: false
    });
    this.initializeNewScheduleForm();
    
    // 更新日历和当天事件列表
    this.generateCalendar(this.data.year, this.data.month);
    
    // 更新当前选中日期的事件
    const dateParts = this.data.selectedDate.match(/(\d+)年(\d+)月(\d+)日/);
    if (dateParts) {
      const year = dateParts[1];
      const month = dateParts[2].padStart(2, '0');
      const day = dateParts[3].padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      this.getEventsForDay(dateStr);
    }
  },

  /**
   * 获取重复类型的描述
   */
  getRepeatTypeDescription(repeatType) {
    switch (repeatType) {
      case 'daily':
        return '每日重复';
      case 'weekly':
        return '每周重复';
      default:
        return '单次';
    }
  },

  /**
   * 格式化日期为字符串 (YYYY-MM-DD)
   */
  formatDateToString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    this.loadEventsFromCloud();
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
    this.loadEventsFromCloud();
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
    
    // 查找要删除的事件
    const eventToDelete = this.data.events.find(event => event.id === id);
    
    if (!eventToDelete || !eventToDelete._id) {
      wx.showToast({
        title: '未找到该日程',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });
          
          // 调用云函数删除数据
          wx.cloud.callFunction({
            name: 'deleteSchedule',
            data: {
              _id: eventToDelete._id
            },
            success: res => {
              if (res.result.success) {
                // 从事件列表中删除
                const events = this.data.events.filter(event => event.id !== id);
                
                this.setData({
                  events,
                  dayEvents: this.data.dayEvents.filter(event => event.id !== id)
                });
                
                // 更新日历
                this.generateCalendar(this.data.year, this.data.month);
                
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: err => {
              console.error('删除日程失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
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
    
    // 重新加载该月份的数据
    this.loadEventsFromCloud(year, this.data.month);
    this.generateCalendar(year, this.data.month);
  },

  // 选择月份
  selectMonth(e) {
    const month = parseInt(e.currentTarget.dataset.month);
    this.setData({
      month: month,
      showYearMonthPicker: false
    });
    
    // 重新加载该月份的数据
    this.loadEventsFromCloud(this.data.year, month);
    this.generateCalendar(this.data.year, month);
  },

  // 设置今天
  setToday() {
    const today = new Date();
    const formattedDate = this.formatDisplayDate(today);
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    this.setData({
      selectedDate: formattedDate,
      formattedDate: formattedDate,
      year: year,
      month: month
    });
    
    // 重新加载当前月份的数据
    this.loadEventsFromCloud(year, month);
    this.generateCalendar(year, month);
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
    
    // 重新加载该月份的数据
    this.loadEventsFromCloud(year, month);
    this.generateCalendar(year, month);
  },



  /**
   * 从云数据库加载事件数据
   */
  loadEventsFromCloud(year = this.data.year, month = this.data.month) {
    wx.showLoading({
      title: '加载中',
    });
    
    // 调用云函数获取当月日程
    wx.cloud.callFunction({
      name: 'getSchedules',
      data: {
        year: year,
        month: month
      },
      success: res => {
        if (res.result.success) {
          const events = res.result.data;
          let nextEventId = 100;
          
          if (events.length > 0) {
            // 找出最大的ID值，用于新事件的ID生成
            nextEventId = Math.max(...events.map(event => {
              // 如果事件ID是字符串（云数据库的_id），则使用默认值
              if (typeof event.id === 'number') {
                return event.id;
              }
              return 0;
            })) + 1;
          }
          
          // 处理从云数据库获取的数据，确保格式一致
          const formattedEvents = events.map(event => {
            return {
              id: event.id || nextEventId++,
              _id: event._id, // 保存云数据库的ID
              date: event.date,
              eventTime: event.eventTime,
              title: event.title,
              description: event.description || '无描述',
              completed: event.completed || false,
              color: event.color || '#1296db'
            };
          });
          
          this.setData({
            events: formattedEvents,
            nextEventId
          });
          
          // 更新日历
          this.generateCalendar(this.data.year, this.data.month);
          
          // 更新当天事件
          const dateParts = this.data.selectedDate.match(/(\d+)年(\d+)月(\d+)日/);
          if (dateParts) {
            const year = dateParts[1];
            const month = dateParts[2].padStart(2, '0');
            const day = dateParts[3].padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            this.getEventsForDay(dateStr);
          }
        }
      },
      fail: err => {
        console.error('获取日程失败', err);
        wx.showToast({
          title: '获取日程失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 保存单个日程
   */
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
    
    wx.showLoading({
      title: '保存中',
    });
    
    // 判断是编辑还是新增
    if (this.data.editingEventId) {
      // 查找要编辑的事件
      const eventToEdit = this.data.events.find(event => event.id === this.data.editingEventId);
      
      // 调用云函数更新数据
      wx.cloud.callFunction({
        name: 'updateSchedule',
        data: {
          _id: eventToEdit._id,
          title: this.data.eventContent,
          description: this.data.eventDesc || '无描述',
          eventTime: this.data.eventTime
        },
        success: res => {
          if (res.result.success) {
            // 更新本地数据
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
            
            // 更新日历和当天事件列表
            this.generateCalendar(this.data.year, this.data.month);
            this.getEventsForDay(standardDateStr);
            
            wx.showToast({
              title: '修改成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '修改失败',
              icon: 'none'
            });
          }
        },
        fail: err => {
          console.error('修改日程失败', err);
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } else {
      // 调用云函数添加数据
      wx.cloud.callFunction({
        name: 'addSchedule',
        data: {
          title: this.data.eventContent,
          description: this.data.eventDesc || '无描述',
          date: standardDateStr,
          eventTime: this.data.eventTime
        },
        success: res => {
          if (res.result.success) {
            // 创建新事件对象
            const newEvent = {
              id: this.data.nextEventId++,
              _id: res.result.scheduleId, // 保存云数据库返回的ID
              date: standardDateStr,
              eventTime: this.data.eventTime,
              title: this.data.eventContent,
              description: this.data.eventDesc || '无描述',
              completed: false,
              color: '#1296db'
            };
            
            // 添加到事件列表
            const events = [...this.data.events, newEvent];
            
            // 在重置数据之前保存用户输入的内容
            const savedEventContent = this.data.eventContent;
            
            this.setData({
              events,
              showSingleAdd: false,
              eventContent: '',
              eventDesc: '',
              eventTime: '12:00'
            });
            
            // 创建操作记录（使用保存的内容）
            this.createOperationRecord({
              operationType: 'single',
              title: `添加日程：${savedEventContent}`,
              scheduleCount: 1,
              scheduleIds: [res.result.scheduleId],
              dateRange: standardDateStr,
              content: savedEventContent
            });
            
            // 更新日历和当天事件列表
            this.generateCalendar(this.data.year, this.data.month);
            this.getEventsForDay(standardDateStr);
            
            wx.showToast({
              title: '添加成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '添加失败',
              icon: 'none'
            });
          }
        },
        fail: err => {
          console.error('添加日程失败', err);
          wx.showToast({
            title: '添加失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  },



  /**
   * 显示任务管理弹窗
   */
  showTaskManagement() {
    this.setData({
      showTaskManagement: true
    });
    // 加载所有任务
    this.loadAllTasks();
  },

  /**
   * 隐藏任务管理弹窗
   */
  hideTaskManagement() {
    this.setData({
      showTaskManagement: false
    });
  },

  /**
   * 加载所有任务（操作记录）
   */
  loadAllTasks() {
    wx.showLoading({
      title: '加载中',
    });
    
    // 调用云函数获取所有操作记录
    wx.cloud.callFunction({
      name: 'getAllOperationRecords',
      data: {},
      success: res => {
        if (res.result.success) {
          // 处理操作记录数据，添加编号和格式化时间
          const tasks = res.result.data.map((task, index) => {
            return {
              ...task,
              taskNumber: index + 1,
              formattedCreateTime: this.formatCreateTime(task.operationTime || task.createdAt || task._id) // 使用操作时间
            };
          });
          
          this.setData({
            allTasks: tasks
          });
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('获取所有任务失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 格式化创建时间
   */
  formatCreateTime(timeValue) {
    let date;
    
    // 处理不同类型的时间值
    if (!timeValue) {
      date = new Date();
    } else if (typeof timeValue === 'string') {
      // 如果是ISO时间字符串 (如: 2024-01-15T10:30:00.000Z)
      if (timeValue.includes('T') || timeValue.includes('-')) {
        date = new Date(timeValue);
      } 
      // 如果是MongoDB的ObjectId格式 (24位十六进制字符串)
      else if (timeValue.length === 24) {
        const timestamp = parseInt(timeValue.substring(0, 8), 16) * 1000;
        date = new Date(timestamp);
      } 
      // 其他情况尝试直接解析
      else {
        date = new Date(timeValue);
      }
    } else if (timeValue instanceof Date) {
      date = timeValue;
    } else {
      date = new Date();
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  /**
   * 删除任务（从任务管理页面）- 删除操作记录及其关联的所有日程
   */
  deleteTaskFromManagement(e) {
    const { id } = e.currentTarget.dataset;
    
    // 查找要删除的操作记录
    const taskToDelete = this.data.allTasks.find(task => task.id === id || task._id === id);
    
    if (!taskToDelete) {
      wx.showToast({
        title: '未找到该任务',
        icon: 'none'
      });
      return;
    }
    
    const scheduleCount = taskToDelete.scheduleCount || 1;
    const operationType = taskToDelete.operationType === 'batch' ? '批量操作' : '单个操作';
    
    wx.showModal({
      title: '提示',
      content: `确定要删除这个${operationType}吗？这将删除 ${scheduleCount} 个相关日程。`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });
          
          // 调用云函数删除操作记录及其关联的日程
          wx.cloud.callFunction({
            name: 'deleteOperationRecord',
            data: {
              _id: taskToDelete._id
            },
            success: res => {
              if (res.result.success) {
                // 从任务列表中删除
                const allTasks = this.data.allTasks.filter(task => task._id !== taskToDelete._id);
                
                // 从events列表中删除相关的日程（根据scheduleIds）
                const scheduleIds = taskToDelete.scheduleIds || [];
                const events = this.data.events.filter(event => !scheduleIds.includes(event._id));
                
                // 从当日事件列表中删除相关的日程
                const dayEvents = this.data.dayEvents.filter(event => !scheduleIds.includes(event._id));
                
                this.setData({
                  allTasks,
                  events,
                  dayEvents
                });
                
                // 更新任务列表编号
                this.updateTaskNumbers();
                
                // 更新日历显示
                this.generateCalendar(this.data.year, this.data.month);
                
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: err => {
              console.error('删除任务失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },

  /**
   * 更新任务编号
   */
  updateTaskNumbers() {
    const allTasks = this.data.allTasks.map((task, index) => {
      return {
        ...task,
        taskNumber: index + 1
      };
    });
    
    this.setData({
      allTasks
    });
  },

  /**
   * 创建操作记录
   */
  createOperationRecord(operationData) {
    const operationRecord = {
      ...operationData,
      operationTime: new Date().toISOString(),
      _openid: wx.getStorageSync('openid') || '' // 用户标识
    };

    // 调用云函数创建操作记录
    wx.cloud.callFunction({
      name: 'createOperationRecord',
      data: operationRecord,
      success: res => {
        if (res.result.success) {
          console.log('操作记录创建成功');
        } else {
          console.error('操作记录创建失败:', res.result.error);
        }
      },
      fail: err => {
        console.error('调用云函数失败:', err);
      }
    });
  },

  /**
   * 一键删除所有任务
   */
  deleteAllTasks() {
    if (this.data.allTasks.length === 0) {
      wx.showToast({
        title: '暂无任务可删除',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除所有 ${this.data.allTasks.length} 个任务吗？这将删除所有相关的日程安排。`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });

          // 调用云函数批量删除
          wx.cloud.callFunction({
            name: 'deleteAllOperationRecords',
            data: {},
            success: res => {
              if (res.result.success) {
                // 清空本地数据
                this.setData({
                  allTasks: [],
                  events: [],
                  dayEvents: []
                });

                // 更新日历显示
                this.generateCalendar(this.data.year, this.data.month);

                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: err => {
              console.error('批量删除失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },

  /**
   * 清空所有数据（包括历史日程）
   */
  clearAllData() {
    wx.showModal({
      title: '危险操作⚠️',
      content: '确定要清空所有日程数据吗？\n\n这将删除：\n• 所有历史日程记录\n• 所有任务操作记录\n• 日历上的所有标记\n\n此操作不可恢复！',
      confirmText: '确认清空',
      confirmColor: '#ff4d4f',
      success: res => {
        if (res.confirm) {
          // 二次确认
          wx.showModal({
            title: '最后确认',
            content: '真的要清空所有数据吗？\n这个操作真的无法恢复！',
            confirmText: '清空',
            confirmColor: '#ff4d4f',
            success: res2 => {
              if (res2.confirm) {
                wx.showLoading({
                  title: '清空中...',
                });
                
                // 调用云函数清空所有数据
                wx.cloud.callFunction({
                  name: 'deleteAllSchedules',
                  data: {},
                  success: res => {
                    wx.hideLoading();
                    if (res.result.success) {
                      // 清空本地数据
                      this.setData({
                        allTasks: [],
                        events: [],
                        dayEvents: []
                      });
                      
                      // 重新生成日历
                      this.generateCalendar(this.data.year, this.data.month);
                      
                      // 关闭任务管理弹窗
                      this.setData({
                        showTaskManagement: false
                      });
                      
                      wx.showToast({
                        title: res.result.message || '清空成功',
                        icon: 'success',
                        duration: 3000
                      });
                    } else {
                      wx.showToast({
                        title: res.result.error || '清空失败',
                        icon: 'none'
                      });
                    }
                  },
                  fail: err => {
                    wx.hideLoading();
                    wx.showToast({
                      title: '网络错误',
                      icon: 'none'
                    });
                    console.error('调用清空云函数失败:', err);
                  }
                });
              }
            }
          });
        }
      }
    });
  }
})
