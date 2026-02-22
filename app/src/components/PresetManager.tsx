import { useState } from 'react'
import type { Preset } from '../types'
import './PresetManager.css'

interface PresetManagerProps {
  presets: Preset[]
  onSave: (name: string) => void
  onLoad: (preset: Preset) => void
  onDelete: (id: string) => void
}

function PresetManager({ presets, onSave, onLoad, onDelete }: PresetManagerProps) {
  const [presetName, setPresetName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleSave = () => {
    if (presetName.trim()) {
      onSave(presetName.trim())
      setPresetName('')
      setShowInput(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <div className="preset-manager">
      <h3 className="preset-title">💾 プリセット</h3>

      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="preset-save-btn"
        >
          ➕ 現在の設定を保存
        </button>
      ) : (
        <div className="preset-input-group">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="プリセット名"
            className="preset-input"
            autoFocus
          />
          <div className="preset-input-buttons">
            <button onClick={handleSave} className="preset-confirm-btn">
              保存
            </button>
            <button
              onClick={() => {
                setShowInput(false)
                setPresetName('')
              }}
              className="preset-cancel-btn"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="preset-list">
        {presets.length === 0 ? (
          <p className="preset-empty">
            プリセットがありません
          </p>
        ) : (
          presets.map(preset => (
            <div key={preset.id} className="preset-item">
              <button
                onClick={() => onLoad(preset)}
                className="preset-load-btn"
                title={`「${preset.name}」を読み込む`}
              >
                <span className="preset-name">{preset.name}</span>
                <span className="preset-icon">▶️</span>
              </button>
              {!preset.id.startsWith('default-') && (
                <button
                  onClick={() => {
                    if (confirm(`「${preset.name}」を削除しますか？`)) {
                      onDelete(preset.id)
                    }
                  }}
                  className="preset-delete-btn"
                  title="削除"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PresetManager
