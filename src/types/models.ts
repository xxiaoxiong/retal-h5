/**
 * 数据模型类型定义
 */

// 房源类型
export interface Property {
  id: string;
  created_at: string;
  updated_at: string;
  landlord_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  district: string;
  price_per_month: number;
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  amenities: string[];
  images: string[];
  status: 'available' | 'rented' | 'unavailable';
  is_published: boolean;
}

// 预约看房类型
export interface Appointment {
  id: string;
  property_id: string;
  tenant_id: string;
  created_at: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
}

// 咨询类型
export interface Inquiry {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  created_at: string;
  updated_at: string;
  status: 'open' | 'closed';
}

// 消息类型
export interface Message {
  id: string;
  inquiry_id: string;
  sender_id: string;
  sender_type: 'tenant' | 'landlord';
  created_at: string;
  content: string;
  is_read: boolean;
}

// 用户类型
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  auth_user_id: string | null;
  role: 'tenant' | 'landlord' | 'admin';
  nickname: string;
  avatar_url: string;
  phone_number: string;
  openid: string | null;
  username?: string;
}

// 统计数据类型
export interface Stats {
  totalProperties: number;
  publishedProperties: number;
  newInquiries: number;
  pendingAppointments: number;
} 