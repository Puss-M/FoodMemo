"use client"

import { useState } from "react"
import { Sparkles, X, Loader2 } from "lucide-react"
import { clusterReviewsAction } from "@/app/actions"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

interface ClusterViewProps {
  reviews: any[] // We can refine this type
}

interface ClusterResult {
  clusters: {
    name: string
    items: string[] // IDs
  }[]
}

export default function ClusterView({ reviews }: ClusterViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClusterResult | null>(null)

  const handleAnalyze = async () => {
    if (!reviews || reviews.length === 0) {
      toast.error("没有足够的评价进行分析")
      return
    }

    setIsOpen(true)
    setLoading(true)
    
    // Prepare data
    const simpleReviews = reviews.map(r => ({
      id: r.id,
      content: r.content
    }))

    const res = await clusterReviewsAction(simpleReviews)
    
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
      setIsOpen(false)
      return
    }

    if (res.data) {
      setResult(res.data)
    }
  }

  return (
    <>
      <button
        onClick={handleAnalyze}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium rounded-full hover:shadow-lg hover:shadow-violet-500/20 transition-all active:scale-95"
      >
        <Sparkles className="w-4 h-4" />
        AI 聚类
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">美食聚类分析</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">基于 AI 的智能内容归类</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
                    <p>正在分析大家都在吃什么...</p>
                  </div>
                ) : result ? (
                  <div className="grid gap-6">
                    {result.clusters.map((cluster, idx) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                        <h4 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          {cluster.name}
                        </h4>
                        <div className="space-y-2">
                          {cluster.items.map(itemId => {
                            const review = reviews.find(r => r.id === itemId)
                            if (!review) return null
                            return (
                              <div key={itemId} className="text-sm text-zinc-600 dark:text-zinc-300 pl-8 relative">
                                <span className="absolute left-3 top-2 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                <p className="line-clamp-2">{review.content}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-400">
                    分析失败，请稍后重试
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
