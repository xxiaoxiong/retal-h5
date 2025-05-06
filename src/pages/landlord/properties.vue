<template>
  <view class="properties-management-page">
    <view class="header">
      <view class="title">房源管理</view>
      <button @click="addNewProperty" class="add-property-btn">+ 新增房源</button>
    </view>

    <view v-if="loading" class="loading-placeholder">
      <view class="loading-icon"></view>
      <text>正在加载房源数据...</text>
    </view>
    <view v-else-if="properties.length === 0" class="empty-placeholder">
      <text class="empty-text">您还没有添加任何房源</text>
      <button @click="addNewProperty" class="add-first-property-btn">添加第一个房源</button>
    </view>
    <view v-else class="properties-list">
      <view v-for="property in properties" :key="property.id" class="property-item">
        <view class="property-details">
          <view class="property-title">{{ property.title }}</view>
          <view class="property-meta">{{ property.district }} | {{ property.bedrooms }}室 | {{ property.price_per_month }}元/月</view>
          <view class="property-status">
            <text :class="{ 'status-published': property.is_published, 'status-unpublished': !property.is_published }">
              {{ property.is_published ? "已发布" : "未发布" }}
            </text>
            <text class="status-divider">|</text>
            <text :class="{ 'status-available': property.status === 'available', 'status-unavailable': property.status !== 'available' }">
              {{ property.status === "available" ? "可租" : "已租" }}
            </text>
          </view>
        </view>
        <view class="property-actions">
          <button @click="editProperty(property.id)" class="edit-btn">编辑</button>
          <!-- 根据发布状态显示不同按钮 -->
          <button 
            v-if="property.is_published" 
            @click="togglePublishStatus(property.id, false)" 
            class="unpublish-btn"
          >
            下架
          </button>
          <button 
            v-else 
            @click="togglePublishStatus(property.id, true)" 
            class="publish-btn"
          >
            上架
          </button>
          <button @click="deleteProperty(property.id)" class="delete-btn">删除</button>
        </view>
      </view>
      
      <view v-if="loadingMore" class="loading-more">
        <text>加载更多...</text>
      </view>
      <view v-if="!hasMore && properties.length > 0" class="no-more">
        <text>--- 已显示全部房源 ---</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { onReachBottom, onShow } from "@dcloudio/uni-app";
import { get, put, del } from '../../utils/request';
import type { Property } from "../../types/models";

const properties = ref<Property[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const needRefresh = ref(false);

// 从API获取房源数据
const fetchProperties = async (page = 1, append = false) => {
  if (!append) {
    loading.value = true;
  }
  
  try {
    // 调用后端API获取房源列表
    const response = await get<any>('/properties', {
      page,
      limit: pageSize,
      show_all: true, // 确保获取所有房源，包括未发布的
      // 可以添加其他过滤条件，如status等
    });

    // 适配不同的API响应结构
    let propertiesData: Property[] = [];
    let total = 0;
    
    if (response && response.success && response.properties) {
      // 结构1: {success: true, properties: [...], total: number}
      propertiesData = response.properties;
      total = response.total || 0;
      hasMore.value = propertiesData.length < total;
    } else if (response && Array.isArray(response)) {
      // 结构2: 直接返回数组
      propertiesData = response;
      hasMore.value = response.length >= pageSize;
    } else if (response && response.data && Array.isArray(response.data)) {
      // 结构3: {data: [...]}
      propertiesData = response.data;
      hasMore.value = response.data.length >= pageSize;
    } else {
      console.error('无法识别的API响应格式:', response);
      uni.showToast({
        title: '数据格式错误',
        icon: 'none'
      });
      return;
    }
    
    // 更新房源列表
    if (append) {
      // 追加数据到现有列表
      properties.value = [...properties.value, ...propertiesData];
    } else {
      // 替换整个列表
      properties.value = propertiesData;
    }
  } catch (error) {
    console.error('请求房源API出错:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载更多房源
const loadMore = () => {
  if (!hasMore.value || loading.value || loadingMore.value) return;
  
  loadingMore.value = true;
  currentPage.value++;
  fetchProperties(currentPage.value, true).finally(() => {
    loadingMore.value = false;
  });
};

// 新增房源
const addNewProperty = () => {
  console.log("添加新房源");
  uni.navigateTo({ url: '/pages/landlord/property-edit' });
};

// 编辑房源
const editProperty = (id: string) => {
  uni.navigateTo({ url: `/pages/landlord/property-edit?id=${id}` });
};

// 切换发布状态
const togglePublishStatus = (id: string, publish: boolean) => {
  const action = publish ? '发布' : '下架';
  
  uni.showModal({
    title: '确认操作',
    content: `确定要${action}该房源吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' });
          
          // 调用API修改房源状态
          const response = await put<{ success: boolean }>(`/properties/${id}/status`, {
            is_published: publish
          });
          
        uni.hideLoading();
          
          if (response && response.success) {
            // 更新本地数据
            const property = properties.value.find(p => p.id === id);
            if (property) {
              property.is_published = publish;
          }
            
            uni.showToast({ 
              title: `${action}成功`,
              icon: 'success'
            });
          } else {
            uni.showToast({ 
              title: `${action}失败`,
              icon: 'error'
            });
          }
        } catch (error) {
          uni.hideLoading();
          console.error(`${action}房源时出错:`, error);
          uni.showToast({ 
            title: `${action}失败，请重试`,
            icon: 'none'
          });
        }
      }
    }
  });
};

// 删除房源
const deleteProperty = (id: string) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除该房源吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' });
          
          // 调用API删除房源
          const response = await del<{ success: boolean }>(`/properties/${id}`);
          
        uni.hideLoading();
          
          if (response && response.success) {
            // 从本地列表中移除
          properties.value = properties.value.filter(p => p.id !== id);
            
            uni.showToast({ 
              title: '删除成功',
              icon: 'success'
            });
        } else {
            uni.showToast({ 
              title: '删除失败',
              icon: 'error'
            });
          }
        } catch (error) {
          uni.hideLoading();
          console.error('删除房源时出错:', error);
          uni.showToast({ 
            title: '删除失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 下拉刷新
const onPullDownRefresh = () => {
  currentPage.value = 1;
  fetchProperties(1, false).then(() => {
    uni.stopPullDownRefresh();
  });
};

// 页面显示时检查是否需要刷新
onShow(() => {
  if (needRefresh.value) {
    currentPage.value = 1;
    fetchProperties();
    needRefresh.value = false;
  }
});

// 页面加载时获取数据
onMounted(() => {
  fetchProperties();
  
  // 监听刷新事件
  uni.$on('refreshProperties', () => {
    // 如果当前页面不可见，设置标记等到页面可见时刷新
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      needRefresh.value = true;
    } else {
      currentPage.value = 1;
      fetchProperties();
    }
  });
});

// 页面卸载时移除事件监听
onBeforeUnmount(() => {
  uni.$off('refreshProperties');
});

// 下拉加载更多
onReachBottom(() => {
  loadMore();
});
</script>

<style>
.properties-management-page {
  padding: 15px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e8e8e8;
}

  .title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

.add-property-btn {
  background-color: #2196f3;
  color: white;
  font-size: 14px;
  padding: 0 15px;
  height: 36px;
  line-height: 36px;
  border-radius: 4px;
  border: none;
}

.loading-placeholder,
.empty-placeholder {
  text-align: center;
  padding: 60px 0;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-text {
  margin-bottom: 20px;
}

.add-first-property-btn {
  background-color: #2196f3;
  color: white;
  font-size: 14px;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
  border: none;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.property-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .property-details {
  flex: 1;
  padding-right: 15px;
}

    .property-title {
      font-size: 16px;
      font-weight: bold;
  margin-bottom: 8px;
      color: #333;
    }

    .property-meta {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
    }

    .property-status {
  font-size: 13px;
  color: #999;
      display: flex;
      align-items: center;
  }

  .property-actions {
    display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 70px;
}

    button {
  font-size: 12px;
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border-radius: 4px;
  white-space: nowrap;
  cursor: pointer;
}

.edit-btn,
.unpublish-btn,
.publish-btn,
.delete-btn {
      font-size: 12px;
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
  width: 100%;
}

.edit-btn {
  background-color: #f8f9fa;
  color: #212529;
  border: 1px solid #dee2e6;
}

.publish-btn {
  background-color: #28a745;
  color: white;
  border: none;
}

.unpublish-btn {
  background-color: #ffc107;
  color: #212529;
  border: none;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
}

.status-published {
  color: #28a745;
  font-weight: 500;
}

.status-unpublished {
  color: #6c757d;
}

.status-available {
  color: #28a745;
  font-weight: 500;
}

.status-unavailable {
  color: #dc3545;
}

.status-divider {
  margin: 0 8px;
  color: #ddd;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 15px 0;
  color: #999;
  font-size: 12px;
}
</style>
