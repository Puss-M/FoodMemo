# 百度地图快速上手（5 分钟搞定）

## 第一步：获取百度地图 AK（应用密钥）

1. 访问：https://lbsyun.baidu.com/apiconsole/key
2. 登录百度账号
3. 点击"创建应用"
4. 填写：
   - **应用名称**：FoodMemo
   - **应用类型**：浏览器端
   - **白名单**：`*`（开发阶段用，上线后改成你的域名）
5. 点击"提交"，复制生成的 **AK**（一串字符）

## 第二步：配置到项目

打开 `src/components/LocationPicker.tsx`，找到第 20 行：

```typescript
script.src = `https://api.map.baidu.com/api?v=3.0&ak=你的百度地图AK&callback=initBaiduMap`;
```

把 `你的百度地图AK` 替换成刚才复制的 AK。

**就这样！没有安全密钥，没有额外配置！**

## 第三步：测试

1. 保存文件
2. 刷新页面
3. 点击"选择地点"
4. 搜索"西南财经大学"
5. 应该能看到搜索结果了！

---

## 💡 环境变量版（推荐上线使用）

如果你想用环境变量（更安全），在 `.env.local` 添加：

```
NEXT_PUBLIC_BAIDU_MAP_AK=你的AK
```

然后把 LocationPicker 第 20 行改成：

```typescript
script.src = `https://api.map.baidu.com/api?v=3.0&ak=${process.env.NEXT_PUBLIC_BAIDU_MAP_AK}&callback=initBaiduMap`;
```

## ✅ 优势

- ✅ 只需要一个 AK
- ✅ 没有安全密钥折磨
- ✅ 配置超简单
- ✅ API 稳定好用

爽！🎉
