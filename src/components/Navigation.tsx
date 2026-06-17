import { CalendarDays, ListChecks, Timer } from 'lucide-react'
import type { AppTab } from '../types'

interface NavigationProps {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
}

const items = [
  { id: 'calendar' as const, label: 'Calendario', Icon: CalendarDays },
  { id: 'plans' as const, label: 'Schede', Icon: ListChecks },
  { id: 'timer' as const, label: 'Timer', Icon: Timer },
]

export default function Navigation({ activeTab, onChange }: NavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {items.map(({ id, label, Icon }) => (
        <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => onChange(id)}>
          <Icon size={21} strokeWidth={2.2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
