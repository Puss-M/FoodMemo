'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Send, X, Loader2, MapPin } from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import LocationPicker from './LocationPicker'
import { useComposerStore } from '@/store/useComposerStore'

const PRESET_TAGS = ['👍 推荐', '💣 避雷', '🏫 食堂']

// v9.1: Structured tag options
const CUISINE_OPTIONS = ['川菜', '火锅', '粤菜', '湘菜', '烧烤', '日韩', '西餐', '甘点', '面食', '小吃']
const SCENARIO_OPTIONS = ['👤 一人食', '👩‍❤️‍👨 约会', '👯 朋友聚餐', '🍻 部门团建', '💼 商务']

// Helper to compress image
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 1920
        const maxHeight = 1080
        let width = img.width
        let height = img.height

        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width
                width = maxWidth
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height
                height = maxHeight
            }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                })
                resolve(newFile)
            } else {
                reject(new Error('Canvas is empty'))
            }
        }, 'image/jpeg', 0.8) // Quality 0.8
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

export default function Publisher({ session, onPostSuccess }: { session: Session, onPostSuccess: () => Promise<void> | void }) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isExpanded, setIsExpanded] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{name: string, lat: number, lng: number} | null>(null)

  const MAX_IMAGES = 9

  // v9.1: Structured tag selections
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  // Zustand store for withdraw-to-edit
  const { draft, clearDraft, hasDraft } = useComposerStore()

  // Consume draft when available (withdraw-to-edit)
  useEffect(() => {
    if (hasDraft && draft) {
      setContent(draft.content)
      setTags(draft.tags)
      setImagePreviews(draft.imageUrls)
      if (draft.locationName && draft.locationCoords) {
        setSelectedLocation({
          name: draft.locationName,
          lat: draft.locationCoords.lat,
          lng: draft.locationCoords.lng
        })
      }
      setIsExpanded(true)
      clearDraft()
      toast.success('内容已撤回至编辑栏')
    }
  }, [hasDraft, draft, clearDraft])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const remainingSlots = MAX_IMAGES - imageFiles.length
      const filesToAdd = newFiles.slice(0, remainingSlots)
      
      setImageFiles(prev => [...prev, ...filesToAdd])
      
      filesToAdd.forEach(file => {
        setImagePreviews(prev => [...prev, URL.createObjectURL(file)])
      })
    }
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllImages = () => {
    setImageFiles([])
    setImagePreviews([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addTag = (tag: string) => {
    const newTags = tags ? `${tags} ${tag}` : tag
    setTags(newTags.trim())
  }

  // Listen for mobile navbar trigger
  useEffect(() => {
    const handleFocus = () => {
      setIsExpanded(true)
      // Small delay to allow expansion
      setTimeout(() => {
        document.querySelector('textarea')?.focus()
      }, 100)
    }
    
    window.addEventListener('focus-publisher', handleFocus)
    return () => window.removeEventListener('focus-publisher', handleFocus)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      let imageUrls: string[] = []

      // Upload Images if exist
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const compressedFile = await compressImage(file)
          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
          const filePath = `${session.user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('fm-images')
            .upload(filePath, compressedFile)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('fm-images')
            .getPublicUrl(filePath)
          
          imageUrls.push(publicUrl)
        }
      }

      // Insert Review - Merge structured tags with manual tags
      const manualTags = tags
        .split(' ')
        .filter(t => t.startsWith('#'))
        .map(t => t.trim())
      
      // Combine: cuisine + scenario + manual tags
      const allTags: string[] = []
      if (selectedCuisine) allTags.push(selectedCuisine)
      if (selectedScenario) allTags.push(selectedScenario)
      allTags.push(...manualTags)

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: session.user.id,
          content: content,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          tags: allTags.length > 0 ? allTags : null,
          location_name: selectedLocation?.name,
          location_coords: selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null
        })

      if (insertError) throw insertError

      setContent('')
      setTags('')
      setSelectedCuisine(null)
      setSelectedScenario(null)
      clearAllImages()
      setSelectedLocation(null)
      toast.success('发布成功！')
      await onPostSuccess()
      setIsExpanded(false)

    } catch (error) {
      console.error('Error posting review:', error)
      toast.error('发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="bg-white rounded-full shadow-sm border border-zinc-100 p-2 mb-8 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden ml-1 shrink-0">
           <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
        </div>
        <div className="text-zinc-400 text-sm font-medium flex-1">
          发现宝藏餐厅了？推荐给兄弟们...
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-4 mb-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-start mb-2">
             <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今天吃了什么？真实评价..."
              className="w-full text-zinc-800 placeholder:text-zinc-400 text-lg resize-none outline-none min-h-[80px]"
              rows={3}
              autoFocus
            />
            <button type="button" onClick={() => setIsExpanded(false)} className="text-zinc-300 hover:text-zinc-500">
               <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Multi-Image Preview Grid */}
          {imagePreviews.length > 0 && (
            <div className={`mt-2 mb-4 grid gap-2 ${
              imagePreviews.length === 1 ? 'grid-cols-1' :
              imagePreviews.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full rounded-lg object-cover border border-zinc-100" 
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-zinc-800 text-white p-1 rounded-full shadow-md hover:bg-zinc-900 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imageFiles.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
                >
                  <span className="text-2xl">+</span>
                </button>
              )}
            </div>
          )}

          {/* v9.1: Cuisine Selection */}
          <div className="mb-3 mt-1">
            <div className="text-xs text-zinc-400 mb-2 font-medium">🍽️ 菜系</div>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                    selectedCuisine === cuisine
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* v9.1: Scenario Selection */}
          <div className="mb-3">
            <div className="text-xs text-zinc-400 mb-2 font-medium">🎯 场景</div>
            <div className="flex flex-wrap gap-2">
              {SCENARIO_OPTIONS.map(scenario => (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => setSelectedScenario(selectedScenario === scenario ? null : scenario)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                    selectedScenario === scenario
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Quick preset tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          
          {/* Selected Location Display */}
          {selectedLocation && (
              <div className="flex items-center gap-1 text-sm text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-md mb-3 -mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedLocation.name}</span>
                  <button type="button" onClick={() => setSelectedLocation(null)} className="ml-1 hover:text-orange-800">
                      <X className="w-3 h-3" />
                  </button>
              </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
            <div className="flex items-center gap-3">
               <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="text-zinc-400 hover:text-orange-500 transition-colors p-2 -ml-2 rounded-full hover:bg-orange-50"
                title="添加地点"
              >
                <MapPin className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-zinc-400 hover:text-orange-500 transition-colors p-2 -ml-2 rounded-full hover:bg-orange-50"
              >
                <ImageIcon className="w-5 h-5" />
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  onChange={handleImageSelect}
                />
              </button>
              
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#标签"
                className="text-sm bg-transparent border-none p-0 w-40 focus:ring-0 text-zinc-600 placeholder:text-zinc-300"
              />
            </div>

            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-orange-500 flex items-center gap-2 shadow-sm hover:shadow-orange-200"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>发布 <Send className="w-3 h-3" /></>}
            </button>
          </div>
        </form>
      </div>

      {showLocationPicker && (
        <LocationPicker 
            onLocationSelect={(loc) => {
                setSelectedLocation(loc)
                setShowLocationPicker(false)
            }} 
            onClose={() => setShowLocationPicker(false)} 
        />
      )}
    </>
  )
}
