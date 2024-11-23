<template>
  <div class="home">
    <div v-if="loading" class="loading">
      加载中...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="words.length === 0" class="error">
      没有找到单词数据
    </div>
    <div v-else class="word-card-container">
      <div class="card-controls">
        <div class="control-buttons">
          <button class="theme-button control-item" @click.capture.stop="$emit('toggle-theme')">
            <Icon :icon="theme === 'light' ? 'ph:moon-bold' : 'ph:sun-bold'" width="20" />
          </button>
          <button class="book-button control-item" @click.capture.stop="showBookList = !showBookList">
            <Icon icon="ph:book-bold" width="20" />
          </button>
        </div>
        <transition name="drawer">
          <div v-if="showBookList" class="book-list">
            <div class="book-list-header">
              <div class="tab-buttons">
                <button 
                  class="tab-button" 
                  :class="{ active: activeTab === 'local' }"
                  @click="activeTab = 'local'"
                >
                  <Icon icon="ph:books" width="16" />
                  本地词库 ({{ localBooks.length }})
                </button>
                <button 
                  class="tab-button" 
                  :class="{ active: activeTab === 'remote' }"
                  @click="activeTab = 'remote'"
                >
                  <Icon icon="ph:cloud" width="16" />
                  在线词库 ({{ remoteBooks.length }})
                </button>
              </div>
            </div>
            <div class="book-list-content">
              <div v-if="activeTab === 'local'" class="book-items">
                <div 
                  v-for="book in localBooks" 
                  :key="book.id"
                  :class="[
                    'book-list-item', 
                    { 
                      active: currentBook?.id === book.id,
                      'switching': isBookSwitching && currentBook?.id === book.id
                    }
                  ]"
                  @click="switchBook(book)"
                >
                  <div class="book-info">
                    <div class="book-header">
                      <div class="book-title-wrapper">
                        <div class="title-content">
                          <Icon icon="ph:book-bookmark" class="book-icon" width="16" />
                          <div class="book-title">{{ book.name }}</div>
                        </div>
                        <div v-if="currentBook?.id === book.id" class="badge-container">
                          <span class="current-badge">
                            <Icon icon="ph:check-circle" width="12" />
                            使用中
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="book-meta">
                      <span class="word-count">
                        <Icon icon="ph:book-open" width="14" />
                        {{ book.wordCount }} 词
                      </span>
                      <div class="book-tags">
                        <span v-for="(tag, index) in book.tag" 
                          :key="index" 
                          class="tag"
                        >
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="book-items">
                <div 
                  v-for="book in remoteBooks" 
                  :key="book.id"
                  :class="['book-list-item', { active: currentBook?.id === book.id }]"
                  @click="switchBook(book)"
                >
                  <div class="book-info">
                    <div class="book-header">
                      <div class="book-title-wrapper">
                        <div class="title-content">
                          <Icon icon="ph:cloud" class="book-icon" width="16" />
                          <div class="book-title">{{ book.name }}</div>
                        </div>
                        <div v-if="currentBook?.id === book.id" class="badge-container">
                          <span class="current-badge">
                            <Icon icon="ph:check-circle" width="12" />
                            使用中
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="book-meta">
                      <span class="word-count">
                        <Icon icon="ph:book-open" width="14" />
                        {{ book.wordCount }} 词
                      </span>
                      <div class="book-tags">
                        <span v-for="(tag, index) in book.tag" 
                          :key="index" 
                          class="tag"
                        >
                          {{ tag }}
                        </span>
                        <span :class="['status-tag', getBookStatus(book.id)]">
                          {{ getBookStatusText(book.id) }}
                        </span>
                      </div>
                    </div>
                    <div class="book-actions">
                      <button 
                        class="download-button" 
                        @click.stop="downloadBook(book)"
                        :disabled="bookDownloadStatus[book.id]?.isDownloading"
                        v-if="!bookDownloadStatus[book.id]?.isDownloaded"
                      >
                        <Icon :icon="bookDownloadStatus[book.id]?.isDownloading ? 'ph:spinner-bold' : 'ph:download-simple-bold'" 
                              width="14" 
                              :class="{ 'rotating': bookDownloadStatus[book.id]?.isDownloading }" />
                        {{ bookDownloadStatus[book.id]?.isDownloading ? '下载中...' : '下载到本地' }}
                      </button>
                      <button 
                        v-else
                        class="delete-button" 
                        @click.stop="deleteBook(book)"
                      >
                        <Icon icon="ph:trash-bold" width="14" />
                        删除本地文件
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
      
      <transition :name="slideDirection">
        <div ref="wordCardRef" 
          class="word-card" 
          :key="currentWord?.wordRank"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd">
          <div class="word-section">
            <h2 class="word">{{ currentWord?.headWord || 'Loading...' }}</h2>
            <div class="phonetic">
              <span class="uk">UK [{{ currentWord?.content.word.content.ukphone }}]</span>
              <span class="us">US [{{ currentWord?.content.word.content.usphone }}]</span>
            </div>
            <div class="sound-buttons-container">
              <div class="sound-buttons">
                <button class="sound-button" @click="playSound('uk')">
                  <Icon icon="ph:speaker-high-bold" width="24" />
                  UK
                </button>
                <button class="sound-button" ref="usButton" @click="playSound('us')">
                  <Icon icon="ph:speaker-high-bold" width="24" />
                  US
                </button>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="translations">
            <div v-for="(trans, index) in currentWord?.content.word.content.trans" :key="index" class="translation-item">
              <span class="pos">{{ trans.pos }}</span>
              <p class="trans">{{ trans.tranCn }}</p>
            </div>
          </div>

          <div class="sentences" v-if="currentWord?.content?.word?.content?.sentence?.sentences?.length">
            <h3>例句</h3>
            <div v-for="(sent, index) in currentWord?.content?.word?.content?.sentence?.sentences" :key="index" class="sentence">
              <p class="en">{{ sent.sContent }}</p>
              <p class="cn">{{ sent.sCn }}</p>
            </div>
          </div>
        </div>
      </transition>
      
      <div class="controls" v-if="!isMobile">
        <button class="control-button" @click="prevWord">
          <Icon icon="ph:arrow-left-bold" width="24" />
        </button>
        <button class="control-button" @click="nextWord">
          <Icon icon="ph:arrow-right-bold" width="24" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Word } from '../types/word'
import { config, type WordbookSource } from '../config'
import JSZip from 'jszip'

const words = ref<Word[]>([])
const currentIndex = ref(0)
const currentWord = ref<Word | null>(null)
const isFlipped = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)

const wordCardRef = ref(null)

const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50

const slideDirection = ref('slide-left')

// 添加移动端检测
const isMobile = ref(false)

// 加一个状态来跟踪是否可以自动播放
const canAutoPlay = ref(false)

// 在 script setup 顶部添加全局 Audio 实例
const audioPlayer = new Audio()

// 添加 ref 用于获取美式发音按钮
const usButton = ref<HTMLButtonElement | null>(null)

// 添加词库表状态
const showBookList = ref(false)

// 修改词库配置，从 bookLists.json 加载
interface BookInfo {
  id: string
  name: string
  path: string
  wordCount: number
  tag: string[]
}

const bookList = ref<BookInfo[]>([])
const currentBook = ref<BookInfo | null>(null)

// 添加下载状态接口
interface BookDownloadStatus {
  [key: string]: {
    isDownloaded: boolean
    isDownloading: boolean
    error?: string
  }
}

// 添加下载状态的 ref
const bookDownloadStatus = ref<BookDownloadStatus>({})

// 添加词库来源状态
const currentSource = ref<WordbookSource>(
  config.wordbookSources.find(s => s.enabled) || config.wordbookSources[0]
)

// 添加切换来源的方法
const switchSource = async (source: WordbookSource) => {
  currentSource.value = source
  await loadBookList()
}

// 添加合并词库的函数
const mergeBookLists = (localBooks: any[], remoteBooks: any[]) => {
  // 使用 Map 来去重，以 id 为键
  const booksMap = new Map()
  
  // 先添加本地词库
  localBooks.forEach(book => {
    booksMap.set(book.id, {
      ...book,
      isLocal: true // 标记为本地词库
    })
  })
  
  // 添加远程词库，如果已存在则更新信息
  remoteBooks.forEach(book => {
    if (booksMap.has(book.id)) {
      // 如果本地已有，合并信
      const existingBook = booksMap.get(book.id)
      booksMap.set(book.id, {
        ...book,
        isLocal: existingBook.isLocal,
        localPath: existingBook.path // 保留本地路径
      })
    } else {
      booksMap.set(book.id, {
        ...book,
        isLocal: false
      })
    }
  })
  
  return Array.from(booksMap.values())
}

// 修改 loadBookList 函数
const loadBookList = async () => {
  try {
    // 加载本地词库列表
    const localSource = config.wordbookSources.find(s => s.enabled)
    if (!localSource) {
      throw new Error('未找到本地词库配置')
    }

    const localResponse = await fetch(localSource.url)
    const localData = await localResponse.json()
    
    let localBooks = []
    if (localData.code === 200 && localData.data?.normalBooksInfo) {
      localBooks = localData.data.normalBooksInfo.map(book => ({
        id: book.id,
        name: book.title,
        path: `/src/book/${book.id}.json`,
        wordCount: book.wordNum,
        tag: book.tags.map(t => t.tagName),
        isLocal: true
      }))
    }
    
    // 加载远程词库列表
    let remoteBooks = []
    try {
      // 使用配置文件中的远程词库地址
      const remoteSource = config.wordbookSources.find(s => !s.enabled)
      if (remoteSource) {
        const remoteResponse = await fetch(remoteSource.url)
        const remoteData = await remoteResponse.json()
        
        if (remoteData.code === 200 && remoteData.data?.normalBooksInfo) {
          // 过滤掉本地已有的词库
          const localIds = new Set(localBooks.map(book => book.id))
          remoteBooks = remoteData.data.normalBooksInfo
            .filter(book => !localIds.has(book.id))
            .map(book => ({
              id: book.id,
              name: book.title,
              path: book.offlinedata,
              wordCount: book.wordNum,
              tag: book.tags.map(t => t.tagName),
              isLocal: false
            }))
        }
      }
    } catch (err) {
      console.warn('加载远程词库列表失败:', err)
    }
    
    // 合并词库列表
    bookList.value = [...localBooks, ...remoteBooks]
    
    // 检查本地存储状态（只对远程词库）
    remoteBooks.forEach(book => {
      const hasLocal = localStorage.getItem(`wordbook_${book.id}`)
      bookDownloadStatus.value[book.id] = {
        isDownloaded: !!hasLocal,
        isDownloading: false
      }
    })
    
    if (bookList.value.length > 0) {
      // 优先选择第一个本地词库
      currentBook.value = localBooks[0] || bookList.value[0]
    } else {
      throw new Error('没有找到可用的词库')
    }
  } catch (err) {
    console.error('加载词库列表失败:', err)
    error.value = err instanceof Error ? err.message : '加载词库列表失败'
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 修改获取词库 ID 的辅助函数
const getBookId = (path: string) => {
  // 移除路径中的目录部分
  const filename = path.split('/').pop() || ''
  // 移除 .json 或 .zip 扩展名
  return filename.replace(/\.(json|zip)$/, '')
}

// 修改 loadWords 函数
const loadWords = async (bookPath: string = currentBook.value.path) => {
  loading.value = true
  error.value = null
  
  try {
    let rawData: string
    const bookId = getBookId(bookPath)
    const isRemoteBook = !bookPath.startsWith('/src/book/')
    
    // 先尝试从本地加载
    const localData = localStorage.getItem(`wordbook_${bookId}`)
    if (localData) {
      rawData = localData
    } else {
      // 如果本地没有，则从远程加载
      const response = await fetch(bookPath)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (isRemoteBook) {
        // 如果是远程词库，需要解压处理
        const zipBuffer = await response.arrayBuffer()
        const zip = new JSZip()
        const zipContent = await zip.loadAsync(zipBuffer)
        
        // 查找 JSON 文件
        let jsonContent: string | null = null
        for (const [filename, file] of Object.entries(zipContent.files)) {
          if (filename.endsWith('.json')) {
            jsonContent = await file.async('string')
            break
          }
        }

        if (!jsonContent) {
          throw new Error('ZIP 文件中未找到词库数')
        }
        
        // 存储解压后的数据
        localStorage.setItem(`wordbook_${bookId}`, jsonContent)
        rawData = jsonContent
      } else {
        // 本地词库直接获取文本
        rawData = await response.text()
      }
    }
    
    // 按行解析 JSON
    const wordsList = rawData
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line)
        } catch (e) {
          console.warn('Failed to parse line:', line)
          return null
        }
      })
      .filter(word => word)
    
    words.value = wordsList
    
    if (words.value.length > 0) {
      shuffleWords()
      currentWord.value = words.value[currentIndex.value]
      console.log('Current word:', currentWord.value)
    } else {
      throw new Error('没有找到单词数据')
    }
  } catch (err) {
    console.error('Error loading words:', err)
    error.value = err instanceof Error ? err.message : '加载单词数据失败'
    words.value = []
  } finally {
    loading.value = false
  }
}

const shuffleWords = () => {
  for (let i = words.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words.value[i], words.value[j]] = [words.value[j], words.value[i]]
  }
}

const nextWord = () => {
  slideDirection.value = 'slide-left'
  isFlipped.value = false
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
    shuffleWords()
  }
  currentWord.value = words.value[currentIndex.value]
  // 使用 setTimeout 等待动画完成后再放
  setTimeout(() => {
    usButton.value?.click()
  }, 300)
}

const prevWord = () => {
  slideDirection.value = 'slide-right'
  isFlipped.value = false
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = words.value.length - 1
  }
  currentWord.value = words.value[currentIndex.value]
  // 使用 setTimeout 等待动画完成后再播放
  setTimeout(() => {
    usButton.value?.click()
  }, 300)
}

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

const playSound = (type: 'uk' | 'us') => {
  if (!currentWord.value) return
  const word = currentWord.value.headWord
  const audioType = type === 'uk' ? 1 : 2
  const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${audioType}`)
  audio.play().catch(err => {
    console.error('播放失败:', err)
  })
}

const slideOffset = ref(0)
const isDragging = ref(false)

const handleTouchStart = (e: TouchEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('button')) {
    return
  }
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e: TouchEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('button')) {
    return
  }

  touchEndX.value = e.changedTouches[0].clientX
  const swipeDistance = touchEndX.value - touchStartX.value
  
  if (Math.abs(swipeDistance) > minSwipeDistance) {
    if (swipeDistance > 0) {
      slideDirection.value = 'slide-right'
      prevWord()
    } else {
      slideDirection.value = 'slide-left'
      nextWord()
    }
  }
  // 点击
  else if(swipeDistance === 0) {
    if (touchEndX.value > wordCardRef.value.offsetWidth*0.7) {
      slideDirection.value = 'slide-left'
      nextWord()
    } 
    else if (touchEndX.value < wordCardRef.value.offsetWidth*0.3) {
      slideDirection.value = 'slide-right'
      prevWord()
    }
  }
}

const markUserInteraction = () => {
  canAutoPlay.value = true
}

// 添加闭词库列表的处理数
const closeBookList = (e: MouseEvent) => {
  // 检查点击是否在词��列表和切换按钮之外
  const target = e.target as HTMLElement
  if (!target.closest('.book-list') && !target.closest('.book-button')) {
    showBookList.value = false
  }
}

onMounted(() => {
  loadBookList().then(() => {
    if (currentBook.value) {
      loadWords(currentBook.value.path)
    }
  })
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 添加点击事件监听
  document.addEventListener('click', closeBookList)
  
  // 检查本地词库状态
  const checkLocalBooks = () => {
    bookList.value.forEach(book => {
      const hasLocal = localStorage.getItem(`wordbook_${book.id}`)
      if (hasLocal) {
        bookDownloadStatus.value[book.id] = {
          isDownloaded: true,
          isDownloading: false
        }
      }
    })
  }
  
  checkLocalBooks()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  // 移除点击事件监
  document.removeEventListener('click', closeBookList)
})

// 添加 props
defineProps<{
  theme: string
}>()

// 添加 emit
defineEmits<{
  (e: 'toggle-theme'): void
}>()

// 添加词库切换的加载状态
const isBookSwitching = ref(false)

// 修改 switchBook 函数
const switchBook = async (book: typeof bookList[0]) => {
  if (currentBook.value?.id === book.id) {
    showBookList.value = false
    return
  }

  isBookSwitching.value = true
  
  try {
    const newWords = await loadWordsForBook(book)
    
    // 只有在成功加载新词库后更新状态
    currentBook.value = book
    words.value = newWords
    currentIndex.value = 0
    currentWord.value = words.value[currentIndex.value]
    
    // 关词库列表
    showBookList.value = false
  } catch (err) {
    console.error('切换词库失败:', err)
    error.value = err instanceof Error ? err.message : '切换词库失败'
  } finally {
    isBookSwitching.value = false
  }
}

// 抽取词库加载逻辑到单独的函数
const loadWordsForBook = async (book: typeof bookList[0]) => {
  const bookId = getBookId(book.path)
  const isRemoteBook = !book.path.startsWith('/src/book/')
  let rawData: string
  
  // 先尝试从本地加载
  const localData = localStorage.getItem(`wordbook_${bookId}`)
  if (localData) {
    rawData = localData
  } else {
    // 如果本地没有，则从远程加载
    const response = await fetch(book.path)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (isRemoteBook) {
      // 如果是远程词库，需要解压处理
      const zipBuffer = await response.arrayBuffer()
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(zipBuffer)
      
      // 查找 JSON 文件
      let jsonContent: string | null = null
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (filename.endsWith('.json')) {
          jsonContent = await file.async('string')
          break
        }
      }

      if (!jsonContent) {
        throw new Error('ZIP 文件中未找到词库数据')
      }
      
      // 存储解压后的数据
      localStorage.setItem(`wordbook_${bookId}`, jsonContent)
      rawData = jsonContent
    } else {
      // 本地词库直接获取文本
      rawData = await response.text()
    }
  }
  
  // 按行解析 JSON
  const wordsList = rawData
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line)
      } catch (e) {
        console.warn('Failed to parse line:', line)
        return null
      }
    })
    .filter(word => word)
  
  if (wordsList.length === 0) {
    throw new Error('词库为空')
  }
  
  return wordsList
}

// 在 script setup 中添加计算属性
// 添加词库分类的计算属性
const localBooks = computed(() => 
  bookList.value.filter(book => book.isLocal)
)

const remoteBooks = computed(() => 
  bookList.value.filter(book => !book.isLocal)
)

// 添加标签页状态
const activeTab = ref<'local' | 'remote'>('local')

// 添加获取词库状态的函数
const getBookStatus = (bookId: string) => {
  const status = bookDownloadStatus.value[bookId]
  if (status?.isDownloading) return 'status-downloading'
  if (status?.isDownloaded) return 'status-downloaded'
  if (status?.error) return 'status-error'
  return 'status-online'
}

const getBookStatusText = (bookId: string) => {
  const status = bookDownloadStatus.value[bookId]
  if (status?.isDownloading) return '下载中'
  if (status?.isDownloaded) return '已下载'
  if (status?.error) return '下载失败'
  return '在线'
}

// 修改下载词库的函数
const downloadBook = async (book: typeof bookList[0]) => {
  if (bookDownloadStatus.value[book.id]?.isDownloading) {
    return
  }

  bookDownloadStatus.value[book.id] = {
    isDownloaded: false,
    isDownloading: true
  }

  try {
    // 下载 ZIP 文件
    const response = await fetch(book.path)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // 获取二进制数据
    const zipBuffer = await response.arrayBuffer()
    
    // 使用 JSZip 解压
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(zipBuffer)
    
    // 查找 JSON 文件
    let jsonContent: string | null = null
    for (const [filename, file] of Object.entries(zipContent.files)) {
      if (filename.endsWith('.json')) {
        jsonContent = await file.async('string')
        break
      }
    }

    if (!jsonContent) {
      throw new Error('ZIP 文件中未找到词库数据')
    }

    // 存储数据前验证
    try {
      // 尝试解析一行
      const firstLine = jsonContent.split('\n')[0].trim()
      if (firstLine) {
        JSON.parse(firstLine)
      } else {
        throw new Error('词库数据格式不正确')
      }
      
      const bookId = getBookId(book.path)
      localStorage.setItem(`wordbook_${bookId}`, jsonContent)
      
      bookDownloadStatus.value[book.id] = {
        isDownloaded: true,
        isDownloading: false
      }
    } catch (e) {
      console.error('词库数据验证失败:', e)
      throw new Error('词库数据格式不正确')
    }
  } catch (err) {
    console.error('下载词库失败:', err)
    bookDownloadStatus.value[book.id] = {
      isDownloaded: false,
      isDownloading: false,
      error: err instanceof Error ? err.message : '下载失败'
    }
  }
}

// 添加删除词库的函数
const deleteBook = async (book: typeof bookList[0]) => {
  try {
    const bookId = getBookId(book.path)
    localStorage.removeItem(`wordbook_${bookId}`)
    bookDownloadStatus.value[book.id] = {
      isDownloaded: false,
      isDownloading: false
    }
  } catch (err) {
    console.error('删除词库失败:', err)
  }
}
</script>

<style lang="scss" scoped>
.home {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  width: 100%;
}

.word-card-container {
  width: 100%;
  max-width: 900px;
  padding: 0 0.75rem;
  position: relative;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.word-card {
  position: relative;
  width: 100%;
  flex: 1;
  background-color: var(--card-background);
  border-radius: 1rem;
  box-shadow: var(--shadow);
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-controls {
  position: fixed;
  top: 1rem;
  right: 0.3rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  background-color: var(--card-background);
  box-shadow: var(--shadow);
  
  &:hover {
    transform: translateY(-2px);
    background-color: var(--hover-color);
  }
  
  &:active {
    transform: translateY(0);
    background-color: var(--active-color);
  }
}

.book-list {
  position: absolute;
  right: calc(100% + 0.5rem);
  top: 0;
  width: 350px;
  max-height: 85vh;
  background-color: var(--card-background);
  border-radius: 1rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

.book-list-header {
  padding: 0.75rem;
  border-bottom: 1px solid var(--hover-color);
  background-color: var(--card-background);
  position: sticky;
  top: 0;
  z-index: 1;
}

.tab-buttons {
  display: flex;
  gap: 0.5rem;
  background-color: var(--background-color);
  border-radius: 0.75rem;
  padding: 0.25rem;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--text-primary);
    background-color: var(--hover-color);
  }
  
  &.active {
    color: white;
    background-color: var(--primary-color);
  }
}

.book-list-content {
  padding: 0.75rem;
  overflow-y: auto;
  flex: 1;
}

.book-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.book-list-item {
  padding: 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background-color: var(--hover-color);
  }
  
  &.active {
    background-color: var(--hover-color);
    border: 1px solid var(--primary-color);
  }
  
  &.switching {
    opacity: 0.7;
    pointer-events: none;
  }
}

.book-title-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
}

.title-content {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.book-title {
  font-weight: 500;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
  height: 2.4em;
  font-size: 0.9rem;
  flex: 1;
  min-width: 0;
}

.badge-container {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.current-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  background-color: var(--primary-color);
  color: white;
}

.book-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.word-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  background-color: var(--hover-color);
  color: var(--text-secondary);
}

.word-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.word {
  font-size: 3rem;
  color: var(--text-primary);
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.phonetic {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1rem;
  
  .uk, .us {
    margin: 0 0.75rem;
  }
}

.sound-buttons-container {
  position: relative;
  z-index: 10;
}

.sound-buttons {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.sound-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  min-width: 100px;
  border-radius: 2rem;
  color: var(--primary-color);
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: var(--card-background);
  z-index: 20;
  
  &:hover {
    background-color: var(--hover-color);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.divider {
  width: 100%;
  height: 2px;
  background-color: var(--hover-color);
  margin: 0.5rem 0;
}

.translations {
  .translation-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background-color: var(--hover-color);
    border-radius: 0.5rem;
    
    .pos {
      color: var(--primary-color);
      font-style: italic;
      min-width: 2.5rem;
      font-weight: 600;
    }
    
    .trans {
      color: var(--text-primary);
      font-size: 1.3rem;
      line-height: 1.6;
      flex: 1;
      font-weight: 600;
      word-break: break-word;
    }
  }
}

.sentences {
  width: 100%;
  
  h3 {
    margin-bottom: 1rem;
  }
  
  .sentence {
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.controls {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
}

.control-button {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background-color: var(--card-background);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    background-color: var(--hover-color);
  }
  
  &:active {
    transform: translateY(0);
    background-color: var(--active-color);
  }
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  color: white;
  
  &.status-online {
    background-color: var(--text-secondary);
  }
  
  &.status-downloading {
    background-color: var(--primary-color);
  }
  
  &.status-downloaded {
    background-color: #10B981;
  }
  
  &.status-error {
    background-color: #EF4444;
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

.book-actions {
  margin-top: 0.75rem;
}

.download-button,
.delete-button {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.download-button {
  background-color: var(--primary-color);
  color: white;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
}

.delete-button {
  background-color: var(--hover-color);
  color: #EF4444;
  
  &:hover {
    background-color: #FEE2E2;
  }
}

.slide-left-enter-active,
.slide-right-enter-active {
  transition: all 0.3s ease-out;
  position: absolute;
  width: calc(100% - 1.5rem);
}

.slide-left-leave-active,
.slide-right-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
  width: calc(100% - 1.5rem);
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}
</style> 