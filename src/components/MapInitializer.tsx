'use client'

import { useEffect } from 'react'

export default function MapInitializer() {
  if (typeof window !== 'undefined' && !window._AMapSecurityConfig) {
    // 强制注入安全密钥，必须在 AMap 加载前完成
    window._AMapSecurityConfig = {
      securityJsCode: 'ec999086e340d6ca9b78a94747cc9d26',
    }
  }

  return null
}

declare global {
  interface Window {
    _AMapSecurityConfig: any
  }
}
