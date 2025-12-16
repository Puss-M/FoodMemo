'use client';

import { useEffect } from 'react';

/**
 * 全局 AMap 安全密钥注入器
 * 必须在所有地图组件加载之前执行
 */
export default function AMapRegistry() {
  useEffect(() => {
    // 确保在客户端且只执行一次
    if (typeof window !== 'undefined' && !(window as any)._AMapSecurityConfig) {
      (window as any)._AMapSecurityConfig = {
        securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE,
      };
      console.log('✅ AMap 安全密钥已全局注入');
    }
  }, []);

  return null; // 不渲染任何内容
}
