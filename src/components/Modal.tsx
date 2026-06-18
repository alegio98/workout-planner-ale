import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}

export default function Modal({ open, title, description, children, onClose, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return

    const html = document.documentElement
    const body = document.body
    html.classList.add('modal-open')
    body.classList.add('modal-open')

    return () => {
      html.classList.remove('modal-open')
      body.classList.remove('modal-open')
    }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-sheet ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-handle" />
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Chiudi">
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
