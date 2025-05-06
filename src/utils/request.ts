/**
 * 统一HTTP请求工具
 */
import { ref } from 'vue';

// 基础URL配置
// const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = 'https://test-api.your-domain.com/api';
// 修改为内网穿透的地址
// const API_BASE_URL = 'https://你的ngrok地址/api';  // 例如：https://abcd1234.ngrok.io/api
// 或使用条件判断，根据环境切换
// const API_BASE_URL = process.env.NODE_ENV === 'development' 
//   ? 'http://localhost:3000/api' 
//   : 'https://你的服务器IP或域名/api';

// 全局加载状态
export const isLoading = ref(false);
// 全局的错误信息
export const errorMessage = ref<string | null>(null);

/**
 * 通用方法：获取页面路由参数
 * 尝试多种方式获取页面参数，提高兼容性
 */
export function getPageParams(): Record<string, string> {
  // 尝试多种方式获取页面参数
  try {
    // 方法1: getCurrentPages
    const pages = getCurrentPages();
    if (pages && pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      // @ts-ignore - 不同平台实现不同
      const options = currentPage.options || currentPage.$page?.options;
      if (options && typeof options === 'object') {
        return options;
      }
    }
  } catch (e) {
    // 静默失败
  }
  
  try {
    // 方法2: getEnterOptionsSync
    const res = uni.getEnterOptionsSync();
    if (res && res.query) {
      return res.query;
    }
  } catch (e) {
    // 静默失败
  }
  
  // 返回空对象
  return {};
}

// 自定义请求选项类型
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  [key: string]: any;
}

/**
 * 统一请求方法
 * @param endpoint 接口路径
 * @param options 请求配置
 * @returns Promise 返回数据或抛出错误
 */
export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  isLoading.value = true;
  errorMessage.value = null;
  
  return new Promise<T>((resolve, reject) => {
    const token = uni.getStorageSync('token');
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else if (res.statusCode === 401) {
          // 401 未授权，清除本地令牌并重定向到登录页
          uni.removeStorageSync('token');
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/landlord/login' });
          }, 1500);
          reject(new Error('认证失败'));
        } else {
          const errMsg = (res.data as any)?.message || `请求失败: ${res.statusCode}`;
          errorMessage.value = errMsg;
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        const errMsg = err.errMsg || '网络请求失败';
        errorMessage.value = errMsg;
        reject(new Error(errMsg));
      },
      complete: () => {
        isLoading.value = false;
      }
    });
  });
}

/**
 * GET请求
 */
export function get<T>(endpoint: string, params = {}, options = {}): Promise<T> {
  // 构建URL参数
  let url = endpoint;
  if (Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  return request<T>(url, { 
    method: 'GET',
    ...options 
  });
}

/**
 * POST请求
 */
export function post<T>(endpoint: string, data = {}, options = {}): Promise<T> {
  return request<T>(endpoint, { 
    method: 'POST',
    data,
    ...options 
  });
}

/**
 * PUT请求
 */
export function put<T>(endpoint: string, data = {}, options = {}): Promise<T> {
  return request<T>(endpoint, { 
    method: 'PUT',
    data,
    ...options 
  });
}

/**
 * DELETE请求
 */
export function del<T>(endpoint: string, options = {}): Promise<T> {
  return request<T>(endpoint, { 
    method: 'DELETE',
    ...options 
  });
}

/**
 * 上传文件
 */
export function uploadFile(endpoint: string, filePath: string, formData = {}, name = 'file'): Promise<any> {
  isLoading.value = true;
  errorMessage.value = null;
  
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    uni.uploadFile({
      url,
      filePath,
      name,
      formData,
      header: {
        // multipart/form-data 会由浏览器自动设置，不需要显式指定
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            resolve(res.data);
          }
        } else {
          const errMsg = `上传失败: ${res.statusCode}`;
          errorMessage.value = errMsg;
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        const errMsg = err.errMsg || '上传失败';
        errorMessage.value = errMsg;
        reject(new Error(errMsg));
      },
      complete: () => {
        isLoading.value = false;
      }
    });
  });
}

/**
 * 日志工具 - 可以通过常量控制是否输出日志
 * 发布前将此常量设置为false即可禁用大部分日志输出
 */
const ENABLE_DEBUG_LOGS = false;

export const logger = {
  log: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // 错误日志始终保留，便于排查问题
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.info(...args);
    }
  }
};

// 导出默认对象包含所有方法
export default {
  request,
  get,
  post,
  put,
  del,
  uploadFile,
  getPageParams,
  logger,
  isLoading,
  errorMessage
}; 