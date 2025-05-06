<template>
  <view class="landlord-login-page">
    <view class="login-header">
      <image src="/static/landlord-logo.png" mode="aspectFit" class="logo"></image>
      <text class="welcome-text">欢迎使用房东管理系统</text>
    </view>
    
    <view class="login-container">
      <view class="title">房东登录</view>
      
      <view class="form-group">
        <view class="form-item">
          <uni-icons type="person" size="20" color="#409EFF"></uni-icons>
          <input 
            type="text" 
            v-model="formData.username" 
            placeholder="请输入用户名/手机号" 
            class="input"
            focus 
          />
        </view>

        <view class="form-item">
          <uni-icons type="locked" size="20" color="#409EFF"></uni-icons>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="formData.password" 
            placeholder="请输入密码" 
            class="input" 
          />
          <view class="password-toggle" @click="togglePasswordVisibility">
            <uni-icons :type="showPassword ? 'eye-filled' : 'eye-slash-filled'" size="20" color="#909399"></uni-icons>
          </view>
        </view>
      </view>

      <view class="error-message" v-if="errorMsg">
        <uni-icons type="info-filled" size="14" color="#F56C6C"></uni-icons>
        <text>{{ errorMsg }}</text>
      </view>

      <button 
        class="login-button" 
        @click="handleLogin" 
        :disabled="loading || !formData.username || !formData.password"
        :class="{ loading: loading }"
      >
        <view class="button-content">
          <view class="loading-spinner" v-if="loading"></view>
          <text>{{ loading ? '登录中' : '登录' }}</text>
        </view>
      </button>

      <view class="extra-links">
        <text @click="forgotPassword">忘记密码?</text>
        <text @click="goToRegister">注册账号</text>
      </view>
    </view>
    
    <view class="footer">
      <text>智慧租房平台 © 2023</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { post } from '../../utils/request';

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    [key: string]: any;
  };
  message?: string;
}

const loading = ref(false);
const errorMsg = ref('');
const showPassword = ref(false);

const formData = reactive({
  username: '',
  password: '',
});

// 切换密码显示/隐藏
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 处理登录
const handleLogin = async () => {
  errorMsg.value = '';
  
  // 简单的表单验证
  if (!formData.username.trim()) {
    errorMsg.value = '请输入用户名';
    return;
  }
  
  if (!formData.password.trim()) {
    errorMsg.value = '请输入密码';
    return;
  }

  try {
    loading.value = true;
    console.log('尝试房东登录:', formData);

    try {
      // 发送API请求 
      const response = await post<LoginResponse>('/auth/login/password', {
        username: formData.username,
        password: formData.password,
      });
      
      console.log('服务器响应:', response);
      
      if (response && response.success && response.token) {
        // 保存登录凭证和用户信息
        uni.setStorageSync('token', response.token);
        if (response.user) {
          uni.setStorageSync('userInfo', response.user);
        }

        uni.showToast({ title: '登录成功', icon: 'success' });
        console.log('准备跳转到dashboard页面');
        
        // 使用setTimeout确保toast显示完成后再跳转
        setTimeout(() => {
          // 方案1：切换到tabBar页面
          try {
            uni.switchTab({
              url: '/pages/landlord/dashboard',
              success() {
                console.log('跳转成功');
              },
              fail(err) {
                console.error('跳转失败:', err);
                // 如果失败，尝试使用navigateTo
                uni.navigateTo({
                  url: '/pages/landlord/dashboard'
                });
              }
            });
          } catch (err) {
            console.error('跳转出错:', err);
          }
        }, 1500);
      } else {
        // API请求成功但登录失败
        errorMsg.value = response.message || '登录失败，请检查用户名和密码';
        uni.showToast({ title: errorMsg.value, icon: 'none' });
      }
    } catch (apiError: any) {
      console.error('API请求失败:', apiError);
      
      // 连接失败时使用模拟登录 (仅开发阶段使用)
      if (formData.username === 'landlord' && formData.password === 'password') {
        console.log('使用模拟登录 (API不可用)');
        uni.setStorageSync('token', 'mock-token-for-development-only');
        uni.setStorageSync('userInfo', { id: '1', username: formData.username, role: 'landlord' });
        
        uni.showToast({ title: '(模拟)登录成功', icon: 'success' });
        console.log('准备跳转到dashboard页面(模拟)');
        
        // 使用setTimeout确保toast显示完成后再跳转
          try {
            uni.switchTab({
              url: '/pages/landlord/dashboard',
              success() {
                console.log('跳转成功(模拟)');
              },
              fail(err) {
                console.error('跳转失败(模拟):', err);
                // 如果失败，尝试使用navigateTo
                uni.navigateTo({
                  url: '/pages/landlord/dashboard'
                });
              }
            });
          } catch (err) {
            console.error('跳转出错(模拟):', err);
          }
      } else {
        errorMsg.value = '服务器连接失败或用户名密码错误';
        uni.showToast({ title: errorMsg.value, icon: 'none' });
      }
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到注册
const goToRegister = () => {
  uni.navigateTo({ url: '/pages/landlord/register' });
};

// 忘记密码 (待实现)
const forgotPassword = () => {
  uni.showToast({ title: '功能待实现', icon: 'none' });
};
</script>

<style lang="scss" scoped>
.landlord-login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(to bottom, #f6f9fc, #eef2f7);
  padding: 40rpx;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60rpx;
  margin-bottom: 60rpx;
  
  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 24rpx;
  }
  
  .welcome-text {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
  }
}

.login-container {
  flex: 1;
  background-color: #fff;
  padding: 50rpx 40rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 60rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 60rpx;
  color: #333;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -16rpx;
    width: 60rpx;
    height: 6rpx;
    background-color: #409EFF;
    border-radius: 3rpx;
  }
}

.form-group {
  margin-bottom: 30rpx;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 24rpx 30rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  transition: all 0.3s;
  border: 2rpx solid transparent;
  
  &:focus-within {
    border-color: #409EFF;
    background-color: rgba(64, 158, 255, 0.05);
    box-shadow: 0 0 0 2rpx rgba(64, 158, 255, 0.1);
  }
  
  .input {
    flex: 1;
    height: 60rpx;
    margin-left: 20rpx;
    font-size: 28rpx;
    background: transparent;
    border: none;
  }
  
  .password-toggle {
    padding: 10rpx;
  }
}

.error-message {
  display: flex;
  align-items: center;
  color: #F56C6C;
  font-size: 24rpx;
  margin: 20rpx 0 30rpx;
  padding: 20rpx;
  background-color: #FEF0F0;
  border-radius: 8rpx;
  
  text {
    margin-left: 10rpx;
  }
}

.login-button {
  width: 100%;
  height: 90rpx;
  background-color: #409EFF;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 12rpx;
  margin-top: 20rpx;
  margin-bottom: 30rpx;
  border: none;
  transition: all 0.3s;
  
  &.loading {
    background-color: #79bbff;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &[disabled] {
    background-color: #a0cfff;
    opacity: 0.7;
  }
  
  .button-content {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  
  .loading-spinner {
    width: 30rpx;
    height: 30rpx;
    border: 3rpx solid rgba(255, 255, 255, 0.3);
    border-top: 3rpx solid #fff;
    border-radius: 50%;
    margin-right: 12rpx;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.extra-links {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  
  text {
    color: #909399;
    padding: 10rpx;
    
    &:active {
      color: #409EFF;
    }
  }
}

.footer {
  text-align: center;
  padding: 30rpx 0;
  
  text {
    font-size: 24rpx;
    color: #909399;
  }
}
</style>

