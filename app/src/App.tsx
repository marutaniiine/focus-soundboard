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

  const toggleSound = async (id: string) => {
    console.log('toggleSound called:', id, 'current state:', soundStates[id])

    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === 'suspended') {
      console.log('Resuming suspended AudioContext')
      await audioContextRef.current.resume()
    }
    console.log('AudioContext state:', audioContextRef.current?.state)

    const newState = !soundStates[id].playing

    if (newState) {
      console.log('Playing sound:', id, 'volume:', soundStates[id].volume)
      playSound(id, soundStates[id].volume)
    } else {
      console.log('Stopping sound:', id)
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

    if (oscillatorsRef.current[id]) {
      // Update gain value based on sound type (same as in playSound)
      let gainValue = volume / 100
      switch (id) {
        case 'rain': gainValue = volume / 150; break
        case 'ocean': gainValue = volume / 120; break
        case 'forest': gainValue = volume / 140; break
        case 'fire': gainValue = volume / 130; break
        case 'cafe': gainValue = volume / 110; break
        case 'wind': gainValue = volume / 140; break
        case 'birds': gainValue = volume / 180; break
        case 'thunder': gainValue = volume / 100; break
        case 'stream': gainValue = volume / 130; break
        case 'night': gainValue = volume / 200; break
      }
      oscillatorsRef.current[id].gain.gain.value = gainValue
      console.log('Updated gain to:', gainValue)
    }
  }

  const playSound = (id: string, volume: number) => {
    console.log('playSound called:', id, 'volume:', volume)

    if (!audioContextRef.current) {
      console.error('AudioContext not initialized')
      return
    }

    const sound = SOUNDS.find(s => s.id === id)
    if (!sound) {
      console.error('Sound not found:', id)
      return
    }

    const ctx = audioContextRef.current
    console.log('Creating audio nodes for:', sound.name)

    // Create white noise using buffer source
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    // Different sound types with appropriate filtering
    switch (id) {
      case 'rain':
        filter.type = 'bandpass'
        filter.frequency.value = 1000
        filter.Q.value = 0.5
        gainNode.gain.value = volume / 150
        break
      case 'ocean':
        filter.type = 'lowpass'
        filter.frequency.value = 500
        filter.Q.value = 1
        gainNode.gain.value = volume / 120
        break
      case 'forest':
        filter.type = 'bandpass'
        filter.frequency.value = 800
        filter.Q.value = 0.3
        gainNode.gain.value = volume / 140
        break
      case 'fire':
        filter.type = 'lowpass'
        filter.frequency.value = 300
        filter.Q.value = 0.5
        gainNode.gain.value = volume / 130
        break
      case 'cafe':
        filter.type = 'bandpass'
        filter.frequency.value = 1500
        filter.Q.value = 0.4
        gainNode.gain.value = volume / 110
        break
      case 'wind':
        filter.type = 'highpass'
        filter.frequency.value = 400
        filter.Q.value = 0.3
        gainNode.gain.value = volume / 140
        break
      case 'birds':
        filter.type = 'highpass'
        filter.frequency.value = 2000
        filter.Q.value = 2
        gainNode.gain.value = volume / 180
        break
      case 'thunder':
        filter.type = 'lowpass'
        filter.frequency.value = 150
        filter.Q.value = 0.8
        gainNode.gain.value = volume / 100
        break
      case 'stream':
        filter.type = 'bandpass'
        filter.frequency.value = 1200
        filter.Q.value = 0.6
        gainNode.gain.value = volume / 130
        break
      case 'night':
        filter.type = 'bandpass'
        filter.frequency.value = 3000
        filter.Q.value = 3
        gainNode.gain.value = volume / 200
        break
    }

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    console.log('Starting noise source, gain:', gainNode.gain.value)
    noise.start()

    oscillatorsRef.current[id] = { osc: noise as unknown as OscillatorNode, gain: gainNode }
    console.log('Sound started successfully:', id)
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

  const loadPreset = async (preset: Preset) => {
    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }

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
