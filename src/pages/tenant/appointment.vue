<template>
  <view class="appointment-page">
    <view class="header">
      <view class="title">预约看房</view>
    </view>

    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="!property" class="error">未找到房源信息</view>
    <view v-else class="form-container">
      <!-- 房源信息预览 -->
      <view class="property-info">
        <view class="property-title">{{ property.title }}</view>
        <view class="property-meta"
          >{{ property.district }} | {{ property.bedrooms }}室 |
          {{ property.price_per_month }}元/月</view
        >
      </view>

      <!-- 预约表单 -->
      <view class="form-section">
        <view class="form-item">
          <view class="label required">预约日期</view>
          <picker
            mode="date"
            :value="appointmentDate"
            :start="minDate"
            :end="maxDate"
            @change="onDateChange"
          >
            <view
              class="picker-value"
              :class="{ 'has-value': appointmentDate }"
            >
              {{ appointmentDate || "请选择日期" }}
              <text class="picker-icon">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <view class="label required">预约时间</view>
          <picker
            mode="time"
            :value="appointmentTime"
            start="09:00"
            end="18:00"
            @change="onTimeChange"
          >
            <view
              class="picker-value"
              :class="{ 'has-value': appointmentTime }"
            >
              {{ appointmentTime || "请选择时间" }}
              <text class="picker-icon">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <view class="label required">联系电话</view>
          <input
            type="number"
            v-model="phoneNumber"
            placeholder="请输入您的联系电话"
            maxlength="11"
            @blur="validatePhone"
          />
          <view v-if="phoneError" class="error-tip">{{ phoneError }}</view>
        </view>

        <view class="form-item">
          <view class="label">备注信息</view>
          <textarea v-model="notes" placeholder="可以填写您的其他要求或问题" />
        </view>
      </view>

      <button
        @click="submitAppointment"
        class="submit-btn"
        :disabled="!isFormValid"
      >
        提交预约
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { get, post } from "../../utils/request";
import type { Property } from "../../types/models";
import { onLoad } from "@dcloudio/uni-app";

// 房源数据
const propertyId = ref<string>("");
const property = ref<Property | null>(null);
const loading = ref(true);

// 表单数据
const appointmentDate = ref<string>("");
const appointmentTime = ref<string>("");
const phoneNumber = ref<string>("");
const notes = ref<string>("");
const phoneError = ref<string>("");

// 表单校验
const isFormValid = computed(() => {
  return (
    !!appointmentDate.value &&
    !!appointmentTime.value &&
    !!phoneNumber.value &&
    phoneError.value === ""
  );
});

// 日期范围
const minDate = computed(() => {
  const today = new Date();
  return formatDate(today);
});

const maxDate = computed(() => {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30); // 最多预约30天内
  return formatDate(maxDate);
});

// 格式化日期
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 日期选择事件
const onDateChange = (e: any) => {
  appointmentDate.value = e.detail.value;
};

// 时间选择事件
const onTimeChange = (e: any) => {
  appointmentTime.value = e.detail.value;
};

// 获取房源详情
const fetchPropertyDetail = async () => {
  if (!propertyId.value) return;

  loading.value = true;
  try {
    console.log(`正在获取房源ID: ${propertyId.value} 的详情`);
    const response = await get<any>(`/properties/public/${propertyId.value}`);
    console.log("获取房源详情返回:", response);

    if (response && response.success && response.property) {
      property.value = response.property;
    } else if (response && response.data) {
      property.value = response.data;
    } else {
      uni.showToast({
        title: "获取房源信息失败",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("获取房源详情失败:", error);
    uni.showToast({
      title: "获取房源信息失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

// 提交预约
const submitAppointment = async () => {
  // 先验证手机号
  validatePhone();

  if (!isFormValid.value) {
    uni.showToast({
      title: phoneError.value || "请填写完整信息",
      icon: "none",
    });
    return;
  }

  try {
    uni.showLoading({ title: "提交中..." });

    // 构建预约时间字符串 (ISO格式)
    const appointmentDateTime = `${appointmentDate.value}T${appointmentTime.value}:00`;

    const response = await post<any>("/appointments", {
      property_id: propertyId.value,
      appointment_time: appointmentDateTime,
      phone_number: phoneNumber.value,
      notes: notes.value,
    });

    uni.hideLoading();

    if (response && response.success) {
      uni.showToast({
        title: "预约已提交",
        icon: "success",
        duration: 2000,
      });

      // 获取预约ID
      const appointmentId = response.data?.id || "";

      // 直接跳转到预约列表页面，不使用定时器
      uni.redirectTo({
        url: `/pages/booking/index?from=new_appointment&id=${appointmentId}`,
        success: () => {
          console.log("跳转到预约列表页面成功");
        },
        fail: (err) => {
          console.error("跳转失败:", err);
          // 如果跳转失败，则返回上一页
          uni.navigateBack();
        },
      });
    } else {
      uni.showToast({
        title: response?.message || "预约失败",
        icon: "none",
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error("提交预约失败:", error);
    uni.showToast({
      title: "预约失败，请重试",
      icon: "none",
    });
  }
};

// 页面加载
onLoad((options) => {
  if (options && options.property_id) {
    propertyId.value = options.property_id;
    fetchPropertyDetail();
  }

  // 设置默认日期为明天
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  appointmentDate.value = formatDate(tomorrow);

  // 设置默认时间为上午10点
  appointmentTime.value = "10:00";
});

// 电话验证
const validatePhone = () => {
  if (!phoneNumber.value) {
    phoneError.value = "请输入联系电话";
  } else if (!/^1\d{10}$/.test(phoneNumber.value)) {
    phoneError.value = "请输入有效的11位手机号码";
  } else {
    phoneError.value = "";
  }
};
</script>

<style>
.appointment-page {
  padding: 15px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.loading,
.error {
  padding: 50px 0;
  text-align: center;
  color: #999;
}

.form-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
}

.property-info {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.property-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.property-meta {
  font-size: 14px;
  color: #666;
}

.form-section {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.label {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.required:after {
  content: "*";
  color: #f56c6c;
  margin-left: 4px;
}

.picker-value {
  height: 40px;
  line-height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
  background-color: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-value.has-value {
  color: #333;
}

.picker-icon {
  color: #999;
  font-size: 12px;
}

input,
textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 14px;
  background-color: #f9f9f9;
}

textarea {
  height: 100px;
}

.submit-btn {
  width: 100%;
  height: 45px;
  line-height: 45px;
  background-color: #2196f3;
  color: #fff;
  font-size: 16px;
  border-radius: 4px;
}

.submit-btn[disabled] {
  background-color: #cccccc;
  color: #666;
}

.error-tip {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}
</style> 