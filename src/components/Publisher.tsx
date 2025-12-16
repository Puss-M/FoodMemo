'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Send, X, Loader2, MapPin } from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import LocationPicker from './LocationPicker'

const PRESET_TAGS = ['👍 推荐', '💣 避雷', '🏫 食堂']

export default function Publisher({ session, onPostSuccess }: { session: Session, onPostSuccess: () => Promise<void> | void }) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isExpanded, setIsExpanded] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{name: string, lat: number, lng: number} | null>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
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
      let imageUrl = null

      // Upload Image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${session.user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('reviews')
          .getPublicUrl(filePath)
        
        imageUrl = publicUrl
      }

      // Insert Review
      const tagArray = tags
        .split(' ')
        .filter(t => t.startsWith('#'))
        .map(t => t.trim())

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: session.user.id,
          content: content,
          image_url: imageUrl,
          tags: tagArray.length > 0 ? tagArray : null,
          location_name: selectedLocation?.name,
          location_coords: selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null
        })

      if (insertError) throw insertError

      setContent('')
      setTags('')
      clearImage()
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
          
          {imagePreview && (
            <div className="relative inline-block mt-2 mb-4">
              <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg object-cover border border-zinc-100" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-zinc-800 text-white p-1 rounded-full shadow-md hover:bg-zinc-900 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3 mt-1">
            {['川菜', '火锅', '烧烤', '小吃', '饮品', '食堂', '西餐'].map(cuisine => (
               <button
                key={cuisine}
                type="button"
                onClick={() => addTag(`#${cuisine}`)}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-100 bg-white text-zinc-600 hover:border-orange-200 hover:text-orange-600 transition-colors whitespace-nowrap"
              >
                {cuisine}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
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
