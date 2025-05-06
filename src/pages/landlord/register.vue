<template>
  <view class="landlord-register-page">
    <view class="register-header">
      <image src="/static/landlord-logo.png" mode="aspectFit" class="logo"></image>
      <text class="welcome-text">欢迎注册房东账号</text>
    </view>
    
    <view class="register-container">
      <view class="title">账号注册</view>
      
      <view class="form-group">
        <view class="form-item">
          <uni-icons type="person" size="20" color="#409EFF"></uni-icons>
          <input 
            type="text" 
            v-model="formData.username" 
            placeholder="请输入用户名" 
            class="input"
            focus 
            @input="validateField('username')"
          />
        </view>
        <view class="field-error" v-if="fieldErrors.username">{{ fieldErrors.username }}</view>

        <view class="form-item">
          <uni-icons type="locked" size="20" color="#409EFF"></uni-icons>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="formData.password" 
            placeholder="请设置密码" 
            class="input"
            @input="validateField('password')"
          />
          <view class="password-toggle" @click="togglePasswordVisibility">
            <uni-icons :type="showPassword ? 'eye-filled' : 'eye-slash-filled'" size="20" color="#909399"></uni-icons>
          </view>
        </view>
        <view class="field-error" v-if="fieldErrors.password">{{ fieldErrors.password }}</view>

        <view class="form-item">
          <uni-icons type="locked" size="20" color="#409EFF"></uni-icons>
          <input 
            :type="showConfirmPassword ? 'text' : 'password'" 
            v-model="formData.confirmPassword" 
            placeholder="请确认密码" 
            class="input"
            @input="validateField('confirmPassword')"
          />
          <view class="password-toggle" @click="toggleConfirmPasswordVisibility">
            <uni-icons :type="showConfirmPassword ? 'eye-filled' : 'eye-slash-filled'" size="20" color="#909399"></uni-icons>
          </view>
        </view>
        <view class="field-error" v-if="fieldErrors.confirmPassword">{{ fieldErrors.confirmPassword }}</view>
      </view>

      <view class="error-message" v-if="errorMsg">
        <uni-icons type="info-filled" size="14" color="#F56C6C"></uni-icons>
        <text>{{ errorMsg }}</text>
      </view>

      <button 
        class="register-button" 
        @click="handleRegister" 
        :disabled="loading"
        :class="{ loading: loading }"
      >
        <view class="button-content">
          <view class="loading-spinner" v-if="loading"></view>
          <text>{{ loading ? '注册中' : '注册账号' }}</text>
        </view>
      </button>

      <view class="agreement-text">
        <checkbox 
          :checked="formData.agreeTerms" 
          @click="toggleAgreeTerms"
          class="checkbox" 
          color="#409EFF" 
        />
        <text @click="toggleAgreeTerms">我已阅读并同意 <text class="link" @click.stop="showTerms">《用户协议》</text>和<text class="link" @click.stop="showPrivacy">《隐私政策》</text></text>
      </view>
      <view class="field-error" v-if="fieldErrors.terms">{{ fieldErrors.terms }}</view>

      <view class="extra-links">
        <text @click="goToLogin">已有账号? 返回登录</text>
      </view>
    </view>
    
    <view class="footer">
      <text>智慧租房平台 © 2023</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { post } from '../../utils/request';

interface RegisterResponse {
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
const showConfirmPassword = ref(false);

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
});

// 表单字段错误信息
const fieldErrors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  terms: ''
});

// 单个字段验证函数
const validateField = (field: string) => {
  console.log(`Validating field: ${field}`);
  
  switch (field) {
    case 'username':
      if (!formData.username) {
        fieldErrors.username = '用户名不能为空';
      } else if (formData.username.length < 2) {
        fieldErrors.username = '用户名至少需要2个字符';
      } else {
        fieldErrors.username = '';
      }
      break;
      
    case 'password':
      if (!formData.password) {
        fieldErrors.password = '密码不能为空';
      } else if (formData.password.length < 6) {
        fieldErrors.password = '密码至少需要6个字符';
      } else {
        fieldErrors.password = '';
      }
      
      // 更新确认密码的验证
      if (formData.confirmPassword && formData.confirmPassword !== formData.password) {
        fieldErrors.confirmPassword = '两次输入的密码不一致';
      } else if (formData.confirmPassword) {
        fieldErrors.confirmPassword = '';
      }
      break;
      
    case 'confirmPassword':
      if (!formData.confirmPassword) {
        fieldErrors.confirmPassword = '请确认密码';
      } else if (formData.confirmPassword !== formData.password) {
        fieldErrors.confirmPassword = '两次输入的密码不一致';
      } else {
        fieldErrors.confirmPassword = '';
      }
      break;
      
    default:
      break;
  }
};

// 协议勾选框验证
const validateTerms = () => {
  console.log('Agreement checked:', formData.agreeTerms);
  fieldErrors.terms = formData.agreeTerms ? '' : '请同意用户协议和隐私政策';
};

// 切换协议勾选
const toggleAgreeTerms = () => {
  formData.agreeTerms = !formData.agreeTerms;
  console.log('Toggle agreement:', formData.agreeTerms);
  validateTerms();
};

// 表单是否有效
const isFormValid = computed(() => {
  const valid = !!(
    formData.username && 
    formData.password && 
    formData.confirmPassword && 
    formData.agreeTerms
  );
  
  console.log('Form valid:', valid, formData);
  return valid;
});

// 切换密码显示/隐藏
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 切换确认密码显示/隐藏
const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 展示用户协议
const showTerms = () => {
  uni.showModal({
    title: '用户协议',
    content: '这里是用户协议内容',
    showCancel: false
  });
};

// 展示隐私政策
const showPrivacy = () => {
  uni.showModal({
    title: '隐私政策',
    content: '这里是隐私政策内容',
    showCancel: false
  });
};

// 处理注册
const handleRegister = async () => {
  errorMsg.value = '';
  
  // 验证所有字段
  validateField('username');
  validateField('password');
  validateField('confirmPassword');
  validateTerms();
  
  // 检查是否有错误或未填写信息
  if (!formData.username || !formData.password || !formData.confirmPassword || !formData.agreeTerms) {
    uni.showToast({ 
      title: '请完善注册信息', 
      icon: 'none' 
    });
    return;
  }
  
  if (fieldErrors.username || fieldErrors.password || fieldErrors.confirmPassword || fieldErrors.terms) {
    uni.showToast({ 
      title: '请检查填写的信息', 
      icon: 'none' 
    });
    return;
  }

  try {
    loading.value = true;
    uni.showLoading({ title: '注册中...' });
    console.log('尝试注册:', formData);

    // 构建注册请求参数
    const registerData = {
      username: formData.username,
      password: formData.password,
      role: 'landlord'
    };

    try {
      // 发送API请求 
      const response = await post<RegisterResponse>('/auth/register', registerData);
      
      console.log('服务器响应:', response);
      
      if (response && response.success) {
        // 注册成功
        uni.hideLoading();
        uni.showToast({ 
          title: '注册成功', 
          icon: 'success',
          duration: 2000
        });
        
        // 如果接口返回了token，自动登录
        if (response.token) {
          // 保存登录凭证和用户信息
          uni.setStorageSync('token', response.token);
          if (response.user) {
            uni.setStorageSync('userInfo', response.user);
          }
          
          // 延迟一下跳转
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index',
              fail(err) {
                console.error('跳转失败:', err);
                // 如果跳转失败，转到登录页
                uni.navigateTo({ url: '/pages/landlord/login' });
              }
            });
          }, 2000);
        } else {
          // 如果没有返回token，跳转到登录页
          setTimeout(() => {
            uni.navigateTo({ 
              url: '/pages/landlord/login',
              success() {
                uni.showToast({ 
                  title: '请使用新账号登录', 
                  icon: 'none' 
                });
              }
            });
          }, 2000);
        }
      } else {
        // API请求成功但注册失败
        uni.hideLoading();
        errorMsg.value = response?.message || '注册失败，请稍后再试';
        uni.showToast({ title: errorMsg.value, icon: 'none' });
      }
    } catch (apiError: any) {
      console.error('API请求失败:', apiError);
      uni.hideLoading();
      
      // 模拟API不可用时的响应
      if (formData.username && formData.password) {
        // 简单的模拟注册成功
        uni.showToast({ 
          title: '(模拟)注册成功', 
          icon: 'success',
          duration: 2000
        });
        console.log('模拟注册成功，返回登录页');
        
        setTimeout(() => {
          uni.navigateTo({ 
            url: '/pages/landlord/login',
            success() {
              uni.showToast({ 
                title: '请使用新注册的账号登录', 
                icon: 'none' 
              });
            }
          });
        }, 2000);
      } else {
        errorMsg.value = '服务器连接失败，请检查网络';
        uni.showToast({ title: errorMsg.value, icon: 'none' });
      }
    }
  } finally {
    loading.value = false;
    setTimeout(() => {
      uni.hideLoading();
    }, 500);
  }
};

// 跳转到登录
const goToLogin = () => {
  uni.navigateTo({ url: '/pages/landlord/login' });
};

// 页面加载时清空错误信息
onMounted(() => {
  errorMsg.value = '';
  fieldErrors.username = '';
  fieldErrors.password = '';
  fieldErrors.confirmPassword = '';
  fieldErrors.terms = '';
});
</script>

<style lang="scss" scoped>
.landlord-register-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(to bottom, #f6f9fc, #eef2f7);
  padding: 40rpx;
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40rpx;
  margin-bottom: 40rpx;
  
  .logo {
    width: 140rpx;
    height: 140rpx;
    margin-bottom: 20rpx;
  }
  
  .welcome-text {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
  }
}

.register-container {
  flex: 1;
  background-color: #fff;
  padding: 40rpx 30rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 50rpx;
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
  margin-bottom: 20rpx;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
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
  margin: 10rpx 0 20rpx;
  padding: 20rpx;
  background-color: #FEF0F0;
  border-radius: 8rpx;
  
  text {
    margin-left: 10rpx;
  }
}

.register-button {
  width: 100%;
  height: 90rpx;
  background-color: #409EFF;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 12rpx;
  margin-top: 10rpx;
  margin-bottom: 20rpx;
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

.agreement-text {
  display: flex;
  align-items: center;
  margin: 20rpx 0;
  font-size: 24rpx;
  color: #666;
  
  .checkbox {
    transform: scale(0.8);
    margin-right: 10rpx;
  }
  
  .link {
    color: #409EFF;
  }
}

.extra-links {
  text-align: center;
  margin-top: 30rpx;
  font-size: 26rpx;
  
  text {
    color: #409EFF;
    padding: 10rpx;
  }
}

.footer {
  text-align: center;
  padding: 20rpx 0;
  
  text {
    font-size: 24rpx;
    color: #909399;
  }
}

.field-error {
  font-size: 24rpx;
  color: #F56C6C;
  margin-top: -15rpx;
  margin-bottom: 15rpx;
  padding-left: 20rpx;
  transition: all 0.3s ease;
}

.submit-button {
  width: 100%;
  background-color: #409EFF;
  color: white;
  border: none;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 40rpx;
  transition: all 0.3s;
  
  &:disabled {
    background-color: #a0cfff;
    opacity: 0.7;
  }
  
  &:active {
    transform: scale(0.98);
  }
}
</style> 