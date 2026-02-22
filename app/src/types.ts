export interface SoundState {
  volume: number
  playing: boolean
}

export interface Sound {
  id: string
  name: string
  icon: string
  frequency: number
}

export interface Preset {
  id: string
  name: string
  soundStates: Record<string, SoundState>
}
