<template>
  <view class="page-container">
    <view class="header">
      <text class="title">我的预订</text>
    </view>
    <view class="content">
      <view class="loading-state" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="empty-state" v-else-if="bookings.length === 0">
        <text class="empty-text">暂无预订记录</text>
        <navigator url="/pages/tenant/property-list" class="action-button">
          <text class="button-text">去找房源</text>
        </navigator>
      </view>
      <view class="booking-list" v-else>
        <view
          v-for="(booking, index) in bookings"
          :key="booking.id || index"
          class="booking-item"
        >
          <view class="booking-header">
            <text class="property-name">{{
              booking.propertyName || booking.property?.title
            }}</text>
            <text class="status" :class="booking.status">{{
              getStatusText(booking.status)
            }}</text>
          </view>
          <view class="booking-info">
            <text class="info-item"
              >预约时间:
              {{
                formatDateTime(booking.viewingTime || booking.viewing_time)
              }}</text
            >
            <text class="info-item"
              >联系人: {{ booking.contactName || booking.contact_name }}</text
            >
            <text class="info-item"
              >电话: {{ booking.contactPhone || booking.contact_phone }}</text
            >
            <text v-if="booking.notes" class="info-item"
              >备注: {{ booking.notes }}</text
            >
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { get } from "../../utils/request";

// 预订数据
const bookings = ref<any[]>([]);
const loading = ref(true);

// 获取状态显示文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "待确认",
    confirmed: "已确认",
    canceled: "已取消",
    completed: "已完成",
    rejected: "已拒绝",
  };
  return statusMap[status] || status;
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "";

  try {
    // 处理不同的日期格式
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;

    return date
      .toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\//g, "-");
  } catch (e) {
    return dateTimeStr;
  }
};

// 获取预订列表
const fetchBookings = async () => {
  loading.value = true;
  try {
    // 根据API响应结构调整
    const response = await get<any>("/appointments");
    console.log("预订列表API返回:", response);

    // 处理不同的API响应结构
    if (
      response &&
      typeof response === "object" &&
      "success" in response &&
      "appointments" in response
    ) {
      bookings.value = response.appointments;
    } else if (
      response &&
      typeof response === "object" &&
      "success" in response &&
      "data" in response
    ) {
      bookings.value = response.data;
    } else if (Array.isArray(response)) {
      bookings.value = response;
    } else if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      bookings.value = response.data;
    } else {
      console.error("无法识别的API响应格式:", response);
      uni.showToast({
        title: "获取预订数据失败",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("获取预订列表失败:", error);
    uni.showToast({
      title: "获取预订列表失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

onLoad(() => {
  console.log("Booking index page loaded");
  fetchBookings();
});

// 页面显示时刷新数据
const onShow = () => {
  fetchBookings();
};

// 注册页面生命周期钩子
onMounted(() => {
  uni.$on("hook:onShow", onShow);
});
</script>

<style>
.page-container {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 20px;
}

.action-button {
  background-color: #007aff;
  padding: 10px 20px;
  border-radius: 5px;
}

.button-text {
  color: #fff;
  font-size: 16px;
}

.booking-list {
  margin-top: 20px;
}

.booking-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.property-name {
  font-size: 16px;
  font-weight: bold;
}

.status {
  font-size: 14px;
}

.status.confirmed {
  color: #07c160;
}

.status.pending {
  color: #ff9900;
}

.booking-info {
  display: flex;
  flex-direction: column;
}

.info-item {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
}
</style> 