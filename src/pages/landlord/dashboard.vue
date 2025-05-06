<template>
  <view class="landlord-dashboard-page">
    <view class="header">
      <view class="welcome-message">欢迎回来，房东！</view>
      <!-- 可以添加头像和设置入口 -->
    </view>

    <!-- 统计卡片 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="apiError" class="error-container">
      <text class="error-message">{{ apiError }}</text>
      <button @click="fetchStats" class="retry-button">重试</button>
    </view>

    <view v-else>
      <view class="stats-grid">
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/properties')"
        >
          <view class="value">{{ stats.total_properties || 0 }}</view>
          <view class="label">总房源数</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/properties')"
        >
          <view class="value">{{ stats.available_properties || 0 }}</view>
          <view class="label">可出租房源</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/properties')"
        >
          <view class="value">{{ stats.total_views || 0 }}</view>
          <view class="label">总浏览量</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/inquiries')"
        >
          <view class="value">{{ stats.total_inquiries || 0 }}</view>
          <view class="label">总咨询数</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/appointments')"
        >
          <view class="value">{{ stats.total_appointments || 0 }}</view>
          <view class="label">总预约数</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/appointments')"
        >
          <view class="value">{{ stats.pending_appointments || 0 }}</view>
          <view class="label">待处理预约</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/appointments')"
        >
          <view class="value">{{ stats.upcoming_appointments || 0 }}</view>
          <view class="label">即将到来的预约</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/inquiries')"
        >
          <view class="value">{{ stats.recent_inquiries || 0 }}</view>
          <view class="label">最近咨询</view>
        </view>
        <view
          class="stat-card"
          @click="navigateTo('/pages/landlord/appointments')"
        >
          <view class="value">{{ stats.recent_appointments || 0 }}</view>
          <view class="label">最近预约</view>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="quick-links">
        <view class="section-title">管理中心</view>
        <view class="menu-list">
          <view
            class="menu-item"
            @click="navigateTo('/pages/landlord/properties')"
          >
            <text class="menu-title">房源管理</text>
            <text class="arrow">></text>
          </view>
          <view
            class="menu-item"
            @click="navigateTo('/pages/landlord/inquiries')"
          >
            <text class="menu-title">咨询记录</text>
            <text class="arrow">></text>
          </view>
          <view
            class="menu-item"
            @click="navigateTo('/pages/landlord/appointments')"
          >
            <text class="menu-title">预约管理</text>
            <text class="arrow">></text>
          </view>
          <view
            class="menu-item"
            @click="navigateTo('/pages/landlord/banner-management')"
          >
            <text class="menu-title">轮播图管理</text>
            <text class="arrow">></text>
          </view>
        </view>
      </view>

      <!-- 显示数据来源 -->
      <view class="data-source">
        <text v-if="isUsingBackupData" class="using-backup"
          >使用本地模拟数据显示</text
        >
        <text v-else class="using-real">使用接口数据显示</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { get } from "../../utils/request";

interface DashboardStats {
  total_properties: number;
  available_properties: number;
  total_views: number;
  total_inquiries: number;
  total_appointments: number;
  pending_appointments: number;
  upcoming_appointments: number;
  recent_inquiries: number;
  recent_appointments: number;
}

const stats = ref<DashboardStats>({
  // 初始化空数据
  total_properties: 0,
  available_properties: 0,
  total_views: 0,
  total_inquiries: 0,
  total_appointments: 0,
  pending_appointments: 0,
  upcoming_appointments: 0,
  recent_inquiries: 0,
  recent_appointments: 0,
});
const loading = ref(false);
const apiError = ref("");
const isUsingBackupData = ref(false);

// 获取统计数据
const fetchStats = async () => {
  loading.value = true;
  apiError.value = "";
  isUsingBackupData.value = false;

  try {
    // 获取认证令牌
    const token = uni.getStorageSync("token");
    if (!token) {
      apiError.value = "未找到认证信息，请先登录";
      useBackupData();
      return;
    }

    // 调整响应类型以匹配实际API返回
    interface ApiResponse {
      success: boolean;
      stats?: DashboardStats;
    }

    const response = await get<ApiResponse>("/stats/overview");

    if (response && response.success) {
      // 使用真实API数据
      if (response.stats) {
        stats.value = response.stats;
      } else {
        apiError.value = "API返回数据格式不包含stats字段";
        useBackupData();
      }
    } else if (
      response &&
      typeof response === "object" &&
      "total_properties" in response
    ) {
      // 直接返回了数据对象而不是包装的API响应
      stats.value = response as unknown as DashboardStats;
    } else {
      // API返回了响应但格式不正确或操作不成功
      if (response && !response.success) {
        apiError.value = `服务器返回错误`;
      } else {
        apiError.value = "获取数据失败，格式不正确";
      }
      // 使用模拟数据作为后备
      useBackupData();
    }
  } catch (error) {
    // 网络错误或其他异常
    apiError.value = "无法连接到服务器，使用本地数据进行展示";
    // 使用模拟数据作为后备
    useBackupData();
  } finally {
    loading.value = false;
  }
};

// 使用模拟数据作为后备
const useBackupData = () => {
  isUsingBackupData.value = true;
  stats.value = {
    total_properties: 15,
    available_properties: 12,
    total_views: 150,
    total_inquiries: 25,
    total_appointments: 8,
    pending_appointments: 3,
    upcoming_appointments: 2,
    recent_inquiries: 5,
    recent_appointments: 1,
  };
};

// 导航到指定页面
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

// 检查登录状态
const checkLoginStatus = () => {
  const token = uni.getStorageSync("token");
  if (!token) {
    uni.showModal({
      title: "未登录",
      content: "您尚未登录或登录已过期，是否前往登录页面？",
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: "/pages/landlord/login" });
        }
      },
    });
    return false;
  }
  return true;
};

// 页面加载时获取数据
onMounted(() => {
  if (checkLoginStatus()) {
    fetchStats();
  } else {
    // 未登录时直接使用模拟数据
    useBackupData();
  }
});
</script>

<style lang="scss" scoped>
.landlord-dashboard-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 20px;
}

.header {
  background: linear-gradient(to right, #409eff, #6abcff);
  color: #fff;
  padding: 25px 15px;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
  margin-bottom: -10px; // 让下面的卡片部分重叠

  .welcome-message {
    font-size: 20px;
    font-weight: bold;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top: 3px solid #409eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }

  .loading-text {
    color: #666;
  }
}

.error-container {
  background-color: #fff;
  margin: 20px 15px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;

  .error-message {
    color: #f56c6c;
    margin-bottom: 15px;
    text-align: center;
  }

  .retry-button {
    background-color: #409eff;
    color: white;
    padding: 6px 16px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 15px;
  position: relative; // 确保在header之上
  z-index: 1;

  .stat-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 15px 10px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .value {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .label {
      font-size: 12px;
      color: #888;
    }
  }
}

.quick-links {
  margin: 15px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    padding: 15px 15px 10px;
  }
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: #f8f8f8;
  }
}

.menu-title {
  font-size: 15px;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 16px;
}

.data-source {
  text-align: center;
  padding: 10px;
  margin-top: 20px;

  text {
    font-size: 12px;
  }

  .using-backup {
    color: #e6a23c;
  }

  .using-real {
    color: #67c23a;
  }
}
</style>
