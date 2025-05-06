<template>
  <view class="page-container">
    <view class="header">
      <text class="title">我的咨询</text>
    </view>
    <view class="content">
      <view class="empty-state" v-if="inquiries.length === 0">
        <text class="empty-text">暂无咨询记录</text>
        <navigator url="/pages/tenant/property-list" class="action-button">
          <text class="button-text">去找房源</text>
        </navigator>
      </view>
      <view class="inquiry-list" v-else>
        <navigator
          v-for="(inquiry, index) in inquiries"
          :key="index"
          class="inquiry-item"
          :url="'/pages/inquiry/chat?id=' + inquiry.id"
        >
          <view class="inquiry-header">
            <text class="property-name">{{ inquiry.propertyName }}</text>
            <text class="time">{{ inquiry.lastMessageTime }}</text>
          </view>
          <view class="inquiry-content">
            <text class="message">{{ inquiry.lastMessage }}</text>
            <view class="badge" v-if="inquiry.unread > 0">
              <text class="badge-text">{{ inquiry.unread }}</text>
            </view>
          </view>
        </navigator>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

// 模拟数据
const inquiries = ref([
  {
    id: 1,
    propertyName: "朝阳区三里屯SOHO 2室1厅",
    lastMessage: "请问这套房子可以短租吗？",
    lastMessageTime: "昨天 15:30",
    unread: 2,
  },
  {
    id: 2,
    propertyName: "海淀区中关村创业大厦1室1厅",
    lastMessage: "好的，周六上午10点见。",
    lastMessageTime: "3天前",
    unread: 0,
  },
]);

onLoad(() => {
  console.log("Inquiry index page loaded");
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

.inquiry-list {
  margin-top: 20px;
}

.inquiry-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.inquiry-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.property-name {
  font-size: 16px;
  font-weight: bold;
  flex: 1;
}

.time {
  font-size: 12px;
  color: #999;
}

.inquiry-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message {
  font-size: 14px;
  color: #666;
  flex: 1;
}

.badge {
  background-color: #f44336;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-text {
  color: #fff;
  font-size: 12px;
}
</style> 