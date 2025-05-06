<template>
  <view class="property-detail-page">
    <scroll-view scroll-y class="scroll-container">
      <view v-if="loading" class="loading-placeholder">
        <view class="loading-icon"></view>
        <text>加载中...</text>
      </view>
      <view v-else-if="error" class="error-placeholder">
        <text>{{ error }}</text>
        <button class="retry-button" @click="retryFetch">重试</button>
      </view>
      <view v-else-if="!property" class="error-placeholder">房源信息加载失败</view>
      <view v-else class="content">
        <!-- 图片轮播 -->
        <swiper class="image-swiper" indicator-dots autoplay circular>
          <swiper-item v-for="(image, index) in property.images" :key="index">
            <image class="swiper-image" :src="image" mode="aspectFill"></image>
          </swiper-item>
          <swiper-item v-if="!property.images || property.images.length === 0">
             <image class="swiper-image" src="/static/default-property.png" mode="aspectFill"></image>
          </swiper-item>
        </swiper>

        <!-- 基本信息 -->
        <view class="section basic-info">
          <view class="title">{{ property.title }}</view>
          <view class="price">￥{{ property.price_per_month }}/月</view>
          <view class="tags">
            <text class="tag">{{ property.property_type }}</text>
            <text class="tag">{{ property.bedrooms }}室{{ property.bathrooms }}卫</text>
            <text class="tag">{{ property.area_sqm }}㎡</text>
          </view>
        </view>

        <!-- 详细信息 -->
        <view class="section detail-info">
          <view class="section-title">房源信息</view>
          <view class="info-item">
            <text class="label">地址:</text>
            <text class="value">{{ property.city }} {{ property.district }} {{ property.address }}</text>
          </view>
          <!-- 可以添加更多信息项 -->
        </view>

        <!-- 配套设施 -->
        <view class="section amenities-info">
          <view class="section-title">配套设施</view>
          <view class="amenities-grid">
            <view v-for="amenity in property.amenities" :key="amenity" class="amenity-item">
              <!-- 可以根据 amenity 名称显示图标 -->
              <text>{{ amenity }}</text>
            </view>
            <view v-if="!property.amenities || property.amenities.length === 0">暂无设施信息</view>
          </view>
        </view>

        <!-- 房源描述 -->
        <view class="section description-info">
          <view class="section-title">房源描述</view>
          <text class="description-text">{{ property.description || '暂无详细描述' }}</text>
        </view>

        <!-- 地图位置 (可选) -->
        <!-- <view class="section map-info">
          <view class="section-title">地图位置</view>
          <map class="map-view" :latitude="property.latitude" :longitude="property.longitude" :markers="markers"></map>
        </view> -->

      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="property">
      <button class="action-button inquiry-button" @click="openInquiry">智能咨询</button>
      <button class="action-button book-button" @click="openBooking">预约看房</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { get } from '../../utils/request';
import type { Property } from '@/types/models'; // 假设类型定义在 types/models.ts

const property = ref<Property | null>(null);
const loading = ref(true);
const propertyId = ref<string | null>(null);
const error = ref('');

// 获取房源详情
const fetchPropertyDetail = async (id: string) => {
  loading.value = true;
  error.value = '';
  property.value = null;
  
  try {
    // 调用API获取房源详情
    const response = await get<any>(`/properties/${id}`);
    
    if (response && response.success && response.property) {
      // 格式1: {success: true, property: {...}}
      property.value = response.property;
    } else if (response && typeof response === 'object' && response.id) {
      // 格式2: 直接返回房源对象
      property.value = response;
    } else if (response && response.data && typeof response.data === 'object') {
      // 格式3: {data: {...}}
      property.value = response.data;
    } else {
      // 无法识别的数据格式
      error.value = '房源数据格式错误';
      console.error('无法识别的API响应格式:', response);
      uni.showToast({ 
        title: '数据格式错误', 
        icon: 'none' 
      });
    }
  } catch (e) {
    error.value = '获取房源信息失败';
    console.error('获取房源详情失败:', e);
    uni.showToast({ 
      title: '网络错误，请稍后重试', 
      icon: 'none' 
    });
  } finally {
  loading.value = false;
  }
};

// 重试获取数据
const retryFetch = () => {
  if (propertyId.value) {
    fetchPropertyDetail(propertyId.value);
  }
};

// 页面加载时获取参数并请求数据
onLoad((options) => {
  if (options?.id) {
    propertyId.value = options.id;
    fetchPropertyDetail(options.id);
  } else {
    console.error('Property ID is missing');
    loading.value = false;
    error.value = '缺少房源ID';
    uni.showToast({ title: '无法加载房源信息', icon: 'error' });
    // 可以选择返回上一页或显示错误信息
    // uni.navigateBack(); 
  }
});

// 打开智能咨询
const openInquiry = () => {
  if (!property.value) return;
  // 跳转到咨询页面，并传递房源ID
  uni.navigateTo({ url: `/pages/inquiry/chat?propertyId=${property.value.id}` });
};

// 打开预约看房
const openBooking = () => {
  if (!property.value) return;
  // 跳转到预约页面，并传递房源ID
  uni.navigateTo({ url: `/pages/booking/form?propertyId=${property.value.id}` });
};

</script>

<style lang="scss" scoped>
.property-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.scroll-container {
  flex-grow: 1;
  height: 0; // 重要：让 scroll-view 内部滚动
  padding-bottom: 60px; // 预留底部操作栏空间
}

.loading-placeholder,
.error-placeholder {
  text-align: center;
  color: #999;
  padding: 50px 0;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 15px;
  background-color: #409eff;
  color: white;
  padding: 5px 15px;
  font-size: 14px;
  border-radius: 4px;
}

.content {
  background-color: #f8f8f8;
}

.image-swiper {
  width: 100%;
  height: 250px; // 调整为你需要的高度

  .swiper-image {
    width: 100%;
    height: 100%;
  }
}

.section {
  background-color: #fff;
  margin-bottom: 10px;
  padding: 15px;
}

.basic-info {
  .title {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
  }
  .price {
    font-size: 22px;
    color: #ff5050;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .tags {
    .tag {
      display: inline-block;
      background-color: #f0f0f0;
      color: #666;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 3px;
      margin-right: 8px;
      margin-bottom: 5px;
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.detail-info {
  .info-item {
    display: flex;
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    .label {
      width: 80px;
      flex-shrink: 0;
      color: #999;
    }
    .value {
      flex-grow: 1;
    }
  }
}

.amenities-info {
  .amenities-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    .amenity-item {
      font-size: 13px;
      color: #666;
      background-color: #f5f5f5;
      padding: 5px 10px;
      border-radius: 5px;
      // 可以添加图标样式
    }
  }
}

.description-info {
  .description-text {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }
}

.map-info {
  .map-view {
    width: 100%;
    height: 200px;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eee;
  padding: 0 10px;
  box-sizing: border-box;

  .action-button {
    flex: 1;
    margin: 0 5px;
    height: 40px;
    line-height: 40px;
    border-radius: 20px;
    font-size: 15px;
    text-align: center;
  }

  .inquiry-button {
    background-color: #e9f5ff;
    color: #409eff;
    border: 1px solid #b3d8ff;
  }

  .book-button {
    background-color: #409eff;
    color: #fff;
  }
}
</style>

