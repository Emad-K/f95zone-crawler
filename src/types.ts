export interface F95Game {
  thread_id: number
  title: string
  creator: string
  version: string
  views: number
  likes: number
  prefixes: number[]
  tags: number[]
  rating: number
  cover: string
  screens: string[]
  date: string // "11 mins" - we will ignore this in DB but need it for type matching
  ts: number
  watched: boolean
  ignored: boolean
  new: boolean
}

export interface F95ApiResponse {
  status: string
  msg: {
    data: F95Game[]
    pagination: {
      page: number
      total: number
    }
    count: number
  }
}
