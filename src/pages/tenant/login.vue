<template>
  <view class="tenant-login-page">
    <view class="login-header">
      <image src="/static/tenant-logo.png" mode="aspectFit" class="logo"></image>
      <view class="header-text">
        <text class="welcome-text">欢迎回来</text>
        <text class="subtitle">登录您的租户账号</text>
      </view>
    </view>
    
    <view class="login-container">
      <view class="form-group">
        <view class="form-item" :class="{ active: formFocus.username }">
          <uni-icons type="person" size="22" color="#ff2442"></uni-icons>
          <input 
            type="text" 
            v-model="username" 
            placeholder="用户名/手机号" 
            class="input"
            @focus="formFocus.username = true"
            @blur="formFocus.username = false"
            focus
          />
        </view>

        <view class="form-item" :class="{ active: formFocus.password }">
          <uni-icons type="locked" size="22" color="#ff2442"></uni-icons>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="password" 
            placeholder="请输入密码" 
            class="input"
            @focus="formFocus.password = true"
            @blur="formFocus.password = false"
          />
          <view class="password-toggle" @click="togglePasswordVisibility">
            <uni-icons :type="showPassword ? 'eye-filled' : 'eye-slash-filled'" size="20" color="#909399"></uni-icons>
          </view>
        </view>
      </view>

      <view class="error-message" v-if="errorMsg">
        <uni-icons type="info-filled" size="14" color="#ff2442"></uni-icons>
        <text>{{ errorMsg }}</text>
      </view>

      <button 
        class="login-button" 
        @click="handleLogin" 
        :disabled="loading"
        :class="{ loading: loading }"
      >
        <view class="button-content">
          <view class="loading-spinner" v-if="loading"></view>
          <text>{{ loading ? '登录中...' : '登录' }}</text>
        </view>
      </button>

      <button 
        class="back-home-button" 
        @click="goToHome"
      >
        返回首页
      </button>

      <view class="extra-links">
        <text @click="forgotPassword">忘记密码?</text>
        <text @click="goToRegister">注册新账号</text>
      </view>
    </view>
    
    <view class="login-options">
      <view class="divider">
        <view class="line"></view>
        <text>其他登录方式</text>
        <view class="line"></view>
      </view>
      
      <view class="social-login">
        <view class="social-icon wechat" @click="socialLogin('wechat')">
          <uni-icons type="weixin" size="30" color="#fff"></uni-icons>
        </view>
        <view class="social-icon phone" @click="socialLogin('phone')">
          <uni-icons type="phone" size="26" color="#fff"></uni-icons>
        </view>
      </view>
    </view>
    
    <view class="footer">
      <text>登录即代表您同意</text>
      <text class="terms">《用户协议》</text>
      <text>和</text>
      <text class="terms">《隐私政策》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
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

// 表单数据
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMsg = ref('');

// 表单焦点状态
const formFocus = reactive({
  username: false,
  password: false
});

// 切换密码显示/隐藏
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 处理登录
const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  
  try {
    loading.value = true;
    errorMsg.value = '';
    uni.showLoading({ title: '登录中...' });

    const loginData = {
      username: username.value,
      password: password.value,
      role: 'tenant'
    };

    try {
      // 发送登录请求
      const response = await post<LoginResponse>('/auth/login/password', loginData);
      
      if (response && response.success) {
        // 登录成功
        uni.hideLoading();
        uni.showToast({ 
          title: '登录成功', 
          icon: 'success' 
        });
        
        // 保存登录凭证和用户信息
        if (response.token) {
          uni.setStorageSync('token', response.token);
        }
        
        if (response.user) {
          uni.setStorageSync('userInfo', response.user);
        }
        
        // 跳转到主页
          // 使用switchTab跳转到tabBar页面
          uni.switchTab({
            url: '/pages/tenant/home',
            success() {
              console.log('成功跳转到租户主页');
            },
            fail(err) {
              console.error('跳转失败:', err);
              uni.showToast({
                title: '跳转失败: ' + err.errMsg,
                icon: 'none'
              });
            }
          });
      } else {
        // 登录失败
        uni.hideLoading();
        errorMsg.value = response?.message || '用户名或密码错误';
        uni.showToast({ 
          title: errorMsg.value, 
          icon: 'none' 
        });
      }
    } catch (apiError: any) {
      console.error('API请求失败:', apiError);
      uni.hideLoading();
      
      // 模拟API不可用时的响应 - 在正式环境中应删除
      if (username.value === 'demo' && password.value === 'demo123') {
        // 模拟登录成功
        const mockUser = {
          id: 'tenant-001',
          username: username.value,
          role: 'tenant',
          name: '测试租户'
        };
        
        uni.setStorageSync('userInfo', mockUser);
        uni.setStorageSync('token', 'mock-token-123456');
        
        uni.showToast({ 
          title: '(模拟)登录成功', 
          icon: 'success' 
        });
        
        setTimeout(() => {
          // 使用switchTab跳转到tabBar页面
          uni.switchTab({
            url: '/pages/tenant/home',
            success() {
              console.log('成功跳转到租户主页(模拟)');
            },
            fail(err) {
              console.error('跳转失败(模拟):', err);
              uni.showToast({
                title: '跳转失败: ' + err.errMsg,
                icon: 'none'
              });
            }
          });
        }, 1500);
      } else {
        errorMsg.value = '服务器连接失败，请检查网络';
        uni.showToast({ 
          title: errorMsg.value, 
          icon: 'none' 
        });
      }
    }
  } finally {
    loading.value = false;
    setTimeout(() => {
      uni.hideLoading();
    }, 500);
  }
};

// 跳转到注册页面
const goToRegister = () => {
  uni.navigateTo({ url: '/pages/tenant/register' });
};

// 处理忘记密码
const forgotPassword = () => {
  uni.showToast({
    title: '忘记密码功能开发中',
    icon: 'none'
  });
};

// 社交媒体登录
const socialLogin = (type: string) => {
  uni.showToast({
    title: `${type === 'wechat' ? '微信' : '手机号'}登录功能开发中`,
    icon: 'none'
  });
};

// 跳转到首页
const goToHome = () => {
  uni.reLaunch({
    url: '/pages/index/index',
    success() {
      console.log('成功跳转到首页');
    },
    fail(err) {
      console.error('跳转失败:', err);
      uni.showToast({
        title: '跳转失败: ' + err.errMsg,
        icon: 'none'
      });
    }
  });
};
</script>

<style lang="scss" scoped>
.tenant-login-page {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx 60rpx;
  background: linear-gradient(to bottom, #fff8f8, #fff);
  
  .logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .header-text {
    text-align: center;
  }
  
  .welcome-text {
    font-size: 44rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 10rpx;
    display: block;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #999;
  }
}

.login-container {
  padding: 0 50rpx;
  margin-top: 20rpx;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 28rpx 20rpx;
  margin-bottom: 30rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  transition: all 0.3s;
  border: 2rpx solid transparent;
  
  &.active {
    border-color: #ff2442;
    background-color: #fff9f9;
    box-shadow: 0 4rpx 12rpx rgba(255, 36, 66, 0.1);
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
  color: #ff2442;
  font-size: 24rpx;
  margin: 10rpx 0 20rpx;
  padding: 16rpx;
  background-color: rgba(255, 36, 66, 0.08);
  border-radius: 8rpx;
  
  text {
    margin-left: 10rpx;
  }
}

.login-button {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #ff2442, #ff6b81);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 45rpx;
  margin: 40rpx 0 30rpx;
  border: none;
  transition: all 0.3s;
  box-shadow: 0 8rpx 16rpx rgba(255, 36, 66, 0.2);
  
  &.loading {
    opacity: 0.8;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &[disabled] {
    opacity: 0.6;
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

.back-home-button {
  width: 100%;
  height: 90rpx;
  background: transparent;
  color: #666;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 45rpx;
  margin: 0 0 30rpx;
  border: 2rpx solid #eee;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    background-color: #f8f8f8;
  }
}

.extra-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
  padding: 0 10rpx;
  font-size: 26rpx;
  
  text {
    color: #666;
    padding: 10rpx;
    
    &:first-child {
      color: #999;
    }
    
    &:last-child {
      color: #ff2442;
    }
  }
}

.login-options {
  margin-top: 80rpx;
  padding: 0 50rpx;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  
  .line {
    flex: 1;
    height: 1rpx;
    background-color: #eee;
  }
  
  text {
    padding: 0 20rpx;
    color: #999;
    font-size: 24rpx;
  }
}

.social-login {
  display: flex;
  justify-content: center;
  
  .social-icon {
    width: 90rpx;
    height: 90rpx;
    border-radius: 50%;
    margin: 0 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    
    &.wechat {
      background: linear-gradient(135deg, #09BB07, #07AB06);
      box-shadow: 0 6rpx 12rpx rgba(9, 187, 7, 0.2);
    }
    
    &.phone {
      background: linear-gradient(135deg, #ff2442, #ff6b81);
      box-shadow: 0 6rpx 12rpx rgba(255, 36, 66, 0.2);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.footer {
  text-align: center;
  padding: 50rpx 40rpx;
  margin-top: auto;
  display: flex;
  justify-content: center;
  
  text {
    font-size: 24rpx;
    color: #999;
    
    &.terms {
      color: #ff2442;
      margin: 0 6rpx;
    }
  }
}
</style> 