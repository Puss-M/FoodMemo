"use client"

import { useState } from "react"
import { Sparkles, X, Loader2, TrendingUp, Lightbulb, ChevronRight, MapPin } from "lucide-react"
import { clusterReviewsAction } from "@/app/actions"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"
import type { AiResponse, ClusterItem } from "@/lib/ai"

interface ClusterViewProps {
  reviews: any[] // Full review objects
}

export default function ClusterView({ reviews }: ClusterViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiResponse | null>(null)
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null)

  const handleAnalyze = async () => {
    if (!reviews || reviews.length === 0) {
      toast.error("没有足够的评价进行分析")
      return
    }

    if (reviews.length < 3) {
      toast.error("至少需要 3 条评价才能进行聚类分析")
      return
    }

    setIsOpen(true)
    setLoading(true)
    setResult(null)
    setExpandedCluster(null)
    
    // Prepare enhanced data with tags and location
    const enhancedReviews = reviews.map(r => ({
      id: r.id,
      content: r.content,
      tags: r.tags,
      location: r.location_name
    }))

    const res = await clusterReviewsAction(enhancedReviews)
    
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

  const toggleCluster = (idx: number) => {
    setExpandedCluster(expandedCluster === idx ? null : idx)
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
              className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">美食聚类分析</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {loading ? "分析中..." : result ? `已分析 ${reviews.length} 条评价` : "AI 智能归类"}
                    </p>
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
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-30 animate-pulse" />
                      <Loader2 className="relative w-12 h-12 animate-spin text-violet-500" />
                    </div>
                    <p className="mt-6 font-medium text-zinc-600 dark:text-zinc-300">正在分析大家都在吃什么...</p>
                    <p className="mt-2 text-sm text-zinc-400">AI 正在挖掘美食趋势</p>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    {/* Insights Card */}
                    {result.insights && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-lg">
                            <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                {result.insights.topTrend}
                              </span>
                            </div>
                            <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
                              💡 {result.insights.suggestion}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Clusters */}
                    <div className="grid gap-4">
                      {result.clusters.map((cluster, idx) => {
                        const isExpanded = expandedCluster === idx
                        const clusterReviews = cluster.items
                          .map(itemId => reviews.find(r => r.id === itemId))
                          .filter(Boolean)
                        
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
                          >
                            {/* Cluster Header */}
                            <button
                              onClick={() => toggleCluster(idx)}
                              className="w-full p-4 flex items-center gap-3 text-left hover:bg-zinc-100/50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <span className="text-2xl">{cluster.emoji}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-zinc-900 dark:text-white">
                                    {cluster.name}
                                  </h4>
                                  <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium rounded-full">
                                    {cluster.items.length} 条
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  {cluster.description}
                                </p>
                              </div>
                              <ChevronRight 
                                className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              />
                            </button>

                            {/* Cluster Items */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-zinc-100 dark:border-zinc-800"
                                >
                                  <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                                    {clusterReviews.map((review: any) => (
                                      <div 
                                        key={review.id} 
                                        className="text-sm text-zinc-600 dark:text-zinc-300 pl-4 border-l-2 border-violet-200 dark:border-violet-800"
                                      >
                                        <p className="line-clamp-2">{review.content}</p>
                                        {review.location_name && (
                                          <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                                            <MapPin className="w-3 h-3" />
                                            <span>{review.location_name}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">分析失败，请稍后重试</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {result && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <p className="text-xs text-center text-zinc-400">
                    由 AI 生成 · 分析了 {result.clusters.reduce((acc, c) => acc + c.items.length, 0)} 条评价
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
