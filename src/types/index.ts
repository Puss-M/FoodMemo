export interface Profile {
  id: string
  username: string
  avatar_url: string | null
}

export interface Review {
  id: string
  user_id: string
  content: string
  image_url: string | null
  tags: string[] | null
  location: string | null
  created_at: string
  profiles: Profile // Joined data
}
