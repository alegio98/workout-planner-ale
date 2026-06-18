import { ArrowLeft, CalendarDays, Dumbbell, Github, Timer, TimerReset } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'workout-planner.timer.v2'

type TimerState = {
  runningSince: number | null
}

interface TimerViewProps {
  sessionMode?: boolean
  onBackToWorkout?: () => void
  onBackToCalendar?: () => void
}

const initialTimerState = (): TimerState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { runningSince: null }
    const parsed = JSON.parse(stored) as Partial<TimerState>
    return { runningSince: typeof parsed.runningSince === 'number' ? parsed.runningSince : null }
  } catch {
    return { runningSince: null }
  }
}

const formatTime = (milliseconds: number) => {
  const safe = Math.max(0, milliseconds)
  const minutes = Math.floor(safe / 60_000)
  const seconds = Math.floor((safe % 60_000) / 1000)
  const millis = Math.floor(safe % 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export default function TimerView({ sessionMode = false, onBackToWorkout, onBackToCalendar }: TimerViewProps) {
  const [timer, setTimer] = useState<TimerState>(initialTimerState)
  const [now, setNow] = useState(Date.now())
  const running = timer.runningSince !== null

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
  }, [timer])

  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const interval = window.setInterval(() => setNow(Date.now()), 16)
    return () => window.clearInterval(interval)
  }, [running])

  const elapsed = useMemo(
    () => (timer.runningSince === null ? 0 : now - timer.runningSince),
    [now, timer.runningSince],
  )

  const toggleTimer = () => {
    if (running) {
      setTimer({ runningSince: null })
      setNow(Date.now())
      return
    }
    const startedAt = Date.now()
    setNow(startedAt)
    setTimer({ runningSince: startedAt })
  }

  return (
    <div className={`view-shell timer-view ${sessionMode ? 'timer-session-view' : ''}`}>
      {sessionMode && (
        <button className="back-link sticky-back-link" onClick={onBackToWorkout}>
          <ArrowLeft size={16} /> Torna all’allenamento
        </button>
      )}

      <section className="page-heading timer-heading">
        <div>
          <span className="eyebrow">Cronometro rapido</span>
          <h1>Timer</h1>
          <p>Tocca una volta per avviare. Tocca di nuovo per azzerare.</p>
        </div>
        <span className={`timer-status ${running ? 'running' : ''}`}><i /> {running ? 'In esecuzione' : 'Pronto'}</span>
      </section>

      <button
        type="button"
        className={`timer-card timer-tap-area ${running ? 'running' : ''}`}
        onClick={toggleTimer}
        aria-label={running ? 'Azzera il timer' : 'Avvia il timer'}
      >
        <div className="timer-icon"><TimerReset size={34} /></div>
        <div className="timer-display" aria-live="off">{formatTime(elapsed)}</div>
        <div className="timer-units" aria-hidden="true">
          <span>Minuti</span><span>Secondi</span><span>Millisecondi</span>
        </div>
        <strong className="timer-tap-hint">{running ? 'Tocca per azzerare' : 'Tocca per avviare'}</strong>
      </button>

      {sessionMode && (
        <nav className="session-shortcuts" aria-label="Scorciatoie allenamento">
          <button onClick={onBackToCalendar}><CalendarDays size={18} /><span>Calendario</span></button>
          <button onClick={onBackToWorkout}><Dumbbell size={18} /><span>Allenamento</span></button>
          <button className="active"><Timer size={18} /><span>Timer</span></button>
        </nav>
      )}

      <footer className="developer-credit">
        <a href="https://github.com/alegio98" target="_blank" rel="noreferrer">
          <Github size={13} strokeWidth={2.2} />
          <span>Powered by <b>@alegio98</b></span>
        </a>
      </footer>
    </div>
  )
}
