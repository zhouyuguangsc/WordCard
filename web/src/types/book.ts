export interface BookInfo {
  id: string
  name: string
  path: string
  wordCount: number
  tag: string[]
  isLocal: boolean
}

export interface BookListResponse {
  code: number
  data: {
    normalBooksInfo: {
      id: string
      title: string
      wordNum: number
      offlinedata: string
      tags: {
        tagName: string
      }[]
    }[]
  }
}

export interface BookDownloadStatus {
  isDownloaded: boolean
  isDownloading: boolean
  error?: string
} 