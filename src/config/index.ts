export interface WordbookSource {
  name: string
  url: string
  enabled: boolean
}

export const config = {
  // 词库来源配置
  wordbookSources: [
    {
      name: "本地词库",
      url: "/src/book/bookLists.json",
      enabled: true
    },
    {
      name: "远端词典",
      url: "https://raw.githubusercontent.com/zhouyuguangsc/dict/master/bookLists.json",
      enabled: false
    }
  ] as WordbookSource[]
} 