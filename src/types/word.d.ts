interface Choice {
  choiceIndex: number
  choice: string
}

interface Answer {
  explain: string
  rightIndex: number
}

interface Exam {
  question: string
  answer: Answer
  examType: number
  choices: Choice[]
}

interface Sentence {
  sContent: string
  sCn: string
}

interface Phrase {
  pContent: string
  pCn: string
}

interface RelWord {
  hwd: string
  tran: string
}

interface Translation {
  tranCn: string
  descOther: string
  pos: string
  descCn: string
  tranOther: string
}

interface WordContent {
  exam: Exam[]
  sentence: {
    sentences: Sentence[]
    desc: string
  }
  usphone: string
  ukphone: string
  ukspeech: string
  phrase: {
    phrases: Phrase[]
    desc: string
  }
  relWord: {
    rels: {
      pos: string
      words: RelWord[]
    }[]
    desc: string
  }
  usspeech: string
  trans: Translation[]
}

export interface Word {
  wordRank: number
  headWord: string
  content: {
    word: {
      wordHead: string
      wordId: string
      content: WordContent
    }
  }
  bookId: string
}

declare module '*/CET4luan_1.json' {
  const value: Word[]
  export default value
} 