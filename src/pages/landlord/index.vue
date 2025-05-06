<template>
  <view class="page-container">
    <view class="header">
      <text class="title">房东中心</text>
    </view>
    <view class="content">
      <navigator url="/pages/landlord/dashboard" class="menu-item">
        <text class="menu-text">控制面板</text>
      </navigator>
      <navigator url="/pages/landlord/properties" class="menu-item">
        <text class="menu-text">我的房源</text>
      </navigator>
      <navigator url="/pages/landlord/appointments" class="menu-item">
        <text class="menu-text">预约管理</text>
      </navigator>
      <navigator url="/pages/landlord/inquiries" class="menu-item">
        <text class="menu-text">咨询管理</text>
      </navigator>
      <navigator url="/pages/landlord/banner-management" class="menu-item">
        <text class="menu-text">轮播图管理</text>
      </navigator>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";

onLoad(() => {
  console.log("Landlord index page loaded");
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

.content {
  display: flex;
  flex-direction: column;
}

.menu-item {
  background-color: #f8f8f8;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-text {
  font-size: 16px;
}
</style> 