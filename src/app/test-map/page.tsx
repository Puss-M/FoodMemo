'use client';

import { useEffect, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

export default function TestMap() {
  const [status, setStatus] = useState('初始化中...');
  const [searchResult, setSearchResult] = useState('等待搜索...');

  useEffect(() => {
    // 1. 暴力注入安全密钥 (测试用，通过后换回环境变量)
    (window as any)._AMapSecurityConfig = {
      securityJsCode: '你的安全密钥jscode填这里', // 🔴 替换成你的长串密钥
    };

    // 2. 加载地图
    AMapLoader.load({
      key: '你的Web端Key填这里', // 🔴 替换成你的短串Key
      version: '2.0',
      plugins: ['AMap.AutoComplete', 'AMap.PlaceSearch'],
    })
      .then((AMap) => {
        setStatus('✅ 地图 SDK 加载成功！开始测试搜索...');

        // 3. 立即测试搜索功能
        const placeSearch = new AMap.PlaceSearch({
          city: '成都', // 强制指定城市，防止范围问题
        });

        placeSearch.search('西南财经大学', (status: string, result: any) => {
          if (status === 'complete' && result.info === 'OK') {
            console.log('✅ 搜索成功:', result);
            setSearchResult(`✅ 测试通过！搜到: ${result.poiList.pois[0].name}`);
          } else {
            console.error('❌ 搜索失败:', result);
            setSearchResult(`❌ 搜索失败: ${JSON.stringify(result)}`);
          }
        });
      })
      .catch((e) => {
        console.error(e);
        setStatus(`❌ SDK 加载挂了: ${e}`);
      });
  }, []);

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-orange-600">🗺️ 高德地图"生死"测试</h1>
      
      <div className="border-2 border-orange-200 p-6 rounded-lg bg-orange-50 mb-6">
        <div className="mb-4">
          <span className="font-bold text-zinc-700">SDK状态: </span>
          <span className="text-lg">{status}</span>
        </div>
        <div>
          <span className="font-bold text-zinc-700">搜索测试: </span>
          <span className="text-lg">{searchResult}</span>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="font-bold text-yellow-800 mb-2">⚠️ 使用说明：</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
          <li>打开 <code className="bg-yellow-100 px-1 rounded">src/app/test-map/page.tsx</code></li>
          <li>把第 10 行的 <code className="bg-yellow-100 px-1 rounded">securityJsCode</code> 替换成你的<strong>长串安全密钥</strong></li>
          <li>把第 15 行的 <code className="bg-yellow-100 px-1 rounded">key</code> 替换成你的<strong>短串 Web 端 Key</strong></li>
          <li>保存文件，刷新这个页面</li>
          <li>如果失败，按 <kbd className="bg-zinc-200 px-2 py-1 rounded">F12</kbd> 打开控制台截图给我</li>
        </ol>
      </div>

      <div className="mt-6 text-sm text-zinc-500">
        <p>📍 当前测试：搜索"西南财经大学"（成都）</p>
        <p>✅ 成功标志：显示"测试通过！搜到: xxx"</p>
        <p>❌ 失败：查看控制台错误信息</p>
      </div>
    </div>
  );
}
