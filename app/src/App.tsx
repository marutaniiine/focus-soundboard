import { useState, useEffect, useRef } from 'react'
import './App.css'
import SoundControl from './components/SoundControl'
import PresetManager from './components/PresetManager'
import Timer from './components/Timer'
import type { SoundState, Preset } from './types'

const SOUNDS = [
  { id: 'rain', name: '雨音', icon: '🌧️', frequency: 200 },
  { id: 'ocean', name: '波の音', icon: '🌊', frequency: 150 },
  { id: 'forest', name: '森の音', icon: '🌲', frequency: 180 },
  { id: 'fire', name: '焚き火', icon: '🔥', frequency: 100 },
  { id: 'cafe', name: 'カフェ', icon: '☕', frequency: 250 },
  { id: 'wind', name: '風', icon: '💨', frequency: 120 },
  { id: 'birds', name: '小鳥', icon: '🐦', frequency: 300 },
  { id: 'thunder', name: '雷鳴', icon: '⚡', frequency: 80 },
  { id: 'stream', name: '小川', icon: '💧', frequency: 220 },
  { id: 'night', name: '夜の虫', icon: '🌙', frequency: 160 },
]

// Default preset configurations
const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'default-focus',
    name: '🎯 集中モード',
    soundStates: {
      rain: { volume: 40, playing: false },
      ocean: { volume: 0, playing: false },
      forest: { volume: 0, playing: false },
      fire: { volume: 0, playing: false },
      cafe: { volume: 60, playing: false },
      wind: { volume: 0, playing: false },
      birds: { volume: 0, playing: false },
      thunder: { volume: 0, playing: false },
      stream: { volume: 0, playing: false },
      night: { volume: 0, playing: false },
    }
  },
  {
    id: 'default-relax',
    name: '🌿 リラックスモード',
    soundStates: {
      rain: { volume: 0, playing: false },
      ocean: { volume: 0, playing: false },
      forest: { volume: 50, playing: false },
      fire: { volume: 0, playing: false },
      cafe: { volume: 0, playing: false },
      wind: { volume: 0, playing: false },
      birds: { volume: 40, playing: false },
      thunder: { volume: 0, playing: false },
      stream: { volume: 45, playing: false },
      night: { volume: 0, playing: false },
    }
  },
  {
    id: 'default-night',
    name: '🌙 深夜作業モード',
    soundStates: {
      rain: { volume: 0, playing: false },
      ocean: { volume: 0, playing: false },
      forest: { volume: 0, playing: false },
      fire: { volume: 55, playing: false },
      cafe: { volume: 0, playing: false },
      wind: { volume: 0, playing: false },
      birds: { volume: 0, playing: false },
      thunder: { volume: 0, playing: false },
      stream: { volume: 0, playing: false },
      night: { volume: 35, playing: false },
    }
  },
]

function App() {
  const [soundStates, setSoundStates] = useState<Record<string, SoundState>>(() => {
    const initial: Record<string, SoundState> = {}
    SOUNDS.forEach(sound => {
      initial[sound.id] = { volume: 50, playing: false }
    })
    return initial
  })

  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('focus-soundboard-presets')
    if (saved) {
      const userPresets = JSON.parse(saved)
      // Merge default presets with user presets
      const defaultIds = DEFAULT_PRESETS.map(p => p.id)
      const filteredUserPresets = userPresets.filter((p: Preset) => !defaultIds.includes(p.id))
      return [...DEFAULT_PRESETS, ...filteredUserPresets]
    }
    return DEFAULT_PRESETS
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<Record<string, { osc: OscillatorNode, gain: GainNode }>>({})

  useEffect(() => {
    audioContextRef.current = new AudioContext()

    return () => {
      Object.values(oscillatorsRef.current).forEach(({ osc }) => {
        osc.stop()
      })
      audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    // Only save user presets (exclude default presets)
    const userPresets = presets.filter(p => !p.id.startsWith('default-'))
    localStorage.setItem('focus-soundboard-presets', JSON.stringify(userPresets))
  }, [presets])

  const toggleSound = (id: string) => {
    const newState = !soundStates[id].playing

    if (newState) {
      playSound(id, soundStates[id].volume)
    } else {
      stopSound(id)
    }

    setSoundStates(prev => ({
      ...prev,
      [id]: { ...prev[id], playing: newState }
    }))
  }

  const changeVolume = (id: string, volume: number) => {
    setSoundStates(prev => ({
      ...prev,
      [id]: { ...prev[id], volume }
    }))

    if (soundStates[id].playing && oscillatorsRef.current[id]) {
      oscillatorsRef.current[id].gain.gain.value = volume / 100
    }
  }

  const playSound = (id: string, volume: number) => {
    if (!audioContextRef.current) return

    const sound = SOUNDS.find(s => s.id === id)
    if (!sound) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    // Different sound types
    switch (id) {
      case 'rain':
      case 'ocean':
      case 'forest':
      case 'wind':
      case 'stream':
        oscillator.type = 'sawtooth'
        filter.type = 'lowpass'
        filter.frequency.value = 800
        break
      case 'fire':
      case 'cafe':
        oscillator.type = 'triangle'
        filter.type = 'bandpass'
        filter.frequency.value = 600
        break
      case 'birds':
      case 'night':
        oscillator.type = 'sine'
        filter.type = 'highpass'
        filter.frequency.value = 2000
        break
      case 'thunder':
        oscillator.type = 'sawtooth'
        filter.type = 'lowpass'
        filter.frequency.value = 200
        break
    }

    oscillator.frequency.value = sound.frequency
    gainNode.gain.value = volume / 100

    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start()

    oscillatorsRef.current[id] = { osc: oscillator, gain: gainNode }

    // Add subtle frequency modulation for more natural sound
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.5 + Math.random() * 2
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = sound.frequency * 0.05
    lfo.connect(lfoGain)
    lfoGain.connect(oscillator.frequency)
    lfo.start()
  }

  const stopSound = (id: string) => {
    if (oscillatorsRef.current[id]) {
      oscillatorsRef.current[id].osc.stop()
      delete oscillatorsRef.current[id]
    }
  }

  const stopAll = () => {
    Object.keys(soundStates).forEach(id => {
      if (soundStates[id].playing) {
        stopSound(id)
      }
    })

    setSoundStates(prev => {
      const newStates: Record<string, SoundState> = {}
      Object.keys(prev).forEach(id => {
        newStates[id] = { ...prev[id], playing: false }
      })
      return newStates
    })
  }

  const savePreset = (name: string) => {
    const preset: Preset = {
      id: Date.now().toString(),
      name,
      soundStates: { ...soundStates }
    }
    setPresets(prev => [...prev, preset])
  }

  const loadPreset = (preset: Preset) => {
    // Stop all current sounds
    stopAll()

    // Load new preset
    setSoundStates(preset.soundStates)

    // Start playing sounds from preset
    Object.entries(preset.soundStates).forEach(([id, state]) => {
      if (state.playing) {
        playSound(id, state.volume)
      }
    })
  }

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎧 集中サウンドボード</h1>
        <p className="subtitle">環境音を組み合わせて、自分だけの集中空間を作ろう</p>
      </header>

      <div className="container">
        <div className="sounds-grid">
          {SOUNDS.map(sound => (
            <SoundControl
              key={sound.id}
              sound={sound}
              state={soundStates[sound.id]}
              onToggle={() => toggleSound(sound.id)}
              onVolumeChange={(volume) => changeVolume(sound.id, volume)}
            />
          ))}
        </div>

        <div className="sidebar">
          <Timer onTimerEnd={stopAll} />
          <PresetManager
            presets={presets}
            onSave={savePreset}
            onLoad={loadPreset}
            onDelete={deletePreset}
          />
          <button className="stop-all-btn" onClick={stopAll}>
            ⏹️ すべて停止
          </button>
        </div>
      </div>

      <footer className="footer">
        <p>💡 ヒント: 音を組み合わせて、自分だけの集中環境を見つけよう</p>
      </footer>
    </div>
  )
}

export default App
