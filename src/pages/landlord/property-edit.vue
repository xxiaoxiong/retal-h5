<template>
  <view class="property-edit-page">
    <view class="header">
      <view class="title">{{ isEditing ? "编辑房源" : "新增房源" }}</view>
    </view>

    <view class="form-container">
      <view class="form-group">
        <view class="label">标题</view>
        <input v-model="propertyData.title" placeholder="请输入房源标题" />
      </view>

      <view class="form-group">
        <view class="label">描述</view>
        <textarea
          v-model="propertyData.description"
          placeholder="请输入房源描述"
        />
      </view>

      <view class="form-row">
        <view class="form-group half">
          <view class="label">城市</view>
          <input v-model="propertyData.city" placeholder="城市" />
        </view>
        <view class="form-group half">
          <view class="label">区域</view>
          <input v-model="propertyData.district" placeholder="区域" />
        </view>
      </view>

      <view class="form-group">
        <view class="label">详细地址</view>
        <input v-model="propertyData.address" placeholder="请输入详细地址" />
      </view>

      <view class="form-row">
        <view class="form-group half">
          <view class="label">月租金(元)</view>
          <input
            v-model="propertyData.price_per_month"
            type="number"
            placeholder="月租金"
          />
        </view>
        <view class="form-group half">
          <view class="label">面积(平方米)</view>
          <input
            v-model="propertyData.area_sqm"
            type="number"
            placeholder="面积"
          />
        </view>
      </view>

      <view class="form-row">
        <view class="form-group half">
          <view class="label">卧室数量</view>
          <input
            v-model="propertyData.bedrooms"
            type="number"
            placeholder="卧室数量"
          />
        </view>
        <view class="form-group half">
          <view class="label">卫生间数量</view>
          <input
            v-model="propertyData.bathrooms"
            type="number"
            placeholder="卫生间数量"
          />
        </view>
      </view>

      <view class="form-group">
        <view class="label">房屋类型</view>
        <picker
          @change="onPropertyTypeChange"
          :value="propertyTypeIndex"
          :range="propertyTypes"
        >
          <view class="picker-value">{{
            propertyData.property_type || "请选择房屋类型"
          }}</view>
        </picker>
      </view>

      <view class="form-group">
        <view class="label">租赁状态</view>
        <picker
          @change="onStatusChange"
          :value="statusIndex"
          :range="statusOptions"
          range-key="label"
        >
          <view class="picker-value">{{
            getStatusLabel(propertyData.status) || "请选择租赁状态"
          }}</view>
        </picker>
      </view>

      <view class="form-group">
        <view class="label">房屋设施</view>
        <view class="amenities-list">
          <view
            v-for="(item, index) in amenitiesOptions"
            :key="index"
            class="amenity-item"
            :class="{
              selected:
                propertyData.amenities &&
                propertyData.amenities.includes(item.value),
            }"
            @click="toggleAmenity(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </view>

      <view class="form-group">
        <view class="label">房源图片</view>
        <view class="image-uploader">
          <view
            v-for="(image, index) in propertyData.images || []"
            :key="index"
            class="image-item"
            :class="{ 'temp-image': isTemporaryImage(image) }"
          >
            <image :src="image" mode="aspectFill" />
            <view class="delete-btn" @click="removeImage(index)">×</view>
            <view v-if="isTemporaryImage(image)" class="temp-badge">临时</view>
          </view>
          <view class="add-image-btn" @click="chooseImage">
            <view class="plus">+</view>
            <view class="text">添加图片</view>
          </view>
        </view>
        <view class="image-tips" v-if="!isEditing">
          创建房源后可上传图片（最多9张）
        </view>
        <view class="image-tips" v-else> 最多上传9张图片 </view>
      </view>

      <view class="action-buttons">
        <button @click="() => goBack()" class="cancel-btn">取消</button>
        <button @click="saveProperty" class="save-btn">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { get, post, put, uploadFile, getPageParams } from "../../utils/request";
import type { Property } from "../../types/models";

// 获取页面参数
const propertyId = ref<string | null>(null);
const isEditing = computed(() => !!propertyId.value);

// 表单数据
const propertyData = reactive<Partial<Property>>({
  title: "",
  description: "",
  address: "",
  city: "",
  district: "",
  price_per_month: 0,
  area_sqm: 0,
  bedrooms: 1,
  bathrooms: 1,
  property_type: "",
  amenities: [],
  images: [],
  status: "available" as const,
  is_published: false,
});

// 房屋类型选项
const propertyTypes = [
  "公寓",
  "别墅",
  "独栋",
  "联排",
  "商铺",
  "办公室",
  "其他",
];
const propertyTypeIndex = ref(0);

// 租赁状态选项
const statusOptions = [
  { value: "available", label: "可租" },
  { value: "rented", label: "已租" },
  { value: "unavailable", label: "暂不可租" },
];
const statusIndex = ref(0);

// 房屋设施选项
const amenitiesOptions = [
  { value: "wifi", label: "WiFi" },
  { value: "parking", label: "停车位" },
  { value: "ac", label: "空调" },
  { value: "heat", label: "暖气" },
  { value: "washer", label: "洗衣机" },
  { value: "kitchen", label: "厨房" },
  { value: "tv", label: "电视" },
  { value: "elevator", label: "电梯" },
  { value: "refrigerator", label: "冰箱" },
  { value: "microwave", label: "微波炉" },
  { value: "balcony", label: "阳台" },
  { value: "furniture", label: "家具齐全" },
];

// 获取状态显示文本
const getStatusLabel = (value: string | undefined) => {
  if (!value) return "";
  const option = statusOptions.find((opt) => opt.value === value);
  return option ? option.label : "";
};

// 选择房屋类型
const onPropertyTypeChange = (e: any) => {
  const index = e.detail.value;
  propertyData.property_type = propertyTypes[index];
  propertyTypeIndex.value = index;
};

// 选择租赁状态
const onStatusChange = (e: any) => {
  const index = e.detail.value;
  propertyData.status = statusOptions[index].value as
    | "available"
    | "rented"
    | "unavailable";
  statusIndex.value = index;
};

// 切换房屋设施
const toggleAmenity = (value: string) => {
  if (!propertyData.amenities) {
    propertyData.amenities = [];
  }

  if (propertyData.amenities.includes(value)) {
    propertyData.amenities = propertyData.amenities.filter(
      (item) => item !== value
    );
  } else {
    propertyData.amenities.push(value);
  }
};

// 选择图片
const chooseImage = () => {
  if (!propertyData.images) {
    propertyData.images = [];
  }

  // 如果是新增模式，先提示保存
  if (!isEditing.value) {
    uni.showToast({
      title: "请先保存房源信息后再上传图片",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  uni.chooseImage({
    count: 9 - (propertyData.images?.length || 0),
    success: async (res) => {
      // 检查是否有房源ID（编辑模式才能上传图片）
      if (!propertyId.value) {
        uni.showToast({
          title: "请先保存房源信息后再上传图片",
          icon: "none",
        });
        return;
      }

      uni.showLoading({ title: "上传中..." });

      try {
        // 获取选择的图片路径
        const tempFilePaths = Array.isArray(res.tempFilePaths)
          ? res.tempFilePaths
          : [res.tempFilePaths];

        // 逐个上传图片
        let successCount = 0;

        for (const filePath of tempFilePaths) {
          try {
            // 使用后端提供的上传接口
            console.log(`尝试上传图片，房源ID: ${propertyId.value}`);

            // 使用正式接口路径
            const result = await uploadFile(
              `/properties/${propertyId.value}/images`,
              filePath,
              {}, // 额外表单数据
              "images" // 使用'images'作为字段名
            );

            console.log("上传结果:", result);

            // 处理上传结果
            if (result && result.success) {
              // 1. 检查是否有image_urls数组
              if (
                result.image_urls &&
                Array.isArray(result.image_urls) &&
                result.image_urls.length > 0
              ) {
                // 直接使用返回的图片URL数组
                for (const imageUrl of result.image_urls) {
                  if (imageUrl && typeof imageUrl === "string") {
                    if (!propertyData.images) {
                      propertyData.images = [];
                    }
                    propertyData.images.push(imageUrl);
                    successCount++;
                  }
                }
              }
              // 2. 检查其他可能的返回格式作为后备
              else if (result.url || (result.data && result.data.url)) {
                // 获取图片URL
                let imageUrl =
                  result.url || (result.data && result.data.url) || "";

                // 处理可能返回的相对路径或其他格式
                if (imageUrl) {
                  // 如果返回的是相对路径，需要补全基础URL
                  if (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) {
                    // 不是协议相对URL，但是以/开头，视为相对路径
                    const baseApiUrl = "http://localhost:3000"; // 可能需要从环境变量或配置中获取
                    imageUrl = `${baseApiUrl}${imageUrl}`;
                  }

                  if (!propertyData.images) {
                    propertyData.images = [];
                  }
                  propertyData.images.push(imageUrl);
                  successCount++;
                }
              }
            }
          } catch (err) {
            console.error("单张图片上传失败:", err);
          }
        }

        uni.hideLoading();

        if (successCount > 0) {
          uni.showToast({
            title: `成功上传${successCount}张图片`,
            icon: "success",
            duration: 2000,
          });
        } else {
          uni.showToast({
            title: "上传失败，请稍后重试",
            icon: "none",
            duration: 2000,
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error("上传图片失败:", error);

        // 简化错误提示
        uni.showToast({
          title: "上传失败，请稍后重试",
          icon: "none",
          duration: 2000,
        });
      }
    },
  });
};

// 删除图片
const removeImage = (index: number) => {
  if (propertyData.images) {
    propertyData.images.splice(index, 1);
  }
};

// 判断是否为临时图片（本地路径）
const isTemporaryImage = (path: string): boolean => {
  if (!path) return false;
  return (
    path.startsWith("blob:") ||
    path.startsWith("file:") ||
    path.startsWith("tmp") ||
    path.includes("wxfile:") ||
    path.includes("tmp_file")
  );
};

// 获取房源详情
const fetchPropertyDetail = async () => {
  if (!propertyId.value) {
    uni.showToast({ title: "缺少房源ID", icon: "none" });
    return;
  }

  try {
    uni.showLoading({ title: "加载中..." });

    // 尝试不同的API路径格式
    let url = `/properties/${propertyId.value}`;

    try {
      const response = await get<any>(url);
      uni.hideLoading();

      if (!response) {
        throw new Error("API返回空数据");
      }

      if (response && response.success && response.property) {
        // 方式1: API返回 {success: true, property: {...}}
        Object.assign(propertyData, response.property);

        // 更新选择器索引
        const propType = propertyData.property_type || "";
        propertyTypeIndex.value = propertyTypes.indexOf(propType);
        statusIndex.value = statusOptions.findIndex(
          (opt) => opt.value === propertyData.status
        );
        return; // 成功处理，返回
      } else if (response && !response.success) {
        throw new Error(response.message || "获取房源信息失败");
      } else if (
        response &&
        !response.property &&
        (response.id || response._id)
      ) {
        // 方式2: API直接返回房源对象
        Object.assign(propertyData, response);

        // 更新选择器索引
        const propType = propertyData.property_type || "";
        propertyTypeIndex.value = propertyTypes.indexOf(propType);
        statusIndex.value = statusOptions.findIndex(
          (opt) => opt.value === propertyData.status
        );
        return; // 成功处理，返回
      } else {
        // 尝试直接使用响应作为数据(最后的尝试)
        if (typeof response === "object" && response !== null) {
          Object.assign(propertyData, response);

          const propType = propertyData.property_type || "";
          propertyTypeIndex.value = propertyTypes.indexOf(propType);
          statusIndex.value = statusOptions.findIndex(
            (opt) => opt.value === propertyData.status
          );
          return; // 成功处理，返回
        }
        throw new Error("未能识别的API响应格式");
      }
    } catch (error) {
      // 尝试替代URL (有些API不带前缀/api)
      url = `/api/properties/${propertyId.value}`;

      const response = await get<any>(url);

      if (response) {
        if (response.success && response.property) {
          Object.assign(propertyData, response.property);
        } else if (response.id || response._id) {
          Object.assign(propertyData, response);
        } else {
          throw new Error("备用URL返回的数据格式不正确");
        }

        // 更新选择器索引
        const propType = propertyData.property_type || "";
        propertyTypeIndex.value = propertyTypes.indexOf(propType);
        statusIndex.value = statusOptions.findIndex(
          (opt) => opt.value === propertyData.status
        );
      } else {
        throw new Error("备用URL返回空数据");
      }
    }
  } catch (error) {
    uni.hideLoading();
    console.error("获取房源详情失败:", error);
    uni.showToast({ title: "获取房源信息失败", icon: "none" });

    // 兜底：如果后端API故障，但是ID是从正常的房源列表点击进来的，
    // 可以通过id去本地缓存或调回上一页再次获取数据
    uni.showModal({
      title: "加载失败",
      content: "无法获取房源数据，是否返回列表?",
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack();
        }
      },
    });
  }
};

// 保存房源
const saveProperty = async () => {
  // 表单验证
  if (!propertyData.title) {
    uni.showToast({ title: "请输入房源标题", icon: "none" });
    return;
  }

  if (!propertyData.address || !propertyData.city || !propertyData.district) {
    uni.showToast({ title: "请填写完整地址信息", icon: "none" });
    return;
  }

  if (!propertyData.price_per_month || propertyData.price_per_month <= 0) {
    uni.showToast({ title: "请输入有效的租金金额", icon: "none" });
    return;
  }

  try {
    uni.showLoading({ title: "保存中..." });

    // 克隆数据进行处理，避免修改原始数据
    const dataToSave = { ...propertyData };

    // 检测本地图片路径（临时预览模式下的图片）
    if (dataToSave.images && dataToSave.images.length > 0) {
      // 检查图片是否有本地临时路径（以"blob:"、"file:"或"tmp"开头，或包含"wxfile:"等）
      const hasLocalImages = dataToSave.images.some(
        (path) =>
          typeof path === "string" &&
          (path.startsWith("blob:") ||
            path.startsWith("file:") ||
            path.startsWith("tmp") ||
            path.includes("wxfile:") ||
            path.includes("tmp_file"))
      );

      if (hasLocalImages) {
        // 开发模式下，移除本地图片后保存
        const remoteImages = dataToSave.images.filter(
          (path) =>
            typeof path === "string" &&
            !(
              path.startsWith("blob:") ||
              path.startsWith("file:") ||
              path.startsWith("tmp") ||
              path.includes("wxfile:") ||
              path.includes("tmp_file")
            )
        );

        // 更新为仅包含远程图片的数组
        dataToSave.images = remoteImages;

        // 如果是编辑模式，提醒用户图片处理情况
        if (
          isEditing.value &&
          propertyData.images &&
          propertyData.images.length !== remoteImages.length
        ) {
          setTimeout(() => {
            uni.showToast({
              title: "本地图片未上传，请等待后端实现",
              icon: "none",
              duration: 2000,
            });
          }, 1500);
        }
      }
    }

    let response;
    if (isEditing.value) {
      // 更新房源
      response = await put<any>(`/properties/${propertyId.value}`, dataToSave);
    } else {
      // 创建新房源
      response = await post<any>("/properties", dataToSave);
    }

    uni.hideLoading();

    if (response && response.success) {
      uni.showToast({ title: "保存成功", icon: "success" });
      // 返回到房源列表页
      navigateToPropertyList();
    } else {
      uni.showToast({ title: "保存失败", icon: "none" });
    }
  } catch (error) {
    uni.hideLoading();
    console.error("保存房源失败:", error);
    uni.showToast({ title: "保存失败，请重试", icon: "none" });
  }
};

// 跳转到房源列表页
const navigateToPropertyList = () => {
  // 先检查页面栈，如果是从列表页进来的，就返回
  const pages = getCurrentPages();
  const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;

  if (prevPage && prevPage.route && prevPage.route.includes("properties")) {
    // 如果上一页是房源列表页，则返回并刷新
    uni.navigateBack({
      delta: 1,
      success: () => {
        // 发送事件通知上一页刷新数据
        uni.$emit("refreshProperties");
      },
    });
  } else {
    // 如果不是从列表页进来，或者是第一个页面，则直接跳转到列表页
    uni.redirectTo({
      url: "/pages/landlord/properties",
      success: () => {
        // 不需要发送刷新事件，因为跳转到列表页时会自动刷新
      },
    });
  }
};

// 返回上一页
const goBack = () => {
  // 简单返回，不需要刷新
  uni.navigateBack({ delta: 1 });

  // 如果无法返回（没有上一页），则跳转到房源列表
  setTimeout(() => {
    const pages = getCurrentPages();
    if (pages.length === 1) {
      uni.redirectTo({ url: "/pages/landlord/properties" });
    }
  }, 100);
};

// 页面加载
onMounted(() => {
  // 使用工具函数获取参数
  const params = getPageParams();

  if (params.id) {
    propertyId.value = params.id;
    fetchPropertyDetail();
  }
});
</script>

<style>
.property-edit-page {
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

.form-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.form-group.half {
  flex: 1;
}

.label {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

input,
textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  background-color: #fff;
}

textarea {
  height: 100px;
}

.picker-value {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  background-color: #fff;
}

.amenities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
}

.amenity-item {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 12px;
  background-color: #f8f8f8;
}

.amenity-item.selected {
  background-color: #e1f3ff;
  border-color: #2196f3;
  color: #2196f3;
}

.image-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.image-item {
  width: 90px;
  height: 90px;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

.image-item.temp-image {
  border: 2px dashed #ffcc00;
}

.temp-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 204, 0, 0.7);
  color: #333;
  font-size: 10px;
  text-align: center;
  padding: 2px 0;
}

.image-item image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  z-index: 2;
}

.delete-btn:hover {
  background-color: rgba(220, 53, 69, 0.8);
}

.add-image-btn {
  width: 90px;
  height: 90px;
  border: 1px dashed #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
}

.add-image-btn .plus {
  font-size: 24px;
  color: #999;
}

.add-image-btn .text {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.image-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.action-buttons button {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 4px;
  font-size: 14px;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.save-btn {
  background-color: #2196f3;
  color: #fff;
}
</style> 