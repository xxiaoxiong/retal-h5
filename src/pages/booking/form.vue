<template>
  <view class="booking-form-page">
    <view v-if="loading" class="loading-placeholder">加载中...</view>
    <view v-else-if="!propertyInfo" class="error-placeholder">无法加载房源信息</view>
    <view v-else class="form-container">
      <view class="property-info-section">
        <text class="label">预约房源:</text>
        <text class="value">{{ propertyInfo.title }}</text>
      </view>

      <!-- 使用普通表单替代uni-forms，避免组件加载问题 -->
      <view class="form-content">
        <view class="form-item">
          <view class="form-label required">看房日期</view>
          <picker mode="date" :value="formData.appointmentDate" :start="currentDate" @change="onDateChange">
            <view class="picker-view">{{ formData.appointmentDate || '请选择日期' }}</view>
          </picker>
        </view>
        
        <view class="form-item">
          <view class="form-label required">看房时间</view>
          <picker mode="time" :value="formData.appointmentTime" @change="onTimeChange">
            <view class="picker-view">{{ formData.appointmentTime || '请选择时间' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <view class="form-label required">联系人</view>
          <input type="text" v-model="formData.contactName" placeholder="请输入您的姓名" class="form-input" />
        </view>

        <view class="form-item">
          <view class="form-label required">手机号</view>
          <input type="number" v-model="formData.contactPhone" placeholder="请输入您的手机号" class="form-input" maxlength="11" />
        </view>

        <view class="form-item">
          <view class="form-label">备注</view>
          <textarea v-model="formData.notes" placeholder="如有特殊要求请备注" class="form-textarea" />
        </view>
      </view>

      <button class="submit-button" @click="submitBooking" :disabled="submitting">{{ submitting ? '提交中...' : '提交预约' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { get, post } from '../../utils/request';
import type { Property } from '../../types/models';

interface FormData {
  appointmentDate: string;
  appointmentTime: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

const loading = ref(true);
const submitting = ref(false);
const propertyId = ref<string | null>(null);
const propertyInfo = ref<Partial<Property> | null>(null);

// 获取当前日期，用于日期选择器的最小日期
const currentDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
});

const formData = reactive<FormData>({
  appointmentDate: '',
  appointmentTime: '',
  contactName: '', 
  contactPhone: '',
  notes: '',
});

// 获取房源简要信息
const fetchPropertyInfo = async (id: string) => {
  loading.value = true;
  console.log(`获取房源ID: ${id} 的详情`);
  
  try {
    const response = await get<any>(`/properties/public/${id}`);
    console.log('获取到房源信息:', response);
    
    if (response && response.success && response.property) {
      propertyInfo.value = response.property;
    } else if (response && response.data) {
      propertyInfo.value = response.data;
    } else if (response && typeof response === 'object') {
      propertyInfo.value = response;
    } else {
      console.error('无法识别的API响应格式:', response);
      uni.showToast({
        title: '获取房源详情失败',
        icon: 'none',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('获取房源详情失败:', error);
    uni.showToast({
      title: '获取房源详情失败',
      icon: 'none',
      duration: 2000
    });
  } finally {
  loading.value = false;
  }
};

// 日期选择
const onDateChange = (e: any) => {
  formData.appointmentDate = e.detail.value;
};

// 时间选择
const onTimeChange = (e: any) => {
  formData.appointmentTime = e.detail.value;
};

// 加载用户缓存信息
const loadUserInfo = () => {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    if (userInfo) {
      const parsedInfo = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
      formData.contactName = parsedInfo.name || parsedInfo.nickname || '';
      formData.contactPhone = parsedInfo.phone || parsedInfo.phoneNumber || parsedInfo.mobile || '';
    }
  } catch (e) {
    console.error('加载用户信息失败:', e);
  }
};

// 提交预约
const submitBooking = async () => {
  // 防止重复提交
  if (submitting.value) return;

  try {
    // 手动验证表单
    let isValid = true;
    let errorMessage = '';
    
    // 验证日期
    if (!formData.appointmentDate) {
      isValid = false;
      errorMessage = '请选择看房日期';
    }
    // 验证时间
    else if (!formData.appointmentTime) {
      isValid = false;
      errorMessage = '请选择看房时间';
    }
    // 验证联系人
    else if (!formData.contactName.trim()) {
      isValid = false;
      errorMessage = '请输入联系人姓名';
    }
    // 验证手机号
    else if (!formData.contactPhone || !/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      isValid = false;
      errorMessage = '请输入正确的手机号码';
    }
    
    if (!isValid) {
      uni.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });
        return;
    }
    
    console.log('表单验证通过，准备提交');

    submitting.value = true;
    const appointmentData = {
      property_id: propertyId.value,
      viewing_date: formData.appointmentDate,
      viewing_time: formData.appointmentTime,
      contact_name: formData.contactName,
      contact_phone: formData.contactPhone,
      notes: formData.notes
    };

    console.log('预约提交数据:', appointmentData);
    const response = await post<any>('/appointments', appointmentData);
    console.log('预约API响应:', response);
    
    if (response && (response.success || response.id)) {
      // 缓存用户联系信息，方便下次使用
      try {
        const userInfo = {
          name: formData.contactName,
          phone: formData.contactPhone
        };
        uni.setStorageSync('userInfo', JSON.stringify(userInfo));
      } catch (e) {
        console.error('保存用户信息失败:', e);
      }
      
      uni.showToast({ 
        title: '预约提交成功', 
        icon: 'success',
        duration: 2000
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ 
        title: response?.message || '预约失败，请稍后再试', 
        icon: 'none',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('预约提交出错:', error);
    uni.showToast({ 
      title: '提交失败，请重试', 
      icon: 'none',
      duration: 2000
    });
  } finally {
    submitting.value = false;
  }
};

// 页面加载时获取参数
onLoad((options) => {
  console.log('表单页面加载，接收到参数:', options);
  if (options?.propertyId) {
    propertyId.value = options.propertyId;
    fetchPropertyInfo(options.propertyId);
    loadUserInfo();
  } else {
    console.error('Property ID is missing for booking');
    loading.value = false;
    uni.showToast({ 
      title: '无法加载房源信息', 
      icon: 'error',
      duration: 2000
    });
    setTimeout(() => uni.navigateBack(), 1500);
  }
});
</script>

<style lang="scss" scoped>
.booking-form-page {
  padding: 15px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.loading-placeholder,
.error-placeholder {
  text-align: center;
  color: #999;
  padding: 50px 0;
  font-size: 14px;
}

.form-container {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
}

.property-info-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  font-size: 16px;

  .label {
    color: #666;
    margin-right: 10px;
  }
  .value {
    color: #333;
    font-weight: bold;
  }
}

.form-content {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  
  &.required:after {
    content: "*";
    color: #f56c6c;
    margin-left: 4px;
  }
}

.picker-view {
  height: 35px;
  line-height: 35px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  color: #666;
  background-color: #f9f9f9;
}

.form-input {
  width: 100%;
  height: 35px;
  line-height: 35px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.submit-button {
  margin-top: 25px;
  background-color: #409eff;
  color: #fff;
  font-size: 16px;
  height: 44px;
  line-height: 44px;
  border-radius: 8px;

  &:disabled {
    background-color: #a0cfff;
    color: #fff;
  }
}
</style>

