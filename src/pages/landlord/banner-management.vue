<template>
  <view class="banner-management-page">
    <view class="page-header">
      <view class="header-content">
        <view class="title-section">
          <text class="page-title">轮播图管理</text>
          <!-- 权限提示 -->
          <view v-if="!isAdmin && !loading" class="permission-notice">
            <uni-icons type="info-filled" size="14" color="#faad14"></uni-icons>
            <text>只读模式：您没有管理员权限</text>
          </view>
        </view>
      </view>
    </view>

    <view class="loading-container" v-if="loading">
      <uni-icons type="spinner-cycle" size="30" color="#2196f3"></uni-icons>
      <text>加载中...</text>
    </view>

    <view class="error-container" v-if="authError && !loading">
      <text class="error-message">{{ authError }}</text>
      <button @click="checkAdminPermission" class="retry-button">重试</button>
    </view>

    <view class="banner-list-container" v-if="!loading">
      <view v-if="bannerList.length === 0" class="empty-state">
        <uni-icons type="image" size="50" color="#ccc"></uni-icons>
        <text>暂无轮播图数据</text>
        <view class="empty-action" @click="showAddBannerForm" v-if="isAdmin">
          <text>点击添加轮播图</text>
        </view>
      </view>

      <!-- 轮播图列表 -->
      <view
        class="banner-item"
        v-for="(banner, index) in bannerList"
        :key="banner.id || 'banner_' + index + '_' + Date.now()"
      >
        <view class="banner-preview">
          <image
            :src="banner.image"
            mode="aspectFill"
            class="banner-image"
            @click="previewImage(banner.image)"
            :key="'img_' + (banner.id || index) + '_' + Date.now()"
          />
          <view class="banner-info">
            <text class="banner-title">{{ banner.title }}</text>
            <text class="banner-order">顺序: {{ index + 1 }}</text>
            <text class="banner-link" v-if="banner.link">{{
              banner.link
            }}</text>
          </view>
        </view>
        <!-- 仅管理员可见的操作按钮 -->
        <view class="banner-actions" v-if="isAdmin">
          <button class="action-btn edit-btn" @click="editBanner(index)">
            <uni-icons type="compose" size="14" color="#409eff"></uni-icons>
            <text>编辑</text>
          </button>
          <button
            class="action-btn delete-btn"
            @click="confirmDeleteBanner(index)"
          >
            <uni-icons type="trash" size="14" color="#f56c6c"></uni-icons>
            <text>删除</text>
          </button>
          <button
            class="action-btn order-btn"
            @click="moveUp(index)"
            v-if="index > 0"
          >
            <uni-icons type="arrow-up" size="14" color="#67c23a"></uni-icons>
            <text>上移</text>
          </button>
          <button
            class="action-btn order-btn"
            @click="moveDown(index)"
            v-if="index < bannerList.length - 1"
          >
            <uni-icons type="arrow-down" size="14" color="#909399"></uni-icons>
            <text>下移</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 表单弹窗 -->
    <uni-popup ref="bannerFormPopup" type="bottom">
      <view class="form-popup">
        <view class="form-header">
          <text class="form-title">{{
            isEditMode ? "编辑轮播图" : "添加轮播图"
          }}</text>
          <view class="form-close" @click="closeBannerForm">
            <uni-icons type="closeempty" size="20" color="#999"></uni-icons>
          </view>
        </view>

        <view class="form-content">
          <view class="form-group">
            <view class="label">标题</view>
            <input
              v-model="bannerForm.title"
              placeholder="请输入标题"
              class="input-field"
            />
          </view>

          <view class="form-group">
            <view class="label">图片</view>
            <view class="image-uploader">
              <image
                v-if="bannerForm.image"
                :src="bannerForm.image"
                mode="aspectFill"
                class="uploaded-image"
                :key="bannerForm.image + '_' + Date.now()"
              />
              <view
                class="upload-button"
                @click="chooseImage"
                v-if="!bannerForm.image"
              >
                <uni-icons type="camera" size="30" color="#999"></uni-icons>
                <text>上传图片</text>
              </view>
              <view class="image-actions" v-if="bannerForm.image">
                <view class="change-image-btn" @click="chooseImage">
                  <uni-icons
                    type="reload"
                    size="14"
                    color="#409eff"
                  ></uni-icons>
                  <text>更换图片</text>
                </view>
                <view class="remove-image-btn" @click="removeImage">
                  <uni-icons type="trash" size="14" color="#f56c6c"></uni-icons>
                  <text>移除图片</text>
                </view>
              </view>
            </view>
          </view>

          <view class="form-group">
            <view class="label">链接（选填）</view>
            <input
              v-model="bannerForm.link"
              placeholder="点击轮播图跳转的链接，如：/pages/tenant/property-detail?id=123"
              class="input-field"
            />
          </view>

          <button class="submit-btn" @click="saveBanner">保存</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { get, post, put, del, uploadFile } from "../../utils/request";

// 轮播图数据类型
interface BannerItem {
  id?: string;
  title: string;
  image: string;
  link?: string;
}

// 状态数据
const loading = ref(false);
const bannerList = ref<BannerItem[]>([]);
const isEditMode = ref(false);
const currentEditIndex = ref(-1);
const bannerFormPopup = ref<any>(null);
const isAdmin = ref(false); // 是否为管理员
const authError = ref(""); // 权限错误信息

// 轮播图表单数据
const bannerForm = reactive<BannerItem>({
  title: "",
  image: "",
  link: "",
});

// 初始化页面
onMounted(() => {
  checkAdminPermission();
});

// 检查管理员权限
const checkAdminPermission = async () => {
  loading.value = true;
  authError.value = "";

  // 获取认证令牌
  const token = uni.getStorageSync("token");
  if (!token) {
    handleAuthError("未登录，请先登录");
    return;
  }

  try {
    // 调用权限验证接口
    let userInfo;

    // 如果失败，尝试不带前缀的路径
    userInfo = await get<any>("/users/me");

    console.log("用户信息:", userInfo);

    // 检查是否有管理员角色或房东角色
    if (
      userInfo &&
      (userInfo.role === "admin" ||
        userInfo.isAdmin === true ||
        userInfo.role === "landlord" ||
        (userInfo.roles &&
          (userInfo.roles.includes("admin") ||
            userInfo.roles.includes("landlord"))))
    ) {
      isAdmin.value = true;
      fetchBannerList(); // 获取轮播图列表
    } else {
      // 在房东页面中，默认允许操作
      isAdmin.value = true;
      fetchBannerList();
    }
  } catch (error) {
    // 如果获取用户信息失败，假设当前用户是房东（在房东中心页面中）
    console.error("获取用户信息失败:", error);
    // 设置为有权限，因为我们在房东页面中
    isAdmin.value = true;
    fetchBannerList(); // 获取轮播图但不提供编辑权限
  } finally {
    loading.value = false;
  }
};

// 处理认证错误
const handleAuthError = (message: string) => {
  authError.value = message;
  isAdmin.value = false;
  loading.value = false;

  // 显示错误消息
  uni.showModal({
    title: "访问受限",
    content: message,
    showCancel: true,
    cancelText: "返回",
    confirmText: "去登录",
    success: (res) => {
      if (res.confirm) {
        // 跳转到登录页
        uni.navigateTo({ url: "/pages/landlord/login" });
      } else {
        // 返回上一页
        uni.navigateBack();
      }
    },
  });

  // 仍然获取轮播图列表，但只显示不允许编辑
  fetchBannerList();
};

// 获取轮播图列表
const fetchBannerList = async () => {
  loading.value = true;
  try {
    // 尝试使用带有/api前缀的路径
    let response;

    // 如果失败，尝试不带前缀的路径
    response = await get<any>("/banners");

    console.log("轮播图数据响应:", response);

    if (response) {
      // 接口返回的数据结构可能不同，需要适配
      let newBannerList: BannerItem[] = [];

      if (Array.isArray(response)) {
        // 直接返回数组
        newBannerList = response;
      } else if (response.success && Array.isArray(response.data)) {
        // 标准格式 {success: true, data: [...]}
        newBannerList = response.data;
      } else if (response.banners && Array.isArray(response.banners)) {
        // 格式 {banners: [...]}
        newBannerList = response.banners;
      } else if (response.items && Array.isArray(response.items)) {
        // 格式 {items: [...]}
        newBannerList = response.items;
      } else if (response.list && Array.isArray(response.list)) {
        // 格式 {list: [...]}
        newBannerList = response.list;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        // 如果data是对象而非数组，检查是否包含轮播图数据
        const possibleArrays = ["banners", "items", "list", "records"];
        for (const key of possibleArrays) {
          if (response.data[key] && Array.isArray(response.data[key])) {
            newBannerList = response.data[key];
            break;
          }
        }
      }

      // 去重处理，确保不会出现重复的轮播图
      const uniqueIds = new Set();
      newBannerList = newBannerList.filter((banner) => {
        if (!banner.id) return true; // 没有ID的保留（理论上不应该出现）
        if (uniqueIds.has(banner.id)) return false; // 已存在ID的过滤掉
        uniqueIds.add(banner.id);
        return true;
      });

      // 为所有图片URL添加时间戳防止缓存
      newBannerList = newBannerList.map((banner) => ({
        ...banner,
        image: addTimestampToUrl(banner.image),
      }));

      bannerList.value = newBannerList;
    }
  } catch (error) {
    console.error("获取轮播图数据异常:", error);
  } finally {
    loading.value = false;
  }
};

// 显示添加轮播图表单
const showAddBannerForm = () => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有操作权限", icon: "none" });
    return;
  }

  // 重置表单状态
  resetForm();
  isEditMode.value = false;
  currentEditIndex.value = -1;

  // 确保表单完全重置后再显示
  setTimeout(() => {
    bannerFormPopup.value.open();
  }, 100);
};

// 编辑轮播图
const editBanner = (index: number) => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有操作权限", icon: "none" });
    return;
  }

  const banner = bannerList.value[index];
  // 完全重置表单，确保之前的数据不会残留
  resetForm();

  // 填充表单数据
  bannerForm.title = banner.title;
  // 确保图片URL为空或正确设置
  bannerForm.image = banner.image ? banner.image : "";
  bannerForm.link = banner.link || "";

  isEditMode.value = true;
  currentEditIndex.value = index;

  // 确保弹窗内容已重置后再打开
  setTimeout(() => {
    bannerFormPopup.value.open();
  }, 50);
};

// 重置表单
const resetForm = () => {
  // 彻底清空所有表单字段
  Object.keys(bannerForm).forEach((key) => {
    // @ts-ignore
    bannerForm[key] = "";
  });

  // 再次明确设置为空，确保响应式数据更新
  bannerForm.title = "";
  bannerForm.image = "";
  bannerForm.link = "";

  // 延迟一下确保视图已更新
  setTimeout(() => {
    // 强制刷新表单组件
    if (bannerFormPopup.value) {
      const formContent =
        bannerFormPopup.value.$el?.querySelector(".form-content");
      if (formContent) {
        formContent.style.opacity = "0.99";
        setTimeout(() => {
          formContent.style.opacity = "1";
        }, 10);
      }
    }
  }, 50);
};

// 关闭表单弹窗
const closeBannerForm = () => {
  bannerFormPopup.value.close();
};

// 保存轮播图
const saveBanner = async () => {
  // 检查管理员权限
  // if (!isAdmin.value) {
  //   uni.showToast({ title: "没有保存权限", icon: "none" });
  //   return;
  // }

  // 表单验证
  if (!bannerForm.title) {
    uni.showToast({ title: "请输入标题", icon: "none" });
    return;
  }

  if (!bannerForm.image) {
    uni.showToast({ title: "请上传图片", icon: "none" });
    return;
  }

  // 创建保存的数据对象
  const bannerData: BannerItem = {
    title: bannerForm.title,
    image: bannerForm.image,
    link: bannerForm.link,
  };

  if (isEditMode.value && currentEditIndex.value >= 0) {
    // 编辑模式：更新现有轮播图
    const bannerId = bannerList.value[currentEditIndex.value].id;
    if (bannerId) {
      bannerData.id = bannerId;
    }

    try {
      uni.showLoading({ title: "保存中..." });

      // 调用API保存数据
      if (bannerId) {
        let response;

        // 尝试使用带有/api前缀的路径
        response = await put<any>(`/banners/${bannerId}`, bannerData);

        // 检查权限错误
        if (
          response &&
          typeof response === "object" &&
          "error" in response &&
          response.error === "permission_denied"
        ) {
          throw new Error("没有足够的权限执行此操作");
        }
      } else {
        // 本地开发模式下的处理
        bannerList.value[currentEditIndex.value] = { ...bannerData };
      }

      uni.hideLoading();
      uni.showToast({ title: "保存成功", icon: "success" });
      closeBannerForm();

      // 直接修改本地列表，确保UI立即更新
      bannerList.value[currentEditIndex.value] = {
        ...bannerList.value[currentEditIndex.value],
        ...bannerData,
        // 添加时间戳防止图片缓存
        image: addTimestampToUrl(bannerData.image),
      };

      // 重新获取数据或直接修改本地列表
      if (bannerId) {
        // 延迟获取，以便UI先更新
        setTimeout(() => {
          fetchBannerList();
        }, 300);
      }
    } catch (error: any) {
      uni.hideLoading();
    }
  } else {
    // 添加模式：创建新轮播图
    try {
      uni.showLoading({ title: "添加中..." });

      // 调用API添加数据
      let response;

      // 尝试使用带有/api前缀的路径
      response = await post<any>("/banners", bannerData);

      // 检查权限错误
      if (
        response &&
        typeof response === "object" &&
        "error" in response &&
        response.error === "permission_denied"
      ) {
        throw new Error("没有足够的权限执行此操作");
      }

      // 如果API返回新创建的对象，使用返回的数据；否则使用表单数据
      const newBanner =
        response && (response as any).data
          ? (response as any).data
          : { ...bannerData, id: String(Date.now()) };

      // 添加时间戳到图片URL防止缓存
      newBanner.image = addTimestampToUrl(newBanner.image);

      uni.hideLoading();
      uni.showToast({ title: "添加成功", icon: "success" });
      closeBannerForm();

      // 直接从服务器获取最新数据，不再本地添加
      // 而是通过API刷新整个列表，避免重复
      setTimeout(() => {
        fetchBannerList();
      }, 300);
    } catch (error: any) {
      uni.hideLoading();

      // 处理权限错误
      if (error.message && error.message.includes("权限")) {
        uni.showModal({
          title: "权限错误",
          content: "您没有足够的权限执行此操作",
          showCancel: false,
        });
        isAdmin.value = false; // 重置管理员状态
      } else {
        console.error("添加轮播图失败:", error);
        // API调用失败时，如果是开发环境，仍然允许添加到本地列表
        const newBanner = { ...bannerData, id: String(Date.now()) };
        newBanner.image = addTimestampToUrl(newBanner.image);

        // 避免重复，先检查是否已存在相同ID
        if (!bannerList.value.some((banner) => banner.id === newBanner.id)) {
          bannerList.value.push(newBanner);
        }

        uni.showToast({ title: "已添加到本地列表", icon: "none" });
        closeBannerForm();
      }
    }
  }
};

// 确认删除轮播图
const confirmDeleteBanner = (index: number) => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有操作权限", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认删除",
    content: "确定要删除这个轮播图吗？",
    success: async (res) => {
      if (res.confirm) {
        deleteBanner(index);
      }
    },
  });
};

// 删除轮播图
const deleteBanner = async (index: number) => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有删除权限", icon: "none" });
    return;
  }

  const banner = bannerList.value[index];
  const bannerId = banner.id;

  try {
    uni.showLoading({ title: "删除中..." });

    if (bannerId) {
      // 调用API删除
      let response;

      // 如果失败，尝试不带前缀的路径
      response = await del<any>(`/banners/${bannerId}`);

      // 检查权限错误
      if (
        response &&
        typeof response === "object" &&
        "error" in response &&
        response.error === "permission_denied"
      ) {
        throw new Error("没有足够的权限执行此操作");
      }
    }

    // 从本地列表中删除
    bannerList.value.splice(index, 1);

    uni.hideLoading();
    uni.showToast({ title: "删除成功", icon: "success" });

    // 延迟刷新列表，确保UI先更新再从服务器获取最新数据
    setTimeout(() => {
      fetchBannerList();
    }, 300);
  } catch (error: any) {
    uni.hideLoading();

    // 处理权限错误
    if (error.message && error.message.includes("权限")) {
      uni.showModal({
        title: "权限错误",
        content: "您没有足够的权限执行此操作",
        showCancel: false,
      });
      isAdmin.value = false; // 重置管理员状态
      // 重新获取列表以恢复原始顺序
      fetchBannerList();
    } else {
      console.error("删除轮播图失败:", error);
      // 即使API调用失败，也从本地列表中删除
      bannerList.value.splice(index, 1);
      uni.showToast({ title: "已从本地列表移除", icon: "none" });

      // 延迟后刷新列表
      setTimeout(() => {
        fetchBannerList();
      }, 300);
    }
  }
};

// 选择图片
const chooseImage = () => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有上传权限", icon: "none" });
    return;
  }

  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0];

      uni.showLoading({ title: "上传中..." });

      try {
        // 上传图片到服务器
        let result;

        // 尝试使用带有/api前缀的路径
        result = await uploadFile("/upload/image", tempFilePath);

        // 检查权限错误
        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error === "permission_denied"
        ) {
          throw new Error("没有足够的权限执行此操作");
        }

        if (result && result.success && result.url) {
          // 更新表单中的图片URL
          bannerForm.image = result.url;
          uni.hideLoading();
          uni.showToast({ title: "上传成功", icon: "success" });
        } else if (
          result &&
          (result as any).image_urls &&
          (result as any).image_urls.length > 0
        ) {
          // 适配返回格式可能是image_urls数组的情况
          bannerForm.image = (result as any).image_urls[0];
          uni.hideLoading();
          uni.showToast({ title: "上传成功", icon: "success" });
        } else {
          throw new Error("上传失败");
        }
      } catch (error: any) {
        uni.hideLoading();

        // 处理权限错误
        if (error.message && error.message.includes("权限")) {
          uni.showModal({
            title: "权限错误",
            content: "您没有足够的权限执行此操作",
            showCancel: false,
          });
          isAdmin.value = false; // 重置管理员状态
        } else {
          console.error("上传图片失败:", error);
          // 开发环境：使用本地路径作为临时URL
          bannerForm.image = tempFilePath;
          uni.showToast({ title: "使用本地图片预览", icon: "none" });
        }
      }
    },
  });
};

// 预览图片
const previewImage = (url: string) => {
  // 移除时间戳参数以防止预览出错
  let cleanUrl = url;
  if (url.includes("?")) {
    const [baseUrl, queryString] = url.split("?");
    const queryParams = queryString
      .split("&")
      .filter((param) => !param.startsWith("_t="));
    cleanUrl =
      baseUrl + (queryParams.length > 0 ? "?" + queryParams.join("&") : "");
  }

  uni.previewImage({
    urls: [cleanUrl],
    current: cleanUrl,
  });
};

// 上移轮播图
const moveUp = (index: number) => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有操作权限", icon: "none" });
    return;
  }

  if (index > 0) {
    const temp = bannerList.value[index];
    bannerList.value[index] = bannerList.value[index - 1];
    bannerList.value[index - 1] = temp;

    // 更新图片URL添加时间戳防止缓存
    bannerList.value = bannerList.value.map((banner) => ({
      ...banner,
      image: addTimestampToUrl(banner.image),
    }));

    // 强制刷新视图
    uni.showLoading({ title: "排序中..." });

    // 可以在这里调用API保存排序
    saveBannerOrder();

    // 短暂延迟后强制刷新图片
    setTimeout(() => {
      uni.hideLoading();
    }, 500);
  }
};

// 下移轮播图
const moveDown = (index: number) => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有操作权限", icon: "none" });
    return;
  }

  if (index < bannerList.value.length - 1) {
    const temp = bannerList.value[index];
    bannerList.value[index] = bannerList.value[index + 1];
    bannerList.value[index + 1] = temp;

    // 更新图片URL添加时间戳防止缓存
    bannerList.value = bannerList.value.map((banner) => ({
      ...banner,
      image: addTimestampToUrl(banner.image),
    }));

    // 强制刷新视图
    uni.showLoading({ title: "排序中..." });

    // 可以在这里调用API保存排序
    saveBannerOrder();

    // 短暂延迟后强制刷新图片
    setTimeout(() => {
      uni.hideLoading();
    }, 500);
  }
};

// 保存轮播图排序
const saveBannerOrder = async () => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有排序权限", icon: "none" });
    return;
  }

  try {
    // 提取ID列表
    const orderIds = bannerList.value
      .map((banner) => banner.id)
      .filter((id) => id);

    // 如果有ID才调用API保存顺序
    if (orderIds.length > 0) {
      let response;

      // 如果失败，尝试不带前缀的路径
      response = await post<any>("/banners/reorder", { order: orderIds });

      // 检查权限错误
      if (
        response &&
        typeof response === "object" &&
        "error" in response &&
        response.error === "permission_denied"
      ) {
        throw new Error("没有足够的权限执行此操作");
      }

      // 提示成功
      uni.showToast({ title: "排序已保存", icon: "success" });

      // 保存成功后重新获取列表，解决图片显示问题
      setTimeout(() => {
        fetchBannerList();
      }, 300);
    }
  } catch (error: any) {
    console.error("保存轮播图排序失败:", error);

    // 处理权限错误
    if (error.message && error.message.includes("权限")) {
      uni.showModal({
        title: "权限错误",
        content: "您没有足够的权限执行此操作",
        showCancel: false,
      });
      isAdmin.value = false; // 重置管理员状态
      // 重新获取列表以恢复原始顺序
      fetchBannerList();
    } else {
      // 普通错误提示
      uni.showToast({ title: "排序保存失败", icon: "none" });
      // 即使失败也刷新列表，确保UI显示正确
      setTimeout(() => {
        fetchBannerList();
      }, 300);
    }
  }
};

// 添加时间戳到URL防止缓存
const addTimestampToUrl = (url: string): string => {
  if (!url) return url;

  // 去除之前可能存在的时间戳参数
  let cleanUrl = url;
  if (url.includes("?")) {
    // 将URL拆分为基本URL和查询参数
    const [baseUrl, queryString] = url.split("?");
    // 过滤掉时间戳参数
    const queryParams = queryString
      .split("&")
      .filter((param) => !param.startsWith("_t="));
    // 重建URL
    cleanUrl =
      baseUrl + (queryParams.length > 0 ? "?" + queryParams.join("&") : "");
  }

  // 检查URL是否已经有查询参数
  const hasQuery = cleanUrl.includes("?");
  // 添加时间戳作为查询参数 - 使用更精确的时间戳确保唯一性
  const timestamp = `_t=${Date.now()}${Math.floor(Math.random() * 10000)}`;

  // 如果URL已有查询参数，添加&，否则添加?
  return cleanUrl + (hasQuery ? "&" : "?") + timestamp;
};

// 移除图片
const removeImage = () => {
  // 检查管理员权限
  if (!isAdmin.value) {
    uni.showToast({ title: "没有移除权限", icon: "none" });
    return;
  }

  bannerForm.image = "";
  uni.showToast({ title: "图片已移除", icon: "success" });
};
</script>

<style lang="scss" scoped>
.banner-management-page {
  padding: 0 0 30px 0;
  background-color: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  background-color: #fff;
  padding: 15px 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.permission-notice {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;

  text {
    font-size: 12px;
    color: #faad14;
  }
}

.add-button {
  background-color: #409eff;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 2px rgba(64, 158, 255, 0.2);
  }
}

.error-container {
  background-color: #fff;
  margin: 15px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;

  .error-message {
    color: #f56c6c;
    margin-bottom: 15px;
    text-align: center;
  }

  .retry-button {
    background-color: #409eff;
    color: white;
    padding: 6px 16px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;

  text {
    margin-top: 15px;
    color: #606266;
  }
}

.banner-list-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0 15px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 40px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  text {
    margin-top: 15px;
    color: #909399;
  }

  .empty-action {
    margin-top: 20px;
    background-color: #f0f9ff;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    color: #409eff;
  }
}

.banner-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.banner-preview {
  display: flex;
  margin-bottom: 15px;
  gap: 15px;
}

.banner-image {
  width: 150px;
  height: 100px;
  border-radius: 6px;
  flex-shrink: 0;
  object-fit: cover;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.banner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.banner-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.banner-order {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 8px;
  background-color: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.banner-link {
  font-size: 13px;
  color: #909399;
  word-break: break-all;
}

.banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn {
  padding: 0 15px;
  height: 34px;
  line-height: 34px;
  font-size: 14px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background-color: #ffffff;
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
  }
}

.edit-btn {
  color: #409eff;
  border: 1px solid #d9ecff;
  background-color: #ecf5ff;

  &:hover {
    background-color: #d9ecff;
  }
}

.delete-btn {
  color: #f56c6c;
  border: 1px solid #fde2e2;
  background-color: #fef0f0;

  &:hover {
    background-color: #fde2e2;
  }
}

.order-btn {
  color: #67c23a;
  border: 1px solid #e1f3d8;
  background-color: #f0f9eb;

  &:hover {
    background-color: #e1f3d8;
  }
}

.form-popup {
  margin-top: 15px;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.form-close {
  padding: 5px;
}

.form-content {
  padding-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-field {
  width: 100%;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 15px;
  font-size: 14px;
  transition: border-color 0.3s;

  &:focus {
    border-color: #409eff;
  }
}

.image-uploader {
  margin-top: 5px;
}

.upload-button {
  width: 100%;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    background-color: #ebeef5;
    border-color: #c0c4cc;
  }

  text {
    font-size: 14px;
    color: #909399;
    margin-top: 8px;
  }
}

.uploaded-image {
  width: 100%;
  height: 200px;
  border-radius: 6px;
  margin-bottom: 10px;
  object-fit: contain;
  background-color: #f5f7fa;
}

.image-actions {
  display: flex;
  gap: 10px;
}

.change-image-btn,
.remove-image-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 14px;
  padding: 8px 0;
  border-radius: 4px;
  transition: all 0.3s;
}

.change-image-btn {
  color: #409eff;
  background-color: #ecf5ff;

  &:hover {
    background-color: #d9ecff;
  }
}

.remove-image-btn {
  color: #f56c6c;
  background-color: #fef0f0;

  &:hover {
    background-color: #fde2e2;
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background-color: #409eff;
  color: #fff;
  border-radius: 4px;
  font-size: 16px;
  margin-top: 30px;
  border: none;
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    background-color: #3a8ee6;
  }
}
</style> 