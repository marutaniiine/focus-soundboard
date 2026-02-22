import type { Sound, SoundState } from '../types'
import './SoundControl.css'

interface SoundControlProps {
  sound: Sound
  state: SoundState
  onToggle: () => void
  onVolumeChange: (volume: number) => void
}

function SoundControl({ sound, state, onToggle, onVolumeChange }: SoundControlProps) {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseInt(e.target.value)
    onVolumeChange(volume)
  }

  const handleToggle = () => {
    console.log('SoundControl button clicked:', sound.name)
    onToggle()
  }

  return (
    <div className={`sound-control ${state.playing ? 'active' : ''}`}>
      <button
        className="sound-toggle"
        onClick={handleToggle}
        aria-label={`${sound.name}を${state.playing ? '停止' : '再生'}`}
      >
        <span className="sound-icon">{sound.icon}</span>
        <span className="sound-name">{sound.name}</span>
      </button>

      <div className="volume-control">
        <span className="volume-label">🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={state.volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label={`${sound.name}の音量`}
        />
        <span className="volume-value">{state.volume}</span>
      </div>
    </div>
  )
}

export default SoundControl
