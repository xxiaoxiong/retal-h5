<template>
  <view class="property-detail-page">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="!property" class="error">未找到房源信息</view>
    <view v-else class="property-content">
      <!-- 房源图片轮播 -->
      <swiper
        class="image-swiper"
        :indicator-dots="true"
        :autoplay="true"
        :interval="4000"
        :duration="500"
      >
        <swiper-item v-for="(image, index) in property.images" :key="index">
          <image :src="image" mode="aspectFill" class="property-image" />
        </swiper-item>
        <swiper-item v-if="!property.images || property.images.length === 0">
          <image
            src="/static/no-image.png"
            mode="aspectFill"
            class="property-image"
          />
        </swiper-item>
      </swiper>

      <!-- 房源标题和价格 -->
      <view class="property-header">
        <view class="property-title">{{ property.title }}</view>
        <view class="property-price">¥{{ property.price_per_month }}/月</view>
      </view>

      <!-- 房源信息 -->
      <view class="property-info">
        <view class="info-row">
          <view class="info-item">
            <text class="label">区域</text>
            <text class="value">{{ property.district }}</text>
          </view>
          <view class="info-item">
            <text class="label">面积</text>
            <text class="value">{{ property.area_sqm }}㎡</text>
          </view>
          <view class="info-item">
            <text class="label">户型</text>
            <text class="value"
              >{{ property.bedrooms }}室{{ property.bathrooms }}卫</text
            >
          </view>
        </view>
        <view class="info-row">
          <view class="info-item">
            <text class="label">类型</text>
            <text class="value">{{ property.property_type }}</text>
          </view>
          <view class="info-item">
            <text class="label">状态</text>
            <text class="value">{{
              property.status === "available" ? "可租" : "已租"
            }}</text>
          </view>
        </view>
      </view>

      <!-- 地址信息 -->
      <view class="address-section">
        <view class="section-title">房源地址</view>
        <view class="address"
          >{{ property.city }} {{ property.district }}
          {{ property.address }}</view
        >
      </view>

      <!-- 房源描述 -->
      <view class="description-section">
        <view class="section-title">房源描述</view>
        <view class="description">{{
          property.description || "暂无描述"
        }}</view>
      </view>

      <!-- 房屋设施 -->
      <view class="amenities-section">
        <view class="section-title">房屋设施</view>
        <view class="amenities-list">
          <view
            v-for="(amenity, index) in displayAmenities"
            :key="index"
            class="amenity-tag"
          >
            {{ getAmenityLabel(amenity) }}
          </view>
          <view
            v-if="!property.amenities || property.amenities.length === 0"
            class="no-amenities"
          >
            暂无设施信息
          </view>
        </view>
      </view>

      <!-- 联系咨询 -->
      <view class="action-buttons">
        <button @click="makeAppointment" class="appointment-btn">
          预约看房
        </button>
        <button @click="contactLandlord" class="contact-btn">联系房东</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { get } from "../../utils/request";
import type { Property } from "../../types/models";
import { onLoad } from "@dcloudio/uni-app";

// 房源ID和数据
const propertyId = ref<string>("");
const property = ref<Property | null>(null);
const loading = ref(true);

// 房屋设施选项映射
const amenitiesMap = {
  wifi: "WiFi",
  parking: "停车位",
  ac: "空调",
  heat: "暖气",
  washer: "洗衣机",
  kitchen: "厨房",
  tv: "电视",
  elevator: "电梯",
  refrigerator: "冰箱",
  microwave: "微波炉",
  balcony: "阳台",
  furniture: "家具齐全",
};

// 获取设施显示名称
const getAmenityLabel = (key: string): string => {
  return amenitiesMap[key as keyof typeof amenitiesMap] || key;
};

// 处理显示的设施标签
const displayAmenities = computed(() => {
  return property.value?.amenities || [];
});

// 获取房源详情
const fetchPropertyDetail = async () => {
  if (!propertyId.value) return;

  loading.value = true;
  try {
    const response = await get<any>(`/properties/public/${propertyId.value}`);

    if (response && response.success && response.property) {
      property.value = response.property;
    } else if (response && response.data) {
      property.value = response.data;
    } else if (response && !response.success) {
      uni.showToast({
        title: response.message || "获取房源详情失败",
        icon: "none",
      });
    } else {
      uni.showToast({
        title: "获取房源详情失败",
        icon: "none",
      });
    }
  } catch (error) {
    uni.showToast({
      title: "获取房源详情失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

// 预约看房
const makeAppointment = () => {
  if (!property.value) return;

  uni.navigateTo({
    url: `/pages/tenant/appointment?property_id=${property.value.id}`,
  });
};

// 联系房东
const contactLandlord = () => {
  if (!property.value) return;

  uni.navigateTo({
    url: `/pages/tenant/inquiry?property_id=${property.value.id}&landlord_id=${property.value.landlord_id}`,
  });
};

// 页面加载
onLoad((options) => {
  if (options && options.id) {
    propertyId.value = options.id;
    fetchPropertyDetail();
  } else {
    loading.value = false;
    uni.showToast({
      title: "未指定房源ID",
      icon: "none",
    });
  }
});
</script>

<style>
.property-detail-page {
  padding-bottom: 30px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading,
.error {
  padding: 50px 0;
  text-align: center;
  color: #999;
}

.image-swiper {
  width: 100%;
  height: 250px;
}

.property-image {
  width: 100%;
  height: 100%;
}

.property-header {
  padding: 15px;
  background-color: #fff;
}

.property-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.property-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff5a5f;
}

.property-info {
  margin-top: 10px;
  padding: 15px;
  background-color: #fff;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.value {
  font-size: 14px;
  color: #333;
}

.address-section,
.description-section,
.amenities-section {
  margin-top: 10px;
  padding: 15px;
  background-color: #fff;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  position: relative;
}

.section-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -5px;
  width: 30px;
  height: 2px;
  background-color: #ff5a5f;
}

.address {
  font-size: 14px;
  line-height: 1.5;
}

.description {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.amenities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.amenity-tag {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
}

.no-amenities {
  color: #999;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  padding: 15px;
  gap: 10px;
  margin-top: 20px;
}

.appointment-btn,
.contact-btn {
  flex: 1;
  height: 45px;
  line-height: 45px;
  text-align: center;
  border-radius: 4px;
  font-size: 15px;
}

.appointment-btn {
  background-color: #ff5a5f;
  color: #fff;
}

.contact-btn {
  background-color: #fff;
  color: #ff5a5f;
  border: 1px solid #ff5a5f;
}
</style> 