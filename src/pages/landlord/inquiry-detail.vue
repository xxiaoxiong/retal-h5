<template>
  <view class="inquiry-detail-page">
    <view class="header">
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="20" color="#333"></uni-icons>
      </view>
      <view class="title">咨询详情</view>
    </view>

    <view v-if="loading" class="loading-placeholder">加载中...</view>
    <view v-else-if="!inquiry" class="empty-placeholder">未找到咨询记录</view>
    <view v-else class="inquiry-content">
      <!-- 咨询基本信息 -->
      <view class="inquiry-header">
        <view class="property-info" v-if="inquiry.property">
          <view class="property-title">{{ inquiry.property?.title }}</view>
          <view class="inquiry-time">{{ formatTime(inquiry.created_at) }}</view>
        </view>
        <view class="property-info" v-else>
          <view class="property-title">通用咨询</view>
          <view class="inquiry-time">{{ formatTime(inquiry.created_at) }}</view>
        </view>
        <view class="tenant-info">
          <image class="avatar" :src="inquiry.tenant?.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
          <text class="tenant-name">{{ inquiry.tenant?.nickname || '匿名用户' }}</text>
        </view>
      </view>

      <!-- 咨询内容和回复 -->
      <view class="message-container">
        <!-- 租客咨询内容 -->
        <view class="message tenant-message">
          <view class="message-content">
            <text class="message-text">{{ inquiry.question }}</text>
            <text class="message-time">{{ formatTime(inquiry.created_at) }}</text>
          </view>
        </view>

        <!-- AI回复 -->
        <view class="message ai-message" v-if="inquiry.ai_response">
          <view class="message-content">
            <view class="message-sender">AI助手</view>
            <text class="message-text">{{ inquiry.ai_response }}</text>
            <text class="message-time">{{ formatTime(inquiry.created_at) }}</text>
          </view>
        </view>

        <!-- 房东回复列表 -->
        <view class="message landlord-message" v-for="(reply, index) in landlordReplies" :key="index">
          <view class="message-content">
            <view class="message-sender">我的回复</view>
            <text class="message-text">{{ reply.content }}</text>
            <text class="message-time">{{ formatTime(reply.created_at) }}</text>
          </view>
        </view>
      </view>

      <!-- 回复区域 -->
      <view class="reply-container">
        <textarea
          v-model="replyContent"
          class="reply-input"
          placeholder="输入回复内容..."
          auto-height
        ></textarea>
        <view class="reply-actions">
          <button class="reply-button" @click="sendReply" :disabled="!replyContent.trim() || sending">
            {{ sending ? '发送中...' : '回复' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, post } from '../../utils/request';

// 咨询ID
const inquiryId = ref('');
const loading = ref(true);
const sending = ref(false);
const replyContent = ref('');

// 咨询详情
const inquiry = ref<any>(null);
const landlordReplies = ref<any[]>([]); 

// 获取咨询详情
const fetchInquiryDetail = async () => {
  if (!inquiryId.value) return;
  
  loading.value = true;
  try {
    const response = await get<{success?: boolean; data?: any}>(`/inquiries/${inquiryId.value}`);
    
    if (response && response.success && response.data) {
      inquiry.value = response.data;
      
      // 获取房东回复列表
      await fetchReplies();
    } else {
      uni.showToast({ title: '获取咨询详情失败', icon: 'none' });
      
      // 开发环境使用模拟数据
      setTimeout(() => {
        inquiry.value = {
          id: inquiryId.value,
          created_at: new Date().toISOString(),
          tenant: {
            id: 'tenant_1',
            nickname: '测试租客',
            avatar_url: '/static/avatar1.png',
          },
          property: {
            id: 'prop_1',
            title: '示例房源名称',
          },
          question: '您好，我想咨询一下这套房源的具体位置和周边环境，以及是否能够短期租住？',
          ai_response: '您好，关于这套房源的位置在城市中心区域，周边有购物中心、医院和公园。根据房东设置，该房源支持最短3个月的租期。如果您有更具体的问题，房东看到后会进一步回复您。',
        };
        landlordReplies.value = [];
        loading.value = false;
      }, 500);
    }
  } catch (error) {
    console.error('获取咨询详情失败:', error);
    uni.showToast({ title: '网络错误', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// 获取房东回复列表
const fetchReplies = async () => {
  try {
    const response = await get<{success?: boolean; data?: any[]}>(`/inquiries/${inquiryId.value}/replies`);
    
    if (response && response.success && response.data) {
      landlordReplies.value = response.data;
    } else {
      console.error('获取回复列表失败:', response);
    }
  } catch (error) {
    console.error('获取回复列表错误:', error);
  }
};

// 发送回复
const sendReply = async () => {
  if (!replyContent.value.trim()) {
    uni.showToast({ title: '请输入回复内容', icon: 'none' });
    return;
  }
  
  sending.value = true;
  try {
    const data = {
      inquiry_id: inquiryId.value,
      content: replyContent.value.trim()
    };
    
    const response = await post<{success?: boolean}>(`/inquiries/${inquiryId.value}/reply`, data);
    
    if (response && response.success) {
      uni.showToast({ title: '回复成功', icon: 'success' });
      
      // 在前端添加这条回复
      landlordReplies.value.push({
        id: `reply_${Date.now()}`,
        inquiry_id: inquiryId.value,
        content: replyContent.value.trim(),
        created_at: new Date().toISOString(),
        sender_type: 'landlord'
      });
      
      // 清空输入框
      replyContent.value = '';
    } else {
      uni.showToast({ title: '回复失败', icon: 'none' });
    }
  } catch (error) {
    console.error('发送回复失败:', error);
    uni.showToast({ title: '网络错误', icon: 'none' });
    
    // 开发环境下模拟成功
    const isDevelopment = true;
    if (isDevelopment) {
      // 在前端添加这条回复
      landlordReplies.value.push({
        id: `reply_${Date.now()}`,
        inquiry_id: inquiryId.value,
        content: replyContent.value.trim(),
        created_at: new Date().toISOString(),
        sender_type: 'landlord'
      });
      
      // 清空输入框
      replyContent.value = '';
      uni.showToast({ title: '模拟回复成功', icon: 'success' });
    }
  } finally {
    sending.value = false;
  }
};

// 格式化时间
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 页面加载时获取数据
onMounted(() => {
  // 获取路由参数
  const query = uni.getEnterOptionsSync().query as any;
  if (query && query.id) {
    inquiryId.value = query.id;
    fetchInquiryDetail();
  } else {
    loading.value = false;
    uni.showToast({
      title: '未指定咨询ID',
      icon: 'none'
    });
  }
});
</script>

<style lang="scss" scoped>
.inquiry-detail-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  padding: 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;

  .back-button {
    width: 40px;
  }

  .title {
    flex: 1;
    text-align: center;
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

.inquiry-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.inquiry-header {
  background-color: #fff;
  padding: 15px;
  margin-bottom: 10px;

  .property-info {
    margin-bottom: 15px;

    .property-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .inquiry-time {
      font-size: 12px;
      color: #999;
    }
  }

  .tenant-info {
    display: flex;
    align-items: center;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 10px;
    }

    .tenant-name {
      font-size: 14px;
      color: #333;
    }
  }
}

.message-container {
  flex: 1;
  padding: 10px 15px;
  overflow-y: auto;
}

.message {
  margin-bottom: 20px;
  display: flex;

  &.tenant-message {
    justify-content: flex-start;

    .message-content {
      background-color: #fff;
      color: #333;
    }
  }

  &.ai-message {
    justify-content: flex-start;

    .message-content {
      background-color: #f1f8ff;
      color: #333;
    }
  }

  &.landlord-message {
    justify-content: flex-end;

    .message-content {
      background-color: #007AFF;
      color: #fff;
    }
    
    .message-time {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .message-content {
    max-width: 75%;
    padding: 12px;
    border-radius: 8px;
    word-break: break-all;

    .message-sender {
      font-size: 12px;
      margin-bottom: 5px;
      opacity: 0.8;
    }

    .message-text {
      font-size: 14px;
      line-height: 1.5;
    }

    .message-time {
      font-size: 10px;
      color: #999;
      text-align: right;
      margin-top: 5px;
    }
  }
}

.reply-container {
  background-color: #fff;
  padding: 15px;
  border-top: 1px solid #eee;

  .reply-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    min-height: 80px;
  }

  .reply-actions {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;

    .reply-button {
      background-color: #007AFF;
      color: #fff;
      padding: 8px 20px;
      border-radius: 4px;
      font-size: 14px;
      
      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style> 