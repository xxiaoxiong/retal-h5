<template>
  <view class="inquiries-list-page">
    <view class="header">
      <view class="title">咨询记录</view>
      <!-- 可以添加筛选功能 -->
    </view>

    <view v-if="loading && inquiries.length === 0" class="loading-placeholder">加载中...</view>
    <view v-else-if="inquiries.length === 0" class="empty-placeholder">暂无咨询记录</view>
    <view v-else class="inquiries-list" @scrolltolower="onScrollToBottom">
      <view v-for="inquiry in inquiries" :key="inquiry.id" class="inquiry-item" @click="viewInquiryDetail(inquiry.id)">
        <view class="inquiry-header">
          <view class="property-info">
            <text class="property-name">{{ inquiry.property?.title || '通用咨询' }}</text>
          </view>
          <view class="time">{{ formatTime(inquiry.created_at) }}</view>
        </view>
        <view class="inquiry-content">
          <view class="question">{{ inquiry.question }}</view>
          <view class="answer">{{ inquiry.ai_response }}</view>
        </view>
        <view class="inquiry-footer">
          <view class="tenant-info">
            <image class="avatar" :src="inquiry.tenant?.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
            <text class="name">{{ inquiry.tenant?.nickname || '匿名用户' }}</text>
          </view>
          <view class="status-tag">{{ inquiry.property ? '房源咨询' : '通用咨询' }}</view>
        </view>
      </view>
      <view v-if="loadingMore" class="loading-more">加载中...</view>
      <view v-if="!hasMore" class="no-more">没有更多了</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get } from '../../utils/request';

interface Tenant {
  id: string;
  nickname?: string;
  avatar_url?: string;
}

interface Property {
  id: string;
  title: string;
}

interface Inquiry {
  id: string;
  created_at: string;
  tenant?: Tenant;
  property?: Property;
  question: string;
  ai_response?: string;
}

const inquiries = ref<Inquiry[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 10;

// 获取咨询记录列表
const fetchInquiries = async (page = 1) => {
  if (page === 1) {
    loading.value = true;
    inquiries.value = []; // 重置列表
  } else {
    loadingMore.value = true;
  }

  console.log(`正在获取咨询记录: page=${page}, pageSize=${pageSize}`);

  try {
    const response = await get<{success?: boolean; data?: Inquiry[]}>('/inquiries', { page, limit: pageSize });
    
    if (response && response.success) {
      const newInquiries = response.data || [];
      inquiries.value = page === 1 ? newInquiries : [...inquiries.value, ...newInquiries];
      hasMore.value = newInquiries.length === pageSize;
    } else {
      console.error('获取咨询记录失败:', response);
      uni.showToast({ title: '加载咨询记录失败', icon: 'none' });
    }
  } catch (error) {
    console.error('获取咨询记录错误:', error);
    uni.showToast({ title: '网络错误', icon: 'none' });
    
    // 如果API不可用，使用模拟数据 (仅开发阶段)
    const isDevelopment = true; // 开发环境标志
    if (isDevelopment) {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const mockData: Inquiry[] = Array.from({ length: pageSize }).map((_, idx) => ({
        id: `inq_${idx + 1}`,
        created_at: new Date(Date.now() - idx * 3600000).toISOString(),
        tenant: {
          id: `tenant_${idx % 5 + 1}`,
          nickname: `租客${idx % 5 + 1}`,
          avatar_url: `/static/avatar${idx % 5 + 1}.png`,
        },
        property: idx % 3 === 0 ? undefined : {
          id: `prop_${idx % 7 + 1}`,
          title: `示例房源 ${idx % 7 + 1}`,
        },
        question: `这是一个示例咨询问题 ${idx + 1}，关于${idx % 3 === 0 ? '通用问题' : '特定房源'}的咨询。`,
        ai_response: `这是系统回复 ${idx + 1}，提供了关于${idx % 3 === 0 ? '通用问题' : '特定房源'}的详细信息和建议。`,
      }));
      
      inquiries.value = page === 1 ? mockData : [...inquiries.value, ...mockData];
      hasMore.value = page < 3;
    }
  } finally {
    if (page === 1) {
      loading.value = false;
    } else {
      loadingMore.value = false;
    }
  }
};

// 加载更多
const loadMoreInquiries = () => {
  if (!hasMore.value || loadingMore.value) {
    return;
  }
  currentPage.value++;
  fetchInquiries(currentPage.value);
};

// 查看咨询详情
const viewInquiryDetail = (id: string) => {
  console.log(`View inquiry detail: ${id}`);
  uni.navigateTo({ url: `/pages/landlord/inquiry-detail?id=${id}` });
  // 实际项目中可能需要实现详情页面
  // uni.showToast({ title: '详情页面待实现', icon: 'none' });
};

// 格式化时间
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 页面加载时获取数据
onMounted(() => {
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo || userInfo.role !== 'landlord') {
    uni.showToast({ 
      title: '请先登录房东账号', 
      icon: 'none' 
    });
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/landlord/login' });
    }, 1500);
    return;
  }
  fetchInquiries();
});

// 监听页面滚动到底部 (通过添加滚动事件到列表)
const onScrollToBottom = () => {
  if (hasMore.value && !loadingMore.value) {
    loadMoreInquiries();
  }
};

</script>

<style lang="scss" scoped>
.inquiries-list-page {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header {
  background-color: #fff;
  padding: 15px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;

  .title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
}

.loading-placeholder,
.empty-placeholder {
  text-align: center;
  color: #999;
  padding: 50px 0;
  font-size: 14px;
}

.inquiries-list {
  padding: 10px;
}

.inquiry-item {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .inquiry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .property-info {
      .property-name {
        font-size: 16px;
        font-weight: bold;
        color: #333;
      }
    }

    .time {
      font-size: 12px;
      color: #999;
    }
  }

  .inquiry-content {
    margin-bottom: 10px;

    .question {
      font-size: 14px;
      color: #333;
      margin-bottom: 5px;
    }

    .answer {
      font-size: 13px;
      color: #666;
      background-color: #f9f9f9;
      padding: 8px;
      border-radius: 4px;
      // 限制显示行数
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .inquiry-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .tenant-info {
      display: flex;
      align-items: center;

      .avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        margin-right: 5px;
      }

      .name {
        font-size: 12px;
        color: #666;
      }
    }

    .status-tag {
      font-size: 12px;
      color: #409eff;
      background-color: #ecf5ff;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

.loading-more,
.no-more {
  text-align: center;
  color: #999;
  padding: 10px 0;
  font-size: 12px;
}
</style>
