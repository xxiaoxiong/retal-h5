<template>
  <view class="appointments-list-page">
    <view class="header">
      <view class="title">预约管理</view>
      <!-- 状态筛选标签 -->
      <view class="filter-tabs">
        <text 
          v-for="status in statusOptions" 
          :key="status.value" 
          :class="{ active: currentStatus.value === status.value }" 
          @click="changeStatusFilter(status)"
        >
          {{ status.label }}
        </text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading && appointments.length === 0" class="loading-placeholder">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 空状态 -->
    <view v-else-if="appointments.length === 0" class="empty-placeholder">
      <image src="/static/empty-appointments.png" mode="aspectFit" class="empty-image"></image>
      <text class="empty-text">暂无{{ currentStatus.label }}预约</text>
    </view>
    
    <!-- 预约列表 -->
    <scroll-view 
      v-else 
      class="appointments-list" 
      scroll-y 
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="loadMoreAppointments"
    >
      <view v-for="appointment in appointments" :key="appointment.id" class="appointment-item">
        <view class="item-header">
          <view class="property-title">{{ appointment.property.title }}</view>
          <view :class="['status-tag', `status-${appointment.status}`]">{{ formatStatus(appointment.status) }}</view>
        </view>
        
        <view class="item-body">
          <view class="info-row">
            <uni-icons type="calendar" size="16" color="#999"></uni-icons>
            <text class="label">预约时间:</text>
            <text class="value">{{ formatDateTime(appointment.appointment_time) }}</text>
          </view>
          
          <view class="info-row">
            <uni-icons type="person" size="16" color="#999"></uni-icons>
            <text class="label">租客:</text>
            <text class="value">{{ appointment.tenant.nickname || '匿名用户' }} {{ appointment.tenant.phone_number ? `(${appointment.tenant.phone_number})` : '' }}</text>
          </view>
          
          <view class="info-row" v-if="appointment.tenant_notes">
            <uni-icons type="chat" size="16" color="#999"></uni-icons>
            <text class="label">租客备注:</text>
            <text class="value">{{ appointment.tenant_notes }}</text>
          </view>
        </view>
        
        <!-- 待确认状态的操作按钮 -->
        <view class="item-actions" v-if="appointment.status === 'pending'">
          <button size="mini" plain @click.stop="updateAppointmentStatus(appointment.id, 'cancelled', '取消预约')">取消</button>
          <button size="mini" @click.stop="updateAppointmentStatus(appointment.id, 'confirmed', '确认预约')">确认</button>
        </view>
        
        <!-- 已确认状态的操作按钮 -->
         <view class="item-actions" v-else-if="appointment.status === 'confirmed'">
          <button size="mini" @click.stop="updateAppointmentStatus(appointment.id, 'completed', '完成看房')">完成看房</button>
        </view>
      </view>
      
      <!-- 加载更多指示器 -->
      <view v-if="loadingMore" class="loading-more">
        <view class="loading-dots">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
        <text>加载更多预约...</text>
    </view>
      
      <!-- 无更多数据提示 -->
      <view v-if="!hasMore && appointments.length > 0" class="no-more">—— 已经到底啦 ——</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, put } from '../../utils/request';

interface Tenant {
  id: string;
  nickname?: string;
  avatar_url?: string;
  phone_number?: string;
}

interface Property {
  id: string;
  title: string;
}

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface Appointment {
  id: string;
  created_at: string;
  updated_at: string;
  tenant: Tenant;
  property: Property;
  landlord_id: string;
  appointment_time: string;
  status: AppointmentStatus;
  tenant_notes?: string;
  landlord_notes?: string;
}

interface StatusOption {
  label: string;
  value: AppointmentStatus | 'all';
}

// API响应类型
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  appointments?: Appointment[];
  total?: number;
  message?: string;
  [key: string]: any;
}

const appointments = ref<Appointment[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 10;

const statusOptions: StatusOption[] = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];
const currentStatus = ref<StatusOption>(statusOptions[0]); // 默认显示全部

// 获取预约记录列表
const fetchAppointments = async (page = 1, statusFilter: AppointmentStatus | 'all' = 'all', isRefresh = false) => {
  if (isRefresh) {
    refreshing.value = true;
  } else if (page === 1) {
    loading.value = true;
    appointments.value = []; // 重置列表
  } else {
    loadingMore.value = true;
  }

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;
  console.log(`Fetching appointments: page=${page}, status=${statusParam}`);

  try {
    // 构建请求参数
    const params: Record<string, any> = {
      page,
      limit: pageSize
    };
    
    if (statusParam) {
      params.status = statusParam;
    }
    
    // 发起API请求
    const response = await get<ApiResponse<Appointment[]> | Appointment[]>('/appointments', params);
    
    console.log('API response:', response);
    
    if (response && Array.isArray(response)) {
      // 直接返回数组
      const newAppointments = response;
      appointments.value = page === 1 ? newAppointments : [...appointments.value, ...newAppointments];
      hasMore.value = newAppointments.length === pageSize;
    } else if (response && Array.isArray(response.appointments)) {
      // 带有元数据的响应格式（appointments字段）
      const newAppointments = response.appointments;
      appointments.value = page === 1 ? newAppointments : [...appointments.value, ...newAppointments];
      hasMore.value = response.total ? appointments.value.length < response.total : newAppointments.length === pageSize;
    } else if (response && response.data && Array.isArray(response.data)) {
      // 带有元数据的响应格式（data字段）
      const newAppointments = response.data;
      appointments.value = page === 1 ? newAppointments : [...appointments.value, ...newAppointments];
      hasMore.value = response.total ? appointments.value.length < response.total : newAppointments.length === pageSize;
    } else {
      // 响应格式不符合预期
      console.error('Invalid response format:', response);
      uni.showToast({ title: '数据格式错误', icon: 'none' });
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  } finally {
    if (isRefresh) {
      refreshing.value = false;
      uni.stopPullDownRefresh();
    } else if (page === 1) {
    loading.value = false;
  } else {
    loadingMore.value = false;
  }
  }
};

// 处理下拉刷新
const handleRefresh = () => {
  currentPage.value = 1;
  fetchAppointments(1, currentStatus.value.value, true);
};

// 加载更多
const loadMoreAppointments = () => {
  if (!hasMore.value || loadingMore.value) {
    return;
  }
  currentPage.value++;
  fetchAppointments(currentPage.value, currentStatus.value.value);
};

// 切换状态筛选
const changeStatusFilter = (status: StatusOption) => {
  if (currentStatus.value.value === status.value) return;
  currentStatus.value = status;
  currentPage.value = 1; // 重置页码
  fetchAppointments(currentPage.value, currentStatus.value.value);
};

// 更新预约状态
const updateAppointmentStatus = async (id: string, newStatus: AppointmentStatus, actionTitle: string) => {
  console.log(`Updating appointment ${id} to status ${newStatus}`);
  
  // 确认操作
  uni.showModal({
    title: '确认操作',
    content: `确定要${actionTitle}吗？`,
    success: async (res) => {
      if (res.confirm) {
  uni.showLoading({ title: '处理中...' });

        try {
          // 发起更新状态请求
          const response = await put<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status: newStatus });
          
          console.log('Update status response:', response);
          
          if (response && (response.success || response.id)) {
    uni.showToast({ title: '操作成功', icon: 'success' });
            
            // 更新本地列表状态
    const index = appointments.value.findIndex(appt => appt.id === id);
    if (index !== -1) {
      appointments.value[index].status = newStatus;
      // 如果筛选的不是'all'，则可能需要移除该项
      if (currentStatus.value.value !== 'all' && currentStatus.value.value !== newStatus) {
          appointments.value.splice(index, 1);
      }
    }
  } else {
    uni.showToast({ title: '操作失败', icon: 'error' });
  }
        } catch (error) {
          console.error('Error updating appointment status:', error);
          uni.showToast({ title: '操作失败', icon: 'error' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 格式化状态显示
const formatStatus = (status: AppointmentStatus): string => {
  switch (status) {
    case 'pending': return '待确认';
    case 'confirmed': return '已确认';
    case 'cancelled': return '已取消';
    case 'completed': return '已完成';
    default: return '未知';
  }
};

// 格式化日期时间
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 页面加载时获取数据
onMounted(() => {
  fetchAppointments();
});

// 触底加载更多 (需要在 pages.json 中配置 "onReachBottomDistance")
import { onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
onReachBottom(() => {
  loadMoreAppointments();
});

// 下拉刷新
onPullDownRefresh(() => {
  handleRefresh();
});
</script>

<style lang="scss" scoped>
.appointments-list-page {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }

  .filter-tabs {
    display: flex;
    gap: 30rpx;
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 6rpx;
    
    &::-webkit-scrollbar {
      display: none;
    }
    
    text {
      font-size: 28rpx;
      color: #666;
      padding-bottom: 10rpx;
      position: relative;
      transition: all 0.3s;
      
      &.active {
        color: #409eff;
        font-weight: bold;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4rpx;
          background-color: #409eff;
          border-radius: 2rpx;
          animation: slideIn 0.3s ease-out;
      }
    }
  }
  }
}

@keyframes slideIn {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid rgba(0, 0, 0, 0.1);
    border-top: 4rpx solid #409eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
  }
  
  .loading-text {
    color: #999;
    font-size: 28rpx;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 0;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
  color: #999;
    font-size: 28rpx;
  }
}

.appointments-list {
  padding: 20rpx;
  height: calc(100vh - 180rpx);
}

.appointment-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding-bottom: 20rpx;
    border-bottom: 1px dashed #eee;

    .property-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-tag {
      font-size: 24rpx;
      padding: 6rpx 16rpx;
      border-radius: 30rpx;
      color: #fff;
      
      &.status-pending { 
        background-color: #e6a23c; 
      }
      &.status-confirmed { 
        background-color: #409eff; 
      }
      &.status-completed { 
        background-color: #67c23a; 
      }
      &.status-cancelled { 
        background-color: #909399; 
      }
    }
  }

  .item-body {
    .info-row {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: #666;
      margin-bottom: 16rpx;
      
      .label {
        margin: 0 10rpx;
        color: #999;
        min-width: 70rpx;
      }
      
      .value {
        color: #333;
        flex: 1;
      }
      
      uni-icons {
        margin-right: 6rpx;
      }
    }
  }

  .item-actions {
    margin-top: 30rpx;
    padding-top: 20rpx;
    border-top: 1px dashed #eee;
    display: flex;
    justify-content: flex-end;
    gap: 20rpx;

    button {
      min-width: 160rpx;
      font-size: 26rpx;
      
      &:first-child {
        color: #999;
        border-color: #ddd;
      }
      
      &:last-child {
        background-color: #409eff;
        color: #fff;
      }
    }
  }
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 0;
  
  .loading-dots {
    display: flex;
    gap: 10rpx;
    margin-bottom: 10rpx;
    
    .dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background-color: #409eff;
      opacity: 0.6;
      animation: pulse 1.4s infinite ease-in-out;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
  
  text {
    color: #999;
    font-size: 24rpx;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

.no-more {
  text-align: center;
  color: #ccc;
  padding: 40rpx 0;
  font-size: 24rpx;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 60rpx;
    height: 1px;
    background-color: #eee;
  }
  
  &::before {
    left: 50%;
    margin-left: -160rpx;
  }
  
  &::after {
    right: 50%;
    margin-right: -160rpx;
  }
}
</style>
