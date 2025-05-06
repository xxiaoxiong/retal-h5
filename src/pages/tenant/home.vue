<template>
  <view class="tenant-home">
    <view class="header">
      <view class="user-info">
        <image
          class="avatar"
          :src="userInfo.avatar || '/static/default-avatar.png'"
          mode="aspectFill"
        ></image>
        <view class="user-details">
          <text class="username">{{
            userInfo.name || userInfo.username || "租户用户"
          }}</text>
          <text class="user-role">租户账号</text>
        </view>
      </view>
      <view class="header-actions">
        <view class="notification" @click="openNotifications">
          <uni-icons
            type="notification-filled"
            size="24"
            color="#333"
          ></uni-icons>
          <view class="badge" v-if="unreadNotifications > 0">{{
            unreadNotifications > 99 ? "99+" : unreadNotifications
          }}</view>
        </view>
        <view class="settings" @click="openSettings">
          <uni-icons type="gear-filled" size="24" color="#333"></uni-icons>
        </view>
      </view>
    </view>

    <view class="quick-actions">
      <view
        class="action-card"
        v-for="(action, index) in quickActions"
        :key="index"
        @click="navigateTo(action.url)"
      >
        <view class="action-icon" :style="{ backgroundColor: action.bgColor }">
          <uni-icons :type="action.icon" size="24" color="#fff"></uni-icons>
        </view>
        <text class="action-title">{{ action.title }}</text>
      </view>
    </view>

    <view class="section rental-info">
      <view class="section-header">
        <text class="section-title">我的租房</text>
        <text class="view-more" @click="navigateTo('/pages/tenant/rentals')"
          >查看全部</text
        >
      </view>

      <view class="current-rental" v-if="currentRental">
        <image
          class="rental-image"
          :src="currentRental.coverImage || '/static/default-house.jpg'"
          mode="aspectFill"
        ></image>
        <view class="rental-details">
          <view class="rental-name">{{ currentRental.name }}</view>
          <view class="rental-address">{{ currentRental.address }}</view>
          <view class="rental-info-row">
            <text class="info-label">租期:</text>
            <text class="info-value"
              >{{ currentRental.startDate }} 至
              {{ currentRental.endDate }}</text
            >
          </view>
          <view class="rental-info-row">
            <text class="info-label">月租:</text>
            <text class="info-value price"
              >¥{{ currentRental.monthlyRent }}</text
            >
          </view>
          <view class="rental-status" :class="rentalStatusClass">{{
            rentalStatusText
          }}</view>
        </view>
      </view>

      <view class="empty-rental" v-else>
        <image
          src="/static/empty-house.png"
          mode="aspectFit"
          class="empty-image"
        ></image>
        <text class="empty-text">您暂时没有租房记录</text>
        <button
          class="search-button"
          @click="navigateTo('/pages/tenant/house-list')"
        >
          寻找房源
        </button>
      </view>
    </view>

    <view class="section bills">
      <view class="section-header">
        <text class="section-title">账单概览</text>
        <text class="view-more" @click="navigateTo('/pages/tenant/bills')"
          >账单管理</text
        >
      </view>

      <view class="bill-cards">
        <view class="bill-card rent">
          <view class="bill-title">
            <uni-icons type="home" size="18" color="#4CD964"></uni-icons>
            <text>本月租金</text>
          </view>
          <view class="bill-amount">¥{{ billInfo.rentAmount || "--" }}</view>
          <view class="bill-due-date">
            <text>到期日: {{ billInfo.rentDueDate || "--" }}</text>
            <button
              class="pay-button"
              v-if="billInfo.rentStatus === 'unpaid'"
              @click="payRent"
            >
              立即支付
            </button>
            <text class="paid-status" v-else-if="billInfo.rentStatus === 'paid'"
              >已支付</text
            >
          </view>
        </view>

        <view class="bill-card utilities">
          <view class="bill-title">
            <uni-icons
              type="notification"
              size="18"
              color="#007AFF"
            ></uni-icons>
            <text>水电气费</text>
          </view>
          <view class="bill-amount">¥{{ billInfo.utilityAmount || "--" }}</view>
          <view class="bill-due-date">
            <text>到期日: {{ billInfo.utilityDueDate || "--" }}</text>
            <button
              class="pay-button"
              v-if="billInfo.utilityStatus === 'unpaid'"
              @click="payUtility"
            >
              立即支付
            </button>
            <text
              class="paid-status"
              v-else-if="billInfo.utilityStatus === 'paid'"
              >已支付</text
            >
          </view>
        </view>
      </view>
    </view>

    <view class="section maintenance">
      <view class="section-header">
        <text class="section-title">维修申请</text>
        <text class="view-more" @click="navigateTo('/pages/tenant/maintenance')"
          >查看全部</text
        >
      </view>

      <view class="maintenance-list" v-if="maintenanceRequests.length > 0">
        <view
          class="maintenance-item"
          v-for="(request, index) in maintenanceRequests"
          :key="index"
          @click="
            navigateTo(`/pages/tenant/maintenance-detail?id=${request.id}`)
          "
        >
          <view
            class="maintenance-status"
            :class="'status-' + request.status"
            >{{ getStatusText(request.status) }}</view
          >
          <view class="maintenance-title">{{ request.title }}</view>
          <view class="maintenance-date"
            >申请时间: {{ request.createTime }}</view
          >
        </view>
      </view>

      <view class="empty-maintenance" v-else>
        <image
          src="/static/empty-maintenance.png"
          mode="aspectFit"
          class="empty-image"
        ></image>
        <text class="empty-text">暂无维修申请</text>
        <button
          class="request-button"
          @click="navigateTo('/pages/tenant/maintenance-create')"
        >
          申请维修
        </button>
      </view>
    </view>

    <view class="section announcements">
      <view class="section-header">
        <text class="section-title">最新公告(未开发)</text>
        <text
          class="view-more"
          @click="navigateTo('/pages/tenant/announcements')"
          >全部公告</text
        >
      </view>

      <view class="announcement-list" v-if="announcements.length > 0">
        <view
          class="announcement-item"
          v-for="(announcement, index) in announcements"
          :key="index"
          @click="
            navigateTo(
              `/pages/tenant/announcement-detail?id=${announcement.id}`
            )
          "
        >
          <view class="announcement-content">
            <text class="announcement-title">{{ announcement.title }}</text>
            <text class="announcement-preview">{{ announcement.content }}</text>
          </view>
          <text class="announcement-time">{{ announcement.createTime }}</text>
        </view>
      </view>

      <view class="empty-announcements" v-else>
        <image
          src="/static/empty-notice.png"
          mode="aspectFit"
          class="empty-image"
        ></image>
        <text class="empty-text">暂无公告信息</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { get } from "../../utils/request";

// Types
interface UserInfo {
  id: string;
  username: string;
  name: string;
  avatar: string;
  role: string;
}

interface QuickAction {
  title: string;
  icon: string;
  url: string;
  bgColor: string;
}

interface Rental {
  id: string;
  name: string;
  address: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: string;
}

interface BillInfo {
  rentAmount: number | null;
  rentDueDate: string | null;
  rentStatus: string | null;
  utilityAmount: number | null;
  utilityDueDate: string | null;
  utilityStatus: string | null;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  createTime: string;
  status: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createTime: string;
}

// 用户信息
const userInfo = reactive<UserInfo>({
  id: "",
  username: "",
  name: "",
  avatar: "",
  role: "tenant",
});

// 未读通知数量
const unreadNotifications = ref(2);

// 快捷操作
const quickActions = reactive<QuickAction[]>([
  {
    title: "找房源",
    icon: "search",
    url: "/pages/tenant/house-list",
    bgColor: "#4CD964",
  },
  {
    title: "申请维修",
    icon: "wrench",
    url: "/pages/tenant/maintenance-create",
    bgColor: "#007AFF",
  },
  {
    title: "缴纳账单",
    icon: "wallet",
    url: "/pages/tenant/bills",
    bgColor: "#FF9500",
  },
  {
    title: "我的合同",
    icon: "file-text",
    url: "/pages/tenant/contracts",
    bgColor: "#5856D6",
  },
]);

// 当前租房信息
const currentRental = ref<Rental | null>(null);
const rentalStatusClass = computed(() => {
  if (!currentRental.value) return "";

  switch (currentRental.value.status) {
    case "active":
      return "status-active";
    case "pending":
      return "status-pending";
    case "expired":
      return "status-expired";
    default:
      return "";
  }
});

const rentalStatusText = computed(() => {
  if (!currentRental.value) return "";

  switch (currentRental.value.status) {
    case "active":
      return "租约生效中";
    case "pending":
      return "待生效";
    case "expired":
      return "已到期";
    default:
      return "未知状态";
  }
});

// 账单信息
const billInfo = reactive<BillInfo>({
  rentAmount: null,
  rentDueDate: null,
  rentStatus: null,
  utilityAmount: null,
  utilityDueDate: null,
  utilityStatus: null,
});

// 维修申请
const maintenanceRequests = ref<MaintenanceRequest[]>([]);

// 公告列表
const announcements = ref<Announcement[]>([]);

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "待处理";
    case "processing":
      return "处理中";
    case "completed":
      return "已完成";
    case "rejected":
      return "已拒绝";
    default:
      return "未知状态";
  }
};

// 导航到指定页面
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

// 打开通知页面
const openNotifications = () => {
  navigateTo("/pages/tenant/notifications");
};

// 打开设置页面
const openSettings = () => {
  navigateTo("/pages/tenant/settings");
};

// 支付租金
const payRent = () => {
  uni.showToast({
    title: "租金支付功能开发中",
    icon: "none",
  });
};

// 支付水电费
const payUtility = () => {
  uni.showToast({
    title: "水电费支付功能开发中",
    icon: "none",
  });
};

// 初始化数据
const initData = async () => {
  try {
    // 显示加载状态
    uni.showLoading({
      title: "加载数据中...",
    });

    // 获取存储的用户信息和用户ID
    const storedUserInfo = uni.getStorageSync("userInfo");
    const userId = uni.getStorageSync("userId");

    if (storedUserInfo) {
      Object.assign(userInfo, storedUserInfo);
    } else if (userId) {
      // 如果只有userId没有完整用户信息，则设置userId
      userInfo.id = userId;
    } else {
      // 没有用户身份信息，提示登录
      uni.hideLoading();
      uni.showToast({
        title: "请先登录",
        icon: "none",
        duration: 2000,
      });

      // 延迟跳转到登录页
      setTimeout(() => {
        uni.navigateTo({
          url: "/pages/tenant/login",
        });
      }, 1500);

      return;
    }

    // 获取当前租房信息
    try {
      // 获取用户ID
      const userId = userInfo.id || uni.getStorageSync("userId");
      if (!userId) {
        console.error("未找到用户ID，无法获取租房信息");
        uni.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      // 添加用户ID作为查询参数
      const rentalResponse = await get<any>(
        `/tenant/rental/current?userId=${userId}`
      );
      console.log("租房信息接口返回:", rentalResponse);
      if (rentalResponse && rentalResponse.success && rentalResponse.data) {
        currentRental.value = rentalResponse.data;
      } else if (rentalResponse && rentalResponse.data) {
        // 兼容直接返回数据的情况
        currentRental.value = rentalResponse.data;
      }
    } catch (err) {
      console.error("获取租房信息失败:", err);
    }

    // 获取账单信息
    try {
      const userId = userInfo.id || uni.getStorageSync("userId");
      if (!userId) {
        console.error("未找到用户ID，无法获取账单信息");
        return;
      }

      const billResponse = await get<any>(
        `/tenant/bills/summary?userId=${userId}`
      );
      console.log("账单信息接口返回:", billResponse);
      if (billResponse && billResponse.success && billResponse.data) {
        Object.assign(billInfo, billResponse.data);
      } else if (billResponse && billResponse.data) {
        Object.assign(billInfo, billResponse.data);
      }
    } catch (err) {
      console.error("获取账单信息失败:", err);
    }

    // 获取维修请求
    try {
      const userId = userInfo.id || uni.getStorageSync("userId");
      if (!userId) {
        console.error("未找到用户ID，无法获取维修请求");
        return;
      }

      const maintenanceResponse = await get<any>(
        `/tenant/maintenance/recent?userId=${userId}`
      );
      console.log("维修请求接口返回:", maintenanceResponse);
      if (
        maintenanceResponse &&
        maintenanceResponse.success &&
        maintenanceResponse.data
      ) {
        maintenanceRequests.value = maintenanceResponse.data;
      } else if (maintenanceResponse && maintenanceResponse.data) {
        maintenanceRequests.value = maintenanceResponse.data;
      }
    } catch (err) {
      console.error("获取维修请求失败:", err);
    }

    // 获取公告
    try {
      const userId = userInfo.id || uni.getStorageSync("userId");
      if (!userId) {
        console.error("未找到用户ID，无法获取公告");
        return;
      }

      const announcementResponse = await get<any>(
        `/tenant/announcements/recent?userId=${userId}`
      );
      console.log("公告接口返回:", announcementResponse);
      if (
        announcementResponse &&
        announcementResponse.success &&
        announcementResponse.data
      ) {
        announcements.value = announcementResponse.data;
      } else if (announcementResponse && announcementResponse.data) {
        announcements.value = announcementResponse.data;
      }
    } catch (err) {
      console.error("获取公告失败:", err);
    }

    // 隐藏加载状态
    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    console.error("加载数据失败:", error);
    uni.showToast({
      title: "加载数据失败",
      icon: "none",
    });
  }
};

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.tenant-home {
  min-height: 100vh;
  background-color: #f6f9fc;
  padding-bottom: 40rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 30rpx;
  background-color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;

  .user-info {
    display: flex;
    align-items: center;

    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      margin-right: 20rpx;
      background-color: #eee;
    }

    .user-details {
      display: flex;
      flex-direction: column;

      .username {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 8rpx;
      }

      .user-role {
        font-size: 24rpx;
        color: #666;
        background-color: #eefbf2;
        color: #4cd964;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        display: inline-block;
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;

    .notification,
    .settings {
      position: relative;
      padding: 16rpx;

      .badge {
        position: absolute;
        top: 0;
        right: 5rpx;
        background-color: #ff3b30;
        color: #fff;
        font-size: 20rpx;
        min-width: 32rpx;
        height: 32rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 6rpx;
      }
    }
  }
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 0 30rpx 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .view-more {
      font-size: 24rpx;
      color: #4cd964;
    }
  }
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  padding: 0 30rpx;
  margin-bottom: 30rpx;

  .action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 150rpx;

    .action-icon {
      width: 100rpx;
      height: 100rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16rpx;
    }

    .action-title {
      font-size: 24rpx;
      color: #333;
    }
  }
}

.current-rental {
  display: flex;
  background-color: #fafcff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  .rental-image {
    width: 240rpx;
    height: 240rpx;
    object-fit: cover;
  }

  .rental-details {
    flex: 1;
    padding: 20rpx;
    position: relative;

    .rental-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }

    .rental-address {
      font-size: 24rpx;
      color: #666;
      margin-bottom: 10rpx;
    }

    .rental-info-row {
      display: flex;
      align-items: center;
      margin-bottom: 8rpx;
      font-size: 24rpx;

      .info-label {
        color: #999;
        width: 80rpx;
      }

      .info-value {
        color: #333;

        &.price {
          color: #ff9500;
          font-weight: 500;
        }
      }
    }

    .rental-status {
      position: absolute;
      top: 20rpx;
      right: 20rpx;
      font-size: 24rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;

      &.status-active {
        background-color: #eefbf2;
        color: #4cd964;
      }

      &.status-pending {
        background-color: #fff2e5;
        color: #ff9500;
      }

      &.status-expired {
        background-color: #fef0f0;
        color: #f56c6c;
      }
    }
  }
}

.empty-rental {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
  }

  .search-button {
    background-color: #4cd964;
    color: #fff;
    font-size: 28rpx;
    padding: 20rpx 60rpx;
    border-radius: 40rpx;
    border: none;
  }
}

.bill-cards {
  display: flex;
  gap: 20rpx;

  .bill-card {
    flex: 1;
    background-color: #fafcff;
    border-radius: 16rpx;
    padding: 20rpx;

    &.rent {
      border-left: 4rpx solid #4cd964;
    }

    &.utilities {
      border-left: 4rpx solid #007aff;
    }

    .bill-title {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;

      text {
        font-size: 26rpx;
        color: #333;
        margin-left: 10rpx;
      }
    }

    .bill-amount {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }

    .bill-due-date {
      display: flex;
      align-items: center;
      justify-content: space-between;

      text {
        font-size: 24rpx;
        color: #999;
      }

      .pay-button {
        font-size: 24rpx;
        color: #fff;
        background-color: #ff9500;
        border: none;
        border-radius: 30rpx;
        padding: 8rpx 20rpx;
        line-height: 1;
      }

      .paid-status {
        font-size: 24rpx;
        color: #4cd964;
      }
    }
  }
}

.maintenance-list {
  background-color: #fafcff;
  border-radius: 16rpx;
  overflow: hidden;

  .maintenance-item {
    padding: 20rpx;
    border-bottom: 2rpx solid #f0f0f0;
    position: relative;

    &:last-child {
      border-bottom: none;
    }

    .maintenance-status {
      position: absolute;
      top: 20rpx;
      right: 20rpx;
      font-size: 24rpx;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;

      &.status-pending {
        background-color: #fff2e5;
        color: #ff9500;
      }

      &.status-processing {
        background-color: #e6f4ff;
        color: #007aff;
      }

      &.status-completed {
        background-color: #eefbf2;
        color: #4cd964;
      }

      &.status-rejected {
        background-color: #fef0f0;
        color: #f56c6c;
      }
    }

    .maintenance-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 10rpx;
      padding-right: 100rpx;
    }

    .maintenance-date {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.empty-maintenance {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
  }

  .request-button {
    background-color: #4cd964;
    color: #fff;
    font-size: 28rpx;
    padding: 20rpx 60rpx;
    border-radius: 40rpx;
    border: none;
  }
}

.announcement-list {
  background-color: #fafcff;
  border-radius: 16rpx;
  overflow: hidden;

  .announcement-item {
    padding: 20rpx;
    border-bottom: 2rpx solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .announcement-content {
      margin-bottom: 16rpx;

      .announcement-title {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 10rpx;
        display: block;
      }

      .announcement-preview {
        font-size: 24rpx;
        color: #666;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    .announcement-time {
      font-size: 22rpx;
      color: #999;
    }
  }
}

.empty-announcements {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style> 