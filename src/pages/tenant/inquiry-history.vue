<template>
  <view class="inquiry-history-page">
    <view class="page-header">
      <text class="page-title">咨询历史</text>
    </view>

    <view class="content-section">
      <view v-if="loading" class="loading">
        <uni-icons type="spinner-cycle" size="30" color="#2196f3"></uni-icons>
        <text>加载中...</text>
      </view>

      <view v-else-if="inquiryList.length === 0" class="empty-state">
        <uni-icons type="chat" size="50" color="#ccc"></uni-icons>
        <text>暂无咨询记录</text>
        <button class="action-button" @click="navigateToPropertyList">
          去看房源
        </button>
      </view>

      <view v-else class="inquiry-list">
        <view
          class="inquiry-item"
          v-for="(item, index) in inquiryList"
          :key="index"
          @click="navigateToDetail(item.id)"
        >
          <view class="inquiry-content">
            <text class="inquiry-title">{{
              item.propertyTitle || "未知房源"
            }}</text>
            <text class="inquiry-time">{{ formatTime(item.createdAt) }}</text>
            <text class="inquiry-preview">{{
              item.lastMessage || "暂无消息"
            }}</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { formatDate } from "../../utils/date";

interface InquiryItem {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  lastMessage?: string;
  createdAt: string | number;
  updatedAt?: string | number;
}

const loading = ref(true);
const inquiryList = ref<InquiryItem[]>([]);

onMounted(() => {
  fetchInquiryHistory();
});

// 获取咨询历史
const fetchInquiryHistory = async () => {
  loading.value = true;
  try {
    // 这里应该是实际的API调用
    // const response = await get('/inquiries/history');
    // inquiryList.value = response.data || [];

    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟
    inquiryList.value = [
      {
        id: "1",
        propertyId: "101",
        propertyTitle: "阳光花园两室一厅",
        lastMessage: "请问这个房子朝向如何？",
        createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1天前
      },
      {
        id: "2",
        propertyId: "102",
        propertyTitle: "江景豪华套房",
        lastMessage: "这个房子什么时候可以看？",
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3天前
      },
    ];
  } catch (error) {
    console.error("获取咨询历史失败:", error);
    uni.showToast({
      title: "获取历史记录失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

// 格式化时间显示
const formatTime = (timestamp: string | number) => {
  if (!timestamp) return "";
  return formatDate(new Date(timestamp));
};

// 导航到房源列表
const navigateToPropertyList = () => {
  uni.navigateTo({
    url: "/pages/tenant/property-list",
  });
};

// 导航到咨询详情
const navigateToDetail = (inquiryId: string) => {
  uni.navigateTo({
    url: `/pages/inquiry/chat?inquiryId=${inquiryId}`,
  });
};
</script>

<style lang="scss" scoped>
.inquiry-history-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.content-section {
  padding: 15px;
}

.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;

  text {
    margin-top: 15px;
    color: #999;
    font-size: 14px;
  }
}

.action-button {
  margin-top: 20px;
  background-color: #1989fa;
  color: white;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
}

.inquiry-list {
  margin-top: 10px;
}

.inquiry-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.inquiry-content {
  flex: 1;
}

.inquiry-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.inquiry-time {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 8px;
}

.inquiry-preview {
  font-size: 14px;
  color: #666;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 