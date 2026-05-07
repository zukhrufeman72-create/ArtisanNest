// Browser SpeechRecognition API types

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  readonly isFinal: boolean
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
  onerror: ((this: SpeechRecognition, ev: Event) => unknown) | null
  start(): void
  stop(): void
  abort(): void
}

declare const SpeechRecognition: {
  new (): SpeechRecognition
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition | undefined
  webkitSpeechRecognition: typeof SpeechRecognition | undefined
}
