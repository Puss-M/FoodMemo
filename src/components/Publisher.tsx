'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Send, X, Loader2 } from 'lucide-react'
import { Session } from '@supabase/supabase-js'

export default function Publisher({ session, onPostSuccess }: { session: Session, onPostSuccess: () => void }) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // If user forgot #, we can be lenient or strict. Let's strict for now or auto-add
      // Simple text: "#good #tasty"

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: session.user.id,
          content: content,
          image_url: imageUrl,
          tags: tagArray.length > 0 ? tagArray : null,
        })

      if (insertError) throw insertError

      setContent('')
      setTags('')
      clearImage()
      onPostSuccess()

    } catch (error) {
      console.error('Error posting review:', error)
      alert('发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 mb-6 transition-all focus-within:ring-2 ring-orange-100">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天吃了什么？真实评价..."
          className="w-full text-zinc-800 placeholder:text-zinc-400 text-lg resize-none outline-none min-h-[80px]"
          rows={3}
        />
        
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

        <div className="flex items-center justify-between pt-2 border-t border-zinc-50 mt-2">
          <div className="flex items-center gap-4">
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
              placeholder="#标签 (空格分隔)"
              className="text-sm bg-zinc-50 border-none rounded-lg px-3 py-1.5 w-40 focus:ring-1 focus:ring-orange-200 text-zinc-600 placeholder:text-zinc-400"
            />
          </div>

          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="bg-zinc-900 hover:bg-orange-500 text-white rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-zinc-900 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>发布 <Send className="w-3 h-3" /></>}
          </button>
        </div>
      </form>
    </div>
  )
}
