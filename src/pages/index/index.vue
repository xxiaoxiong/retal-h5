<template>
  <view class="app-entry">
    <!-- 顶部导航条 -->
    <view class="header">
      <view class="logo-text">租房找家</view>
      <view class="header-actions">
        <uni-icons
          type="search"
          size="22"
          color="#333"
          @click="navigateTo('/pages/tenant/property-list')"
        ></uni-icons>
        <uni-icons
          type="notification"
          size="22"
          color="#333"
          style="margin-left: 30rpx"
        ></uni-icons>
      </view>
    </view>

    <!-- 轮播图 -->
    <swiper
      class="banner-swiper"
      circular
      autoplay
      interval="3000"
      duration="500"
      indicator-dots
      indicator-color="rgba(255,255,255,0.6)"
      indicator-active-color="#ff2442"
    >
      <swiper-item v-for="(item, index) in bannerList" :key="index">
        <image :src="item.image" mode="aspectFill" class="banner-image"></image>
        <view class="banner-text">{{ item.title }}</view>
      </swiper-item>
    </swiper>

    <!-- 用户角色选择 -->
    <view class="role-container">
      <view class="section-title">
        <text class="title-text">选择您的身份</text>
      </view>

      <view class="role-cards">
        <view class="role-card tenant" @click="goToTenantLogin">
          <view class="role-content">
            <text class="role-title">我是租户</text>
            <text class="role-desc">享受便捷、舒适的租房体验</text>
            <view class="role-features">
              <text>✓ 在线找房</text>
              <text>✓ 一键签约</text>
              <text>✓ 便捷缴费</text>
            </view>
          </view>
          <view class="role-image">
            <image src="/static/tenant-card.png" mode="aspectFill"></image>
          </view>
          <uni-icons
            class="role-arrow"
            type="arrowright"
            size="18"
            color="#fff"
          ></uni-icons>
        </view>

        <view class="role-card landlord" @click="goToLandlordLogin">
          <view class="role-content">
            <text class="role-title">我是房东</text>
            <text class="role-desc">高效管理您的房源与租约</text>
            <view class="role-features">
              <text>✓ 发布房源</text>
              <text>✓ 管理租约</text>
              <text>✓ 收益分析</text>
            </view>
          </view>
          <view class="role-image">
            <image src="/static/landlord-card.png" mode="aspectFill"></image>
          </view>
          <uni-icons
            class="role-arrow"
            type="arrowright"
            size="18"
            color="#fff"
          ></uni-icons>
        </view>
      </view>
    </view>

    <!-- 热门房源推荐 -->
    <view class="hot-properties">
      <view class="section-title">
        <text class="title-text">精选好房</text>
        <text
          class="more-text"
          @click="navigateTo('/pages/tenant/property-list')"
          >查看更多</text
        >
      </view>

      <scroll-view scroll-x class="property-scroll" show-scrollbar="false">
        <view
          v-for="(item, index) in hotProperties"
          :key="index"
          class="property-card"
          @click="navigateTo(`/pages/tenant/property-detail?id=${item.id}`)"
        >
          <image
            :src="item.image"
            mode="aspectFill"
            class="property-image"
          ></image>
          <view class="property-tag" v-if="item.tag">{{ item.tag }}</view>
          <view class="property-info">
            <text class="property-name">{{ item.name }}</text>
            <text class="property-location">{{ item.location }}</text>
            <text class="property-price">¥{{ item.price }}/月</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 专题推荐 -->
    <view class="topics">
      <view class="section-title">
        <text class="title-text">租房攻略</text>
        <text
          class="more-text"
          @click="navigateTo('/pages/tenant/rental-guide')"
          >全部攻略</text
        >
      </view>

      <view class="topic-cards">
        <view
          class="topic-card"
          v-for="(topic, index) in topicList"
          :key="index"
        >
          <image
            :src="topic.image"
            mode="aspectFill"
            class="topic-image"
          ></image>
          <view class="topic-info">
            <text class="topic-title">{{ topic.title }}</text>
            <view class="topic-meta">
              <text class="topic-author">{{ topic.author }}</text>
              <text class="topic-likes">{{ topic.likes }}赞</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="footer">
      <text>智慧租房平台 © 2023</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { get } from "../../utils/request";
import { ref, onMounted } from "vue";

// 定义接口类型
interface BannerItem {
  image: string;
  title: string;
}

interface PropertyItem {
  id: string;
  name: string;
  location: string;
  price: string;
  image: string;
  tag?: string;
}

interface TopicItem {
  title: string;
  author: string;
  likes: string;
  image: string;
}

interface HomePageData {
  bannerList: BannerItem[];
  hotProperties: PropertyItem[];
  topicList: TopicItem[];
}

// 初始化数据
const bannerList = ref<BannerItem[]>([]);
const hotProperties = ref<PropertyItem[]>([]);
const topicList = ref<TopicItem[]>([]);

// 页面加载时获取数据
onMounted(() => {
  fetchHomePageData();
});

// 从API获取首页数据
const fetchHomePageData = async () => {
  try {
    uni.showLoading({
      title: "加载中...",
    });
    const res = await get<any>("/homepage");

    if (res.success && res.data) {
      // 使用类型断言确保类型安全
      const data = res.data as HomePageData;

      // 更新数据
      if (data.bannerList && data.bannerList.length > 0) {
        bannerList.value = data.bannerList;
      }

      if (data.hotProperties && data.hotProperties.length > 0) {
        hotProperties.value = data.hotProperties;
      }

      if (data.topicList && data.topicList.length > 0) {
        topicList.value = data.topicList;
      }

      console.log("首页数据获取成功:", data);
    } else {
      console.error("获取首页数据失败:", res);
      // 加载失败时使用默认数据
      useDefaultData();
    }
  } catch (error) {
    console.error("获取首页数据异常:", error);
    // 请求异常时使用默认数据
    useDefaultData();
  } finally {
    uni.hideLoading();
  }
};

// 使用默认数据（当API调用失败时）
const useDefaultData = () => {
  // 轮播图默认数据
  bannerList.value = [
    {
      image: "/static/banner1.jpg",
      title: "精选好房，温馨舒适",
    },
    {
      image: "/static/banner2.jpg",
      title: "一键找房，轻松租赁",
    },
    {
      image: "/static/banner3.jpg",
      title: "品质生活，从这里开始",
    },
  ];

  // 热门房源默认数据
  hotProperties.value = [
    {
      id: "1",
      name: "阳光雅苑两居室",
      location: "朝阳区 · 建国路",
      price: "4500",
      image: "/static/property1.jpg",
      tag: "新上",
    },
    {
      id: "2",
      name: "城市花园三居室",
      location: "海淀区 · 中关村",
      price: "6800",
      image: "/static/property2.jpg",
      tag: "特惠",
    },
    {
      id: "3",
      name: "江景公寓单间",
      location: "浦东新区 · 陆家嘴",
      price: "3500",
      image: "/static/property3.jpg",
    },
    {
      id: "4",
      name: "现代简约一居室",
      location: "西城区 · 西单",
      price: "5200",
      image: "/static/property4.jpg",
    },
  ];

  // 专题推荐默认数据
  topicList.value = [
    {
      title: "新手租房必读：如何避开租房陷阱",
      author: "租房达人",
      likes: "2.3k",
      image: "/static/topic1.jpg",
    },
    {
      title: "10个超实用的小户型收纳技巧",
      author: "家居博主",
      likes: "1.8k",
      image: "/static/topic2.jpg",
    },
    {
      title: "租房装修攻略：低成本改造出高级感",
      author: "设计师小明",
      likes: "3.5k",
      image: "/static/topic3.jpg",
    },
  ];

  // 显示提示
  uni.showToast({
    title: "使用默认数据",
    icon: "none",
  });
};

// 通用导航函数
const navigateTo = (url: string) => {
  uni.navigateTo({
    url,
    fail: (err) => {
      console.error("常规导航失败:", err);
      // 尝试使用switchTab导航
      uni.switchTab({
        url,
        fail: (switchErr) => {
          console.error("switchTab导航也失败:", switchErr);
          // 显示错误提示
          uni.showToast({
            title: "页面跳转失败",
            icon: "none",
          });
        },
      });
    },
  });
};

// 跳转到租户登录
const goToTenantLogin = () => {
  try {
    console.log("尝试跳转到租户登录页面");

    // 直接使用navigateTo，因为登录页面不在tabBar中
    uni.navigateTo({
      url: "/pages/tenant/login",
      success() {
        console.log("成功跳转到租户登录页面");
      },
      fail(err) {
        console.error("租户登录跳转失败:", err);
        uni.showToast({
          title: "跳转失败: " + err.errMsg,
          icon: "none",
        });
      },
    });
  } catch (error) {
    console.error("跳转出错:", error);
  }
};

// 跳转到房东登录
const goToLandlordLogin = () => {
  try {
    console.log("尝试跳转到房东登录页面");

    // 直接使用navigateTo，因为登录页面不在tabBar中
    uni.navigateTo({
      url: "/pages/landlord/login",
      success() {
        console.log("成功跳转到房东登录页面");
      },
      fail(err) {
        console.error("房东登录跳转失败:", err);
        uni.showToast({
          title: "跳转失败: " + err.errMsg,
          icon: "none",
        });
      },
    });
  } catch (error) {
    console.error("跳转出错:", error);
  }
};
</script>

<style lang="scss" scoped>
.app-entry {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30rpx;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

  .logo-text {
    font-size: 36rpx;
    font-weight: bold;
    background: linear-gradient(to right, #ff2442, #ff6b81);
    -webkit-background-clip: text;
    color: transparent;
  }

  .header-actions {
    display: flex;
    align-items: center;
  }
}

.banner-swiper {
  width: 100%;
  height: 360rpx;

  .banner-image {
    width: 100%;
    height: 100%;
    border-radius: 0 0 30rpx 30rpx;
  }

  .banner-text {
    position: absolute;
    bottom: 40rpx;
    left: 40rpx;
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
  }
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;

  .title-text {
    font-size: 34rpx;
    font-weight: bold;
    color: #333;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -10rpx;
      left: 0;
      width: 40rpx;
      height: 6rpx;
      background: linear-gradient(to right, #ff2442, #ff6b81);
      border-radius: 3rpx;
    }
  }

  .more-text {
    font-size: 26rpx;
    color: #999;
  }
}

.role-container {
  margin-top: 20rpx;
}

.role-cards {
  padding: 0 30rpx;
}

.role-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 220rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);

  &.tenant {
    background: linear-gradient(45deg, #ff2442, #ff6b81);
  }

  &.landlord {
    background: linear-gradient(45deg, #4481eb, #04befe);
  }

  .role-content {
    width: 60%;
    z-index: 1;
  }

  .role-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 10rpx;
  }

  .role-desc {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 20rpx;
  }

  .role-features {
    display: flex;
    flex-direction: column;

    text {
      font-size: 24rpx;
      color: #fff;
      margin-bottom: 6rpx;
    }
  }

  .role-image {
    position: absolute;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    opacity: 0.4;

    image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .role-arrow {
    position: absolute;
    right: 30rpx;
    bottom: 30rpx;
    z-index: 1;
  }
}

.hot-properties {
  margin-top: 20rpx;
}

.property-scroll {
  white-space: nowrap;
  padding: 0 30rpx;
}

.property-card {
  display: inline-block;
  width: 300rpx;
  margin-right: 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  position: relative;

  .property-image {
    width: 100%;
    height: 200rpx;
    border-radius: 16rpx 16rpx 0 0;
  }

  .property-tag {
    position: absolute;
    top: 16rpx;
    left: 16rpx;
    padding: 4rpx 16rpx;
    font-size: 22rpx;
    color: #fff;
    background-color: #ff2442;
    border-radius: 16rpx;
  }

  .property-info {
    padding: 16rpx;
    white-space: normal;

    .property-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 8rpx;
    }

    .property-location {
      font-size: 22rpx;
      color: #999;
      display: block;
      margin-bottom: 8rpx;
    }

    .property-price {
      font-size: 26rpx;
      font-weight: bold;
      color: #ff2442;
    }
  }
}

.topics {
  margin-top: 20rpx;
}

.topic-cards {
  padding: 0 30rpx;
}

.topic-card {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .topic-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 16rpx;
    margin-right: 20rpx;
  }

  .topic-info {
    flex: 1;
  }

  .topic-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 16rpx;
    line-height: 1.4;
  }

  .topic-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .topic-author {
      font-size: 24rpx;
      color: #666;
    }

    .topic-likes {
      font-size: 22rpx;
      color: #ff2442;
    }
  }
}

.footer {
  text-align: center;
  padding: 30rpx 0;

  text {
    font-size: 24rpx;
    color: #999;
  }
}

// 为小红书风格添加动画效果
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.role-card,
.property-card,
.topic-card {
  animation: fadeInUp 0.5s ease-out;
}
</style>
