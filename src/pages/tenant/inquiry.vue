<template>
  <view class="tenant-inquiry-page">
    <view class="page-header">
      <view class="header-title">
        <uni-icons type="help" size="24" color="#4CD964"></uni-icons>
        <text>提交咨询</text>
      </view>
      <text class="header-subtitle"
        >您可以向管理员提交任何关于租房的问题或咨询</text
      >
    </view>

    <view class="form-container">
      <view class="form-group">
        <view class="form-label">咨询类型</view>
        <view class="type-selection">
          <view
            v-for="(type, index) in inquiryTypes"
            :key="index"
            class="type-item"
            :class="{ active: formData.type === type.value }"
            @click="formData.type = type.value"
          >
            <uni-icons
              :type="type.icon"
              size="20"
              :color="formData.type === type.value ? '#fff' : '#333'"
            ></uni-icons>
            <text>{{ type.label }}</text>
          </view>
        </view>
      </view>

      <view class="form-group">
        <view class="form-label">咨询标题</view>
        <view class="form-input">
          <input
            type="text"
            v-model="formData.title"
            placeholder="请简要描述您的问题"
            maxlength="50"
          />
          <text class="input-counter">{{ formData.title.length }}/50</text>
        </view>
      </view>

      <view class="form-group">
        <view class="form-label">详细描述</view>
        <view class="form-textarea">
          <textarea
            v-model="formData.content"
            placeholder="请详细描述您的问题，以便我们更好地为您解答"
            maxlength="500"
            auto-height
          />
          <text class="input-counter">{{ formData.content.length }}/500</text>
        </view>
      </view>

      <view class="form-group">
        <view class="form-label">相关图片 (选填)</view>
        <view class="upload-section">
          <view class="image-list">
            <view
              v-for="(image, index) in formData.images"
              :key="index"
              class="image-item"
            >
              <image :src="image" mode="aspectFill"></image>
              <view class="delete-image" @click="removeImage(index)">
                <uni-icons type="closeempty" size="20" color="#fff"></uni-icons>
              </view>
            </view>

            <view
              v-if="formData.images.length < 3"
              class="upload-button"
              @click="chooseImage"
            >
              <uni-icons type="camera" size="24" color="#999"></uni-icons>
              <text>上传图片</text>
            </view>
          </view>
          <text class="image-tip">最多上传3张图片，每张不超过10MB</text>
        </view>
      </view>

      <view class="form-group">
        <view class="form-label">联系方式</view>
        <view class="form-input">
          <input
            type="text"
            v-model="formData.contact"
            placeholder="请填写您的手机号码或其他联系方式"
          />
        </view>
      </view>
    </view>

    <view class="form-actions">
      <button
        class="submit-button"
        :class="{ disabled: !isFormValid }"
        @click="submitInquiry"
        :disabled="!isFormValid || loading"
      >
        <view class="button-content">
          <view class="loading-spinner" v-if="loading"></view>
          <text>{{ loading ? "提交中..." : "提交咨询" }}</text>
        </view>
      </button>
      <button class="cancel-button" @click="goBack">取消</button>
    </view>

    <view
      class="history-link"
      @click="navigateTo('/pages/tenant/inquiry-history')"
    >
      <uni-icons type="list" size="16" color="#4CD964"></uni-icons>
      <text>查看历史咨询</text>
    </view>

    <view class="setup-note" v-if="isDev">
      {{ setupNote }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { post, uploadFile, getPageParams } from "../../utils/request";
import { onLoad } from "@dcloudio/uni-app";

interface InquiryType {
  label: string;
  value: string;
  icon: string;
}

const inquiryTypes: InquiryType[] = [
  { label: "租金问题", value: "rent", icon: "wallet" },
  { label: "设施维修", value: "repair", icon: "wrench" },
  { label: "合同咨询", value: "contract", icon: "file-text" },
  { label: "其他问题", value: "other", icon: "help" },
];

// 判断当前环境 - 使用uni-app的方式
const isDev = ref(false);
// 检测运行环境
// #ifdef H5
// 非生产环境URL通常包含localhost或特定的开发域名
isDev.value =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1") ||
  window.location.hostname.includes(".local");
// #endif

// 表单数据
const formData = reactive({
  type: "rent",
  title: "",
  content: "",
  images: [] as string[],
  contact: "",
});

// 房源ID
const propertyId = ref("");

const loading = ref(false);
const errorMsg = ref("");

// 添加环境检查提示
const setupNote = ref(
  isDev.value
    ? `开发提示: 请确保已在Supabase中执行db/storage_setup.sql脚本创建存储桶，以便上传图片功能正常工作。`
    : ""
);

// 页面加载时获取房源ID
onLoad((options) => {
  if (options && options.property_id) {
    propertyId.value = options.property_id;
    console.log("从URL参数获取房源ID:", propertyId.value);
  } else {
    // 尝试其他方式获取
    const cachedPropertyId = uni.getStorageSync("current_property_id");
    if (cachedPropertyId) {
      propertyId.value = cachedPropertyId;
      console.log("从缓存获取房源ID:", propertyId.value);
    } else {
      // 尝试从用户信息获取
      try {
        const userInfo = uni.getStorageSync("userInfo") || {};
        if (userInfo.currentRental && userInfo.currentRental.property_id) {
          propertyId.value = userInfo.currentRental.property_id;
          console.log("从用户信息获取房源ID:", propertyId.value);
        }
      } catch (e) {
        console.error("获取用户租房信息失败", e);
      }

      // 如果都没有获取到，设置一个测试用的默认值（仅开发环境）
      if (!propertyId.value && isDev.value) {
        propertyId.value = "1594a252-1c48-473b-81c5-1a162872021b"; // 测试用ID
        console.warn("使用测试用的房源ID:", propertyId.value);
      }
    }
  }
});

// 检查表单是否有效
const isFormValid = computed(() => {
  return (
    formData.type &&
    formData.title.trim() !== "" &&
    formData.content.trim() !== "" &&
    formData.contact.trim() !== ""
  );
});

// 选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 3 - formData.images.length,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      // 压缩处理图片
      const tempFilePaths = res.tempFilePaths as string[];

      // 处理大小限制 - 更新为10MB
      const failedImages: string[] = [];

      tempFilePaths.forEach((path: string) => {
        uni.getFileInfo({
          filePath: path,
          success: (res) => {
            const fileSizeMB = res.size / 1024 / 1024;
            if (fileSizeMB <= 10) {
              // 更新为10MB限制
              formData.images.push(path);
            } else {
              failedImages.push(path);
            }
          },
        });
      });

      if (failedImages.length > 0) {
        uni.showToast({
          title: "部分图片超过10MB限制，已被过滤", // 更新为10MB限制
          icon: "none",
        });
      }
    },
  });
};

// 移除图片
const removeImage = (index: number) => {
  formData.images.splice(index, 1);
};

// 提交咨询
const submitInquiry = async () => {
  if (!isFormValid.value) {
    uni.showToast({
      title: "请完善表单信息",
      icon: "none",
    });
    return;
  }

  // 检查是否有房源ID
  if (!propertyId.value) {
    uni.showToast({
      title: "无法确定当前房源，请返回重试",
      icon: "none",
    });
    return;
  }

  try {
    loading.value = true;

    // 上传图片处理
    let uploadedImages: string[] = [];
    if (formData.images.length > 0) {
      uni.showLoading({ title: "正在上传图片..." });

      try {
        // 逐个上传图片 - 使用正确的字段名和接口
        for (const imagePath of formData.images) {
          const uploadResult = await uploadFile(
            "/tenant/upload-image",
            imagePath,
            {
              type: "inquiry",
            },
            "image"
          ); // 使用'image'作为字段名

          if (uploadResult && uploadResult.imageUrl) {
            uploadedImages.push(uploadResult.imageUrl);
          }
        }

        uni.hideLoading();
      } catch (uploadError) {
        uni.hideLoading();
        uni.showToast({
          title: "图片上传失败",
          icon: "none",
        });
        console.error("图片上传失败:", uploadError);
        // 上传失败但不阻止表单提交，只是没有图片
      }
    }

    // 构建请求数据 - 按照API文档要求
    const inquiryData = {
      property_id: propertyId.value,
      type: formData.type,
      title: formData.title,
      content: formData.content,
      contact: formData.contact,
      images: uploadedImages,
    };

    // 发送咨询请求
    uni.showLoading({ title: "提交中..." });

    try {
      // 调用实际API
      const response = await post("/tenant/inquiry/submit", inquiryData);

      uni.hideLoading();
      uni.showToast({
        title: "咨询提交成功",
        icon: "success",
        duration: 2000,
      });

      // 重置表单数据
      formData.title = "";
      formData.content = "";
      formData.images = [];
      formData.contact = "";
    } catch (apiError: any) {
      console.error("API请求失败:", apiError);
      uni.hideLoading();
      errorMsg.value = apiError.message || "服务器连接失败，请稍后再试";
      uni.showToast({
        title: errorMsg.value,
        icon: "none",
      });
    }
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 导航到指定页面
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
.tenant-inquiry-page {
  min-height: 100vh;
  background-color: #f6f9fc;
  padding: 30rpx;
}

.page-header {
  margin-bottom: 40rpx;

  .header-title {
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;

    text {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-left: 16rpx;
    }
  }

  .header-subtitle {
    font-size: 26rpx;
    color: #666;
  }
}

.form-container {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
}

.form-group {
  margin-bottom: 30rpx;

  .form-label {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
  }
}

.type-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  .type-item {
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    background-color: #f8f9fa;
    border-radius: 12rpx;
    min-width: 160rpx;

    uni-icons {
      margin-right: 10rpx;
    }

    text {
      font-size: 26rpx;
      color: #333;
    }

    &.active {
      background-color: #4cd964;

      text {
        color: #fff;
      }
    }
  }
}

.form-input {
  position: relative;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;

  input {
    font-size: 28rpx;
    height: 60rpx;
    width: 100%;
  }

  .input-counter {
    position: absolute;
    right: 20rpx;
    bottom: 10rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.form-textarea {
  position: relative;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;

  textarea {
    font-size: 28rpx;
    width: 100%;
    min-height: 240rpx;
  }

  .input-counter {
    position: absolute;
    right: 20rpx;
    bottom: 10rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.upload-section {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-bottom: 16rpx;

    .image-item {
      width: 200rpx;
      height: 200rpx;
      border-radius: 12rpx;
      overflow: hidden;
      position: relative;

      image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .delete-image {
        position: absolute;
        top: 10rpx;
        right: 10rpx;
        width: 40rpx;
        height: 40rpx;
        border-radius: 20rpx;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .upload-button {
      width: 200rpx;
      height: 200rpx;
      border-radius: 12rpx;
      border: 2rpx dashed #ddd;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      text {
        font-size: 24rpx;
        color: #999;
        margin-top: 10rpx;
      }
    }
  }

  .image-tip {
    font-size: 24rpx;
    color: #999;
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;

  .submit-button {
    background-color: #4cd964;
    color: #fff;
    border-radius: 12rpx;
    font-size: 32rpx;
    height: 90rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.disabled {
      background-color: #a5f2b3;
      opacity: 0.7;
    }

    .button-content {
      display: flex;
      align-items: center;

      .loading-spinner {
        width: 30rpx;
        height: 30rpx;
        border: 3rpx solid rgba(255, 255, 255, 0.3);
        border-top: 3rpx solid #fff;
        border-radius: 50%;
        margin-right: 10rpx;
        animation: spin 1s linear infinite;
      }
    }
  }

  .cancel-button {
    background-color: #f8f9fa;
    color: #666;
    border-radius: 12rpx;
    font-size: 32rpx;
    height: 90rpx;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.history-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;

  text {
    font-size: 28rpx;
    color: #4cd964;
    margin-left: 10rpx;
  }
}

.setup-note {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #666;
}
</style> 