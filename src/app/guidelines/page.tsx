import Navbar from '@/components/Navbar'
import MobileNavbar from '@/components/MobileNavbar'
import Link from 'next/link'
import { ArrowLeft, Shield, Edit3, Settings, AlertTriangle, Heart } from 'lucide-react'

export const metadata = {
  title: 'FoodMemo - 用户须知 & 社区公约',
  description: '了解 FoodMemo 的使用指南和社区规则',
}

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-32">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">
            FoodMemo 用户须知 & 社区公约
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
            <span>版本号：v1.0 (内测版)</span>
            <span>•</span>
            <span>最后更新：2025年12月</span>
          </div>
        </div>

        {/* Welcome */}
        <div className="bg-linear-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-orange-500/20">
          <p className="text-lg leading-relaxed">
            欢迎来到 <strong>FoodMemo</strong>！这是一个基于熟人信任链的高质量美食分享小圈子。
            我们致力于解决"去哪吃"的终极难题，<strong>拒绝广子，只说真话</strong>。
          </p>
        </div>

        <p className="text-zinc-600 mb-10 text-center">
          在开始探索之前，请阅读以下指南：
        </p>

        {/* Section 1 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">1. 🛡️ 为什么是邀请制？</h2>
          </div>
          <p className="text-zinc-600 mb-4">
            FoodMemo 不是大众点评，我们不追求海量用户，只追求<strong>真实可信</strong>。
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-orange-500 font-bold">门槛</span>
              <span className="text-zinc-600">只有持有邀请码的朋友才能加入。</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 font-bold">责任</span>
              <span className="text-zinc-600">请珍惜您手中的邀请码，只把它分享给您信任的、乐于分享真实体验的朋友。</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 font-bold">溯源</span>
              <span className="text-zinc-600">系统记录了邀请链路，让我们共同维护这个圈子的纯净度。</span>
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">2. ✍️ 提倡发布什么内容？</h2>
          </div>
          <p className="text-zinc-600 mb-4">
            我们鼓励<strong>"场景化"和"情绪化"</strong>的真实表达：
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">场景决策</span>
              <span className="text-zinc-600">善用标签！是 👤 一人食 的宝藏小店，还是适合 🍻 部门团建 的吵闹餐厅？请标记清楚，帮大家节省决策时间。</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">菜系避雷</span>
              <span className="text-zinc-600">🌶️ 川菜 🥟 粤菜 分类要选对。吃到难吃的请务必打上 #避雷 标签，你的痛苦能帮校友省钱。</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">真实图片</span>
              <span className="text-zinc-600">无需精修图，真实的食物照片最有食欲。</span>
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">3. 🛠️ 玩转核心功能</h2>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <span className="text-2xl">📍</span>
              <div>
                <span className="font-bold text-zinc-900">真实定位</span>
                <p className="text-zinc-600 text-sm mt-1">发布时请点击"添加地点"，接入了百度地图数据，方便大家一键导航。</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <span className="text-2xl">↩️</span>
              <div>
                <span className="font-bold text-zinc-900">后悔药功能</span>
                <p className="text-zinc-600 text-sm mt-1">发错了字？别担心。点击"撤回"，内容会自动回到编辑框，不用重新码字。</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <span className="text-2xl">🔖</span>
              <div>
                <span className="font-bold text-zinc-900">收藏夹</span>
                <p className="text-zinc-600 text-sm mt-1">看到想吃的店，点击"书签"图标存入收藏夹，建立你的专属美食地图。</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">4. 🚫 社区红线</h2>
          </div>
          <p className="text-zinc-600 mb-4">
            为了保护大家的胃口，以下行为将被<strong className="text-red-500">严厉禁止</strong>：
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">虚假推广</span>
              <span className="text-zinc-600">商家软广、刷单好评。</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">恶意攻击</span>
              <span className="text-zinc-600">针对个人的攻击性言论（骂食堂阿姨不行，骂菜难吃可以）。</span>
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">5. 💡 关于我们</h2>
          </div>
          <p className="text-zinc-600 mb-4">
            FoodMemo 是一个<strong>非营利性的校园实验项目</strong>。
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-orange-500 font-bold">隐私承诺</span>
              <span className="text-zinc-600">您的数据仅在圈子内部可见，绝不外泄。</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 font-bold">反馈建议</span>
              <span className="text-zinc-600">如果遇到 Bug（肯定会有）或有新想法，请直接在平台内私信管理员，或在群里吼一声。</span>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="text-center">
          <p className="text-zinc-400 flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 fill-red-500 text-red-500" /> by 
            <span className="font-medium text-zinc-600">CinyaMa, 小马哥</span>
          </p>
        </div>
      </div>

      <MobileNavbar />
    </main>
  )
}
