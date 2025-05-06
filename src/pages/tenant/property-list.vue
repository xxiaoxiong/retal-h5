<template>
  <view class="property-list-page">
    <!-- 搜索和筛选区域 -->
    <view class="filter-section">
      <input
        class="search-input"
        placeholder="搜索区域、小区名"
        @confirm="onSearch"
      />
      <!-- 更多筛选按钮 -->
      <button size="mini" @click="showFilterPopup">筛选</button>
    </view>

    <!-- 房源列表 -->
    <scroll-view
      scroll-y
      class="property-list"
      @scrolltolower="loadMoreProperties"
    >
      <view
        v-if="loading && properties.length === 0"
        class="loading-placeholder"
        >加载中...</view
      >
      <view v-else-if="properties.length === 0" class="empty-placeholder"
        >暂无房源</view
      >
      <view v-else>
        <view
          v-for="property in properties"
          :key="property.id"
          class="property-item"
          @click="goToDetail(property.id)"
        >
          <image
            class="property-image"
            :src="property.images?.[0] || '/static/default-property.png'"
            mode="aspectFill"
          ></image>
          <view class="property-info">
            <view class="property-title">{{ property.title }}</view>
            <view class="property-details"
              >{{ property.district }} | {{ property.bedrooms }}室 |
              {{ property.area_sqm }}㎡</view
            >
            <view class="property-price"
              >￥{{ property.price_per_month }}/月</view
            >
            <view class="property-tags">
              <text
                v-for="tag in property.amenities?.slice(0, 3)"
                :key="tag"
                class="tag"
                >{{ tag }}</text
              >
            </view>
          </view>
        </view>
        <view v-if="loadingMore" class="loading-more">加载中...</view>
        <view v-if="!hasMore" class="no-more">没有更多了</view>
      </view>
    </scroll-view>

    <!-- 筛选弹窗 (暂未实现) -->
    <!-- <uni-popup ref="filterPopup" type="bottom">
      <view class="filter-popup-content">
        筛选条件...
      </view>
    </uni-popup> -->
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { get } from "../../utils/request";
import type { Property } from "@/types/models"; // 假设类型定义在 types/models.ts

const properties = ref<Property[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const filterOptions = ref({}); // 存储筛选条件

// 获取房源列表
const fetchProperties = async (page = 1, filters = {}) => {
  if (page === 1) {
    loading.value = true;
    properties.value = []; // 重置列表
  } else {
    loadingMore.value = true;
  }

  try {
    // 构建请求参数
    const params = {
      page,
      limit: pageSize,
      ...filters,
    };

    // 调用API获取房源列表
    const response = await get<any>("/properties", params);

    let propertiesData: Property[] = [];
    let total = 0;

    if (response && response.success && response.properties) {
      // 格式1: {success: true, properties: [...], total: number}
      propertiesData = response.properties;
      total = response.total || 0;
      hasMore.value = propertiesData.length < total;
    } else if (response && Array.isArray(response)) {
      // 格式2: 直接返回房源数组
      propertiesData = response;
      hasMore.value = response.length >= pageSize;
    } else if (response && response.data && Array.isArray(response.data)) {
      // 格式3: {data: [...]}
      propertiesData = response.data;
      hasMore.value = response.data.length >= pageSize;
    } else {
      // 无法识别的数据格式
      console.error("无法识别的API响应格式:", response);
      uni.showToast({
        title: "数据格式不正确",
        icon: "none",
      });
    }

    // 更新数据
    properties.value =
      page === 1 ? propertiesData : [...properties.value, ...propertiesData];
  } catch (error) {
    console.error("获取房源数据失败:", error);
    uni.showToast({
      title: "网络错误，请稍后重试",
      icon: "none",
    });
  } finally {
    if (page === 1) {
      loading.value = false;
    } else {
      loadingMore.value = false;
    }
  }
};

// 加载更多
const loadMoreProperties = () => {
  if (!hasMore.value || loadingMore.value) {
    return;
  }
  currentPage.value++;
  fetchProperties(currentPage.value, filterOptions.value);
};

// 跳转到详情页
const goToDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/tenant/property-detail?id=${id}` });
};

// 搜索确认
const onSearch = (event: any) => {
  const keyword = event.detail.value;
  console.log("Search keyword:", keyword);
  filterOptions.value = { ...filterOptions.value, keyword }; // 更新筛选条件
  currentPage.value = 1; // 重置页码
  fetchProperties(currentPage.value, filterOptions.value);
};

// 显示筛选弹窗 (待实现)
const showFilterPopup = () => {
  console.log("Show filter popup");
  // this.$refs.filterPopup.open();
  uni.showToast({ title: "筛选功能待实现", icon: "none" });
};

// 组件挂载时加载初始数据
onMounted(() => {
  fetchProperties(currentPage.value, filterOptions.value);
});
</script>

<style lang="scss" scoped>
.property-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.filter-section {
  padding: 10px;
  background-color: #f8f8f8;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;

  .search-input {
    flex-grow: 1;
    background-color: #fff;
    border-radius: 15px;
    padding: 5px 10px;
    font-size: 14px;
    margin-right: 10px;
  }
}

.property-list {
  flex-grow: 1;
  height: 0; // 重要：让 scroll-view 内部滚动
}

.property-item {
  display: flex;
  padding: 15px 10px;
  border-bottom: 1px solid #eee;
  background-color: #fff;

  .property-image {
    width: 120px;
    height: 90px;
    border-radius: 5px;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .property-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .property-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .property-details {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }

    .property-price {
      font-size: 16px;
      color: #ff5050;
      font-weight: bold;
      margin-top: 5px;
    }

    .property-tags {
      margin-top: 5px;
      .tag {
        display: inline-block;
        background-color: #f0f0f0;
        color: #666;
        font-size: 10px;
        padding: 2px 5px;
        border-radius: 3px;
        margin-right: 5px;
      }
    }
  }
}

.loading-placeholder,
.empty-placeholder,
.loading-more,
.no-more {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 14px;
}

// 筛选弹窗样式 (待实现)
.filter-popup-content {
  background-color: #fff;
  padding: 20px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}
</style>

