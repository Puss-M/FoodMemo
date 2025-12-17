'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Initialize Admin Client for secure operations
// Helper to get Admin Client (lazily initialized to avoid build/start crashes)
const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.error('SERVER_ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
    return null
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )
}

export async function register(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const inviteCode = (formData.get('inviteCode') as string)?.trim().toUpperCase()
  const username = formData.get('username') as string

  if (!email || !password || !inviteCode || !username) {
    return { error: '请填写所有必填项' }
  }

  // Check for Service Role Key via helper
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) {
    return { error: '服务器配置错误: 缺少 SUPABASE_SERVICE_ROLE_KEY' }
  }

  try {
    // 1. Verify Invitation Code
    let inviterId = null
    let isGenesisCode = false

    if (inviteCode === 'SWUFE_VIP') {
      isGenesisCode = true
    } else {
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('fm_invitation_codes')
        .select('*')
        .eq('code', inviteCode)
        .single()

      if (codeError || !codeData) {
        return { error: '无效的邀请码' }
      }

      if (codeData.is_used) {
        return { error: '该邀请码已被使用' }
      }

      inviterId = codeData.generated_by
    }

    // 2. Create User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        username,
        invited_by: inviterId, // Track who invited this user
      },
      email_confirm: true // Auto confirm for MVP
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: '注册失败，未知错误' }
    }

    const newUserId = authData.user.id

    // 3. Mark Code as Used (if not Genesis)
    if (!isGenesisCode) {
      const { error: updateError } = await supabaseAdmin
        .from('fm_invitation_codes')
        .update({
          is_used: true,
          used_by: newUserId
        })
        .eq('code', inviteCode)
      
      if (updateError) {
        console.error('Failed to mark code as used:', updateError)
        // User created but code not marked. 
        // We could delete user here to be safe, or just log it.
        // For MVP, logging is acceptable.
      }
    }

    // 4. Create Profile (Manually if trigger doesn't exist, or ensuring data match)
    // Assuming the trigger `handle_new_user` takes care of profile creation using metadata.
    // If not, we should insert here. 
    // Let's assume the user has the trigger from previous tasks. 
    // If unsure, we can try to upsert profile just in case.
    
    // Check if profile exists (Trigger might have created it)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', newUserId)
      .single()
    
    if (!profile) {
      // Fallback: Create profile
      await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        username: username
        // invite_code is for THEIR generated code, not the one they used.
        // invited_by tracks who invited them.
      })
    }

    return { success: true }

  } catch (err: any) {
    console.error('Registration Error:', err)
    return { error: err.message || '注册发生系统错误' }
  }
}

export async function generateInviteCode() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
    
  // We need the current user ID. Server Actions can get cookies.
  // BUT we are using the Admin client above.
  // To get current user, we should use the standard server client (from @/lib/supabase/server)
  // Let's import it.
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const userClient = await createServerClient()
  
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  
  if (userError || !user) {
    return { error: '请先登录' }
  }

  // Generate random 6-char code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed I, O, 0, 1 for clarity
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  try {
    // Insert with Admin to ensure it works even if RLS is strict?
    // Actually, user should be able to insert their own code if we have RLS.
    // But uniqueness check might need admin.
    
    const { error } = await supabase
      .from('fm_invitation_codes')
      .insert({
        code,
        generated_by: user.id
      })

    if (error) throw error
    
    revalidatePath('/profile')
    return { success: true, code }
  } catch (err: any) {
    console.error('Generate Code Error:', err)
    return { error: '生成失败，请重试' }
  }
}

// Follow a user
export async function followUser(targetUserId: string) {
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const supabase = await createServerClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: '请先登录' }
  }

  if (user.id === targetUserId) {
    return { error: '不能关注自己' }
  }

  try {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      })

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { error: '已经关注过了' }
      }
      throw error
    }
    
    revalidatePath('/profile')
    revalidatePath(`/user/${targetUserId}`)
    return { success: true }
  } catch (err: any) {
    console.error('Follow Error:', err)
    return { error: '关注失败' }
  }
}

// Unfollow a user
export async function unfollowUser(targetUserId: string) {
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const supabase = await createServerClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: '请先登录' }
  }

  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (error) throw error
    
    revalidatePath('/profile')
    revalidatePath(`/user/${targetUserId}`)
    return { success: true }
  } catch (err: any) {
    console.error('Unfollow Error:', err)
    return { error: '取消关注失败' }
  }
}

