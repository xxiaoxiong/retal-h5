<template>
  <view class="rental-guide-page">
    <!-- 顶部导航 -->
    <view class="nav-tabs">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tab-item', { active: currentTab === index }]"
        @click="switchTab(index)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view scroll-y class="content-scroll">
      <view v-if="loading" class="loading">加载中...</view>
      <view v-else class="guide-content">
        <view
          v-for="(item, index) in currentGuideList"
          :key="index"
          class="guide-item"
        >
          <image
            v-if="item.image"
            :src="item.image"
            mode="aspectFill"
            class="guide-image"
          />
          <view class="guide-info">
            <view class="guide-title">{{ item.title }}</view>
            <view class="guide-desc">{{ item.description }}</view>
            <view class="guide-tags">
              <text
                v-for="(tag, tagIndex) in item.tags"
                :key="tagIndex"
                class="tag"
              >
                {{ tag }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { get } from "../../utils/request";

// 标签页配置
const tabs = [
  { name: "租房流程", type: "process" },
  { name: "注意事项", type: "tips" },
  { name: "常见问题", type: "faq" },
];

const currentTab = ref(0);
const loading = ref(false);
const guideData = ref<any>({
  process: [],
  tips: [],
  faq: [],
});

// 当前显示的攻略列表
const currentGuideList = computed(() => {
  const type = tabs[currentTab.value].type;
  return guideData.value[type] || [];
});

// 切换标签页
const switchTab = (index: number) => {
  currentTab.value = index;
  fetchGuideData(tabs[index].type);
};

// 获取攻略数据
const fetchGuideData = async (type: string) => {
  if (guideData.value[type].length > 0) return; // 如果已有数据则不重复请求

  loading.value = true;
  try {
    const response = await get<any>(`/rental-guides/${type}`);

    if (response && response.success) {
      guideData.value[type] = response.data;
    } else if (response && response.data) {
      // 兼容直接返回数据的情况
      guideData.value[type] = response.data;
    } else {
      uni.showToast({
        title: response?.message || "获取数据失败",
        icon: "none",
      });
    }
  } catch (error) {
    uni.showToast({
      title: "网络错误，请重试",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取第一个标签页的数据
onMounted(() => {
  fetchGuideData(tabs[0].type);
});
</script>

<style>
.rental-guide-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav-tabs {
  display: flex;
  background-color: #fff;
  padding: 10px 15px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #ff5a5f;
  font-weight: bold;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #ff5a5f;
}

.content-scroll {
  height: calc(100vh - 44px);
}

.loading {
  padding: 20px;
  text-align: center;
  color: #999;
}

.guide-content {
  padding: 15px;
}

.guide-item {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.guide-image {
  width: 100%;
  height: 180px;
}

.guide-info {
  padding: 15px;
}

.guide-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.guide-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 10px;
}

.guide-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}
</style> 