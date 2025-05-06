// utils/api.ts

// 后端API的基础URL
// 在实际部署中，这里应该配置为你的后端服务器地址
// 在开发阶段，如果后端运行在本地3000端口，可以这样设置
// 注意：微信小程序真机调试需要HTTPS或配置开发服务器域名
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api' // 开发环境地址 (需要配置代理或允许HTTP)
  : 'YOUR_PRODUCTION_BACKEND_URL/api'; // 生产环境地址

// 封装 uni.request
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
  showLoading?: boolean;
  loadingTitle?: string;
}

const request = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, header = {}, showLoading = false, loadingTitle = '加载中...' } = options;

    if (showLoading) {
      uni.showLoading({ title: loadingTitle });
    }

    // 自动附加Token
    const token = uni.getStorageSync('token'); // 假设登录后将token存储在此
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (showLoading) {
          uni.hideLoading();
        }

        // 检查HTTP状态码
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务状态码 (假设后端返回 { success: boolean, ... })
          if ((res.data as any)?.success) {
            resolve(res.data as T);
          } else {
            console.error('API Error:', url, res.data);
            uni.showToast({ title: (res.data as any)?.message || '请求失败', icon: 'none' });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // Token 无效或过期，引导重新登录
          console.error('Auth Error:', url, res);
          uni.showToast({ title: '请重新登录', icon: 'none' });
          // 清除本地存储的Token和用户信息
          uni.removeStorageSync('token');
          uni.removeStorageSync('user');
          // 跳转到登录页 (根据项目结构调整路径)
          uni.reLaunch({ url: '/pages/landlord/login' }); // 或租客登录页
          reject(res);
        } else {
          // 其他HTTP错误
          console.error('HTTP Error:', url, res);
          uni.showToast({ title: `请求错误 ${res.statusCode}`, icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        if (showLoading) {
          uni.hideLoading();
        }
        console.error('Network Error:', url, err);
        uni.showToast({ title: '网络连接错误', icon: 'none' });
        reject(err);
      }
    });
  });
};

export default request;

// 定义一些常用的API服务
export const apiService = {
  // Auth
  loginLandlord: (data: any) => request({ url: '/auth/login/password', method: 'POST', data }),
  loginWechat: (data: any) => request({ url: '/auth/login/wechat', method: 'POST', data }),
  registerLandlord: (data: any) => request({ url: '/auth/register/landlord', method: 'POST', data }),

  // Properties
  getProperties: (params?: any) => request({ url: '/properties', method: 'GET', data: params }),
  getPropertyById: (id: string) => request({ url: `/properties/${id}`, method: 'GET' }),
  createProperty: (data: any) => request({ url: '/properties', method: 'POST', data, showLoading: true }),
  updateProperty: (id: string, data: any) => request({ url: `/properties/${id}`, method: 'PUT', data, showLoading: true }),
  deleteProperty: (id: string) => request({ url: `/properties/${id}`, method: 'DELETE', showLoading: true }),
  updatePropertyStatus: (id: string, data: { is_published?: boolean; status?: string }) => request({ url: `/properties/${id}/status`, method: 'PUT', data, showLoading: true }),
  // uploadPropertyImages: (id: string, files: any) => { /* 需要特殊处理文件上传 */ },

  // Inquiries
  getInquiries: (params?: any) => request({ url: '/inquiries', method: 'GET', data: params }),
  getInquiryById: (id: string) => request({ url: `/inquiries/${id}`, method: 'GET' }),

  // Appointments
  createAppointment: (data: any) => request({ url: '/appointments', method: 'POST', data, showLoading: true }),
  getAppointments: (params?: any) => request({ url: '/appointments', method: 'GET', data: params }),
  getAppointmentById: (id: string) => request({ url: `/appointments/${id}`, method: 'GET' }),
  updateAppointmentStatus: (id: string, data: { status: string; landlord_notes?: string }) => request({ url: `/appointments/${id}/status`, method: 'PUT', data, showLoading: true }),

  // AI Chat
  postChatMessage: (data: any) => request({ url: '/ai/chat', method: 'POST', data }),

  // Stats
  getOverviewStats: () => request({ url: '/stats/overview', method: 'GET' }),
  getPropertyStats: (id: string) => request({ url: `/stats/properties/${id}`, method: 'GET' }),
};

