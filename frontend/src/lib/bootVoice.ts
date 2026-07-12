const BOOT_AUDIO_SRC = '/sounds/veritas-boot.mp3'

type BootVoiceHandle = {
  stop: () => void
  /** Call from a click/tap handler if autoplay was blocked. */
  unlockAndPlay: () => void
  /** True once playback has actually started. */
  hasPlayed: () => boolean
}

/**
 * Plays the boot splash voice (`/sounds/veritas-boot.mp3`).
 * Browsers often block autoplay — `unlockAndPlay` must run from a user gesture when needed.
 */
export function playBootVoice(): BootVoiceHandle {
  let cancelled = false
  let played = false
  let audio: HTMLAudioElement | null = null

  function ensureAudio(): HTMLAudioElement {
    if (!audio) {
      audio = new Audio(BOOT_AUDIO_SRC)
      audio.preload = 'auto'
      audio.volume = 1
    }
    return audio
  }

  async function tryPlay(): Promise<boolean> {
    if (cancelled || played || typeof window === 'undefined') return false

    const el = ensureAudio()
    try {
      el.currentTime = 0
      await el.play()
      played = true
      return true
    } catch {
      // Autoplay policy — needs a user gesture
      return false
    }
  }

  function unlockAndPlay() {
    if (cancelled || played) return
    void tryPlay().then((ok) => {
      if (ok || cancelled) return
      // Last resort: Web Speech API after gesture (usually allowed)
      speakFallback()
    })
  }

  function speakFallback() {
    if (cancelled || played || !('speechSynthesis' in window)) return
    played = true
    const synth = window.speechSynthesis
    try {
      synth.cancel()
      synth.resume()
    } catch {
      /* ignore */
    }
    const utterance = new SpeechSynthesisUtterance('Veritas AI Loading')
    utterance.lang = 'en-US'
    utterance.rate = 0.75
    utterance.pitch = 0.4
    utterance.volume = 1
    const voices = synth.getVoices()
    const male =
      voices.find((v) => /david|mark|daniel|male|guy|davis/i.test(v.name)) ??
      voices.find((v) => /en(-|_)?us/i.test(v.lang))
    if (male) utterance.voice = male
    synth.speak(utterance)
  }

  // Attempt autoplay immediately + after short delays (file may still be buffering)
  void tryPlay()
  window.setTimeout(() => void tryPlay(), 200)
  window.setTimeout(() => void tryPlay(), 600)

  return {
    stop() {
      cancelled = true
      if (audio) {
        audio.pause()
        audio.src = ''
        audio = null
      }
      try {
        window.speechSynthesis?.cancel()
      } catch {
        /* ignore */
      }
    },
    unlockAndPlay,
    hasPlayed: () => played,
  }
}
