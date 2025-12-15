import { Review } from '@/types'
import { Clock } from 'lucide-react'

// Helper to format time (e.g. "2 hours ago")
function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + "年前"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + "月前"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + "天前"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + "小时前"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + "分钟前"
  return "刚刚"
}

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 mb-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img 
            src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.profiles?.username || 'User'}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full bg-zinc-100 object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-zinc-900">{review.profiles?.username || 'Unknown'}</span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              · {timeAgo(review.created_at)}
            </span>
          </div>

          {/* Content */}
          <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed mb-3 text-[15px]">
            {review.content}
          </p>

          {/* Image */}
          {review.image_url && (
            <div className="mb-3">
              <img 
                src={review.image_url} 
                alt="Review image" 
                className="rounded-xl max-h-80 w-auto object-cover border border-zinc-100"
                loading="lazy"
              />
            </div>
          )}

          {/* Footer / Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
