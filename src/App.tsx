import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Navigation from './components/Navigation'
import Toast from './components/Toast'
import { db } from './db'
import type { AppTab } from './types'
import { localDate } from './utils'
import CalendarView from './views/CalendarView'
import PlansView from './views/PlansView'
import TimerView from './views/TimerView'
import WorkoutView from './views/WorkoutView'

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('calendar')
  const [selectedDate, setSelectedDate] = useState(localDate())
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionScreen, setSessionScreen] = useState<'workout' | 'timer'>('workout')
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)
  const contentRef = useRef<HTMLElement | null>(null)

  const plans = useLiveQuery(() => db.plans.orderBy('updatedAt').reverse().toArray())
  const sessions = useLiveQuery(() => db.sessions.orderBy('scheduledDate').toArray())

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  useEffect(() => {
    window.requestAnimationFrame(() => contentRef.current?.scrollTo({ top: 0 }))
  }, [activeSessionId, sessionScreen])

  const notify = (message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }

  const openSession = (id: string) => {
    setActiveSessionId(id)
    setSessionScreen('workout')
  }

  const closeSession = () => {
    setActiveSessionId(null)
    setSessionScreen('workout')
    setActiveTab('calendar')
  }

  const loading = plans === undefined || sessions === undefined
  const availablePlans = plans ?? []
  const availableSessions = sessions ?? []

  return (
    <div className="app-background">
      <div className="app-frame">
        <main ref={contentRef} className={`app-content ${activeSessionId ? 'session-detail-open' : ''}`}>
          {loading ? (
            <div className="view-shell">
              <section className="loading-state" aria-live="polite">
                <span className="loading-spinner" />
                <b>Caricamento dati…</b>
              </section>
            </div>
          ) : activeSessionId && sessionScreen === 'timer' ? (
            <TimerView
              sessionMode
              onBackToWorkout={() => setSessionScreen('workout')}
              onBackToCalendar={closeSession}
            />
          ) : activeSessionId ? (
            <WorkoutView
              plans={availablePlans}
              sessions={availableSessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSessionId}
              onBack={closeSession}
              onOpenTimer={() => setSessionScreen('timer')}
              notify={notify}
            />
          ) : (
            <>
              {activeTab === 'calendar' && (
                <CalendarView
                  plans={availablePlans}
                  sessions={availableSessions}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onOpenSession={openSession}
                  notify={notify}
                />
              )}
              {activeTab === 'plans' && <PlansView plans={availablePlans} notify={notify} />}
              {activeTab === 'timer' && <TimerView />}
            </>
          )}
        </main>

        {!loading && !activeSessionId && <Navigation activeTab={activeTab} onChange={setActiveTab} />}
        <Toast message={toast} />
      </div>
    </div>
  )
}
