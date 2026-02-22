import { useState, useEffect, useRef } from 'react'
import './Timer.css'

interface TimerProps {
  onTimerEnd: () => void
}

function Timer({ onTimerEnd }: TimerProps) {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [inputMinutes, setInputMinutes] = useState('25')

  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => {
          if (prev === 0) {
            setMinutes(prevMin => {
              if (prevMin === 0) {
                setIsRunning(false)
                onTimerEnd()
                if (intervalRef.current) clearInterval(intervalRef.current)
                // Play notification sound
                const audio = new AudioContext()
                const oscillator = audio.createOscillator()
                const gain = audio.createGain()
                oscillator.connect(gain)
                gain.connect(audio.destination)
                oscillator.frequency.value = 800
                gain.gain.value = 0.3
                oscillator.start()
                oscillator.stop(audio.currentTime + 0.3)
                return 0
              }
              return prevMin - 1
            })
            return 59
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onTimerEnd])

  const handleStart = () => {
    if (minutes === 0 && seconds === 0) {
      const mins = parseInt(inputMinutes) || 25
      setMinutes(mins)
      setSeconds(0)
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    const mins = parseInt(inputMinutes) || 25
    setMinutes(mins)
    setSeconds(0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputMinutes(value)
    if (!isRunning) {
      const mins = parseInt(value) || 0
      setMinutes(mins)
      setSeconds(0)
    }
  }

  const progress = () => {
    const total = parseInt(inputMinutes) * 60
    const current = minutes * 60 + seconds
    return ((total - current) / total) * 100
  }

  return (
    <div className="timer">
      <h3 className="timer-title">⏱️ タイマー</h3>

      <div className="timer-display">
        <div
          className="timer-progress"
          style={{ width: `${progress()}%` }}
        />
        <span className="timer-time">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <div className="timer-input">
        <input
          type="number"
          min="1"
          max="180"
          value={inputMinutes}
          onChange={handleInputChange}
          disabled={isRunning}
          className="timer-minutes-input"
        />
        <span>分</span>
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="timer-btn start">
            ▶️ 開始
          </button>
        ) : (
          <button onClick={handlePause} className="timer-btn pause">
            ⏸️ 一時停止
          </button>
        )}
        <button onClick={handleReset} className="timer-btn reset">
          🔄 リセット
        </button>
      </div>
    </div>
  )
}

export default Timer
