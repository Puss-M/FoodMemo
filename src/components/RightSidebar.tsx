export default function RightSidebar() {
  const trendingTags = [
    { label: '#红榜推荐', color: 'bg-red-50 text-red-600' },
    { label: '#避雷指南', color: 'bg-zinc-100 text-zinc-600' },
    { label: '#二食堂', color: 'bg-orange-50 text-orange-600' },
    { label: '#瑞幸', color: 'bg-blue-50 text-blue-600' },
    { label: '#深夜放毒', color: 'bg-purple-50 text-purple-600' },
  ]

  const topFoodies = [
    { name: 'Spicy_King', seed: 'Spicy', desc: '无辣不欢' },
    { name: 'Sweet_Girl', seed: 'Sweet', desc: '甜品控' },
    { name: 'LateNight_Cat', seed: 'Cat', desc: '夜宵达人' },
  ]

  return (
    <aside className="hidden lg:flex w-80 sticky top-4 h-fit flex-col gap-4">
      {/* Discovery Zone */}
      <h3 className="font-bold text-zinc-400 text-sm px-1">吃货风向标</h3>
      
      {/* Trending Tags */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <h4 className="font-bold text-zinc-900 mb-3 text-base">🏷️ 热门标签</h4>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <button
              key={tag.label}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105 ${tag.color}`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

       {/* Top Foodies */}
       <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <h4 className="font-bold text-zinc-900 mb-4 text-base">🏆 活跃吃货榜</h4>
        <div className="space-y-4">
          {topFoodies.map((user) => (
            <div key={user.name} className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden ring-2 ring-transparent group-hover:ring-orange-200 transition-all">
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.seed}`} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-zinc-900">{user.name}</div>
                <div className="text-xs text-zinc-400">{user.desc}</div>
              </div>
              <button className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                关注
              </button>
            </div>
          ))}
        </div>
      </div>

       {/* Announcement (Optional) */}
       <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
          <h4 className="font-bold text-orange-800 mb-1 text-sm">📢 圈子公告</h4>
          <p className="text-xs text-orange-700/80 leading-relaxed">
            本周五二食堂二楼有新窗口试吃活动，凭学生证免费领取！
          </p>
       </div>
    </aside>
  )
}
