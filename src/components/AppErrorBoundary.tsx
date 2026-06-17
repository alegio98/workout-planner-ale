import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Errore non gestito nell’interfaccia:', error, info)
  }

  private recover = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="app-background">
        <div className="app-frame">
          <main className="app-content">
            <div className="view-shell">
              <section className="error-state" role="alert">
                <span className="empty-icon"><AlertTriangle size={24} /></span>
                <h1>La schermata non si è caricata</h1>
                <p>I dati salvati non vengono cancellati. Ricarica l’app per ripristinare la vista.</p>
                <button className="primary-button" onClick={this.recover}>
                  <RefreshCw size={17} /> Ricarica applicazione
                </button>
              </section>
            </div>
          </main>
        </div>
      </div>
    )
  }
}
