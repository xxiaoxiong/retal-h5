/**
 * 日期工具函数
 */

/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | number | string): string {
  if (!date) return '';
  
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 今天之内
  if (diff < 24 * 60 * 60 * 1000 && 
      now.getDate() === date.getDate() && 
      now.getMonth() === date.getMonth() && 
      now.getFullYear() === date.getFullYear()) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.getDate() === date.getDate() && 
      yesterday.getMonth() === date.getMonth() && 
      yesterday.getFullYear() === date.getFullYear()) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `昨天 ${hours}:${minutes}`;
  }
  
  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const day = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${hours}:${minutes}`;
  }
  
  // 本年
  if (now.getFullYear() === date.getFullYear()) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  }
  
  // 更早
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间戳为相对时间
 * @param timestamp 时间戳
 * @returns 相对时间，如"刚刚"、"5分钟前"等
 */
export function formatRelativeTime(timestamp: number | string | Date): string {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 一分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 一小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  
  // 一天内
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }
  
  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
  
  // 一个月内
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (7 * 24 * 60 * 60 * 1000))}周前`;
  }
  
  // 一年内
  if (diff < 12 * 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (30 * 24 * 60 * 60 * 1000))}个月前`;
  }
  
  // 一年以上
  return `${Math.floor(diff / (12 * 30 * 24 * 60 * 60 * 1000))}年前`;
}

/**
 * 格式化为标准时间字符串
 * @param date 日期对象或时间戳
 * @returns 标准时间字符串，如：2023-05-15 14:30:45
 */
export function formatStandardTime(date: Date | number | string): string {
  if (!date) return '';
  
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default {
  formatDate,
  formatRelativeTime,
  formatStandardTime
}; 