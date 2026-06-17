import { useEffect, useMemo, useState } from 'react'
import { Download, Share, SquarePlus } from 'lucide-react'
import Modal from './Modal'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [showHelp, setShowHelp] = useState(false)
  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), [])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      setShowHelp(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!import.meta.env.PROD || installed) return null

  const install = async () => {
    if (!installPrompt) {
      setShowHelp(true)
      return
    }

    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <>
      <button className="install-app-button" onClick={install} aria-label="Installa Workout Planner">
        <Download size={15} />
        <span>Installa</span>
      </button>

      <Modal
        open={showHelp}
        title="Installa Workout Planner"
        description="L’app verrà aggiunta alla schermata Home e si aprirà senza la barra del browser."
        onClose={() => setShowHelp(false)}
      >
        <div className="install-instructions">
          {isIos ? (
            <>
              <div><span><Share size={18} /></span><p><b>1. Tocca Condividi</b><small>Usa Safari e premi l’icona con il quadrato e la freccia.</small></p></div>
              <div><span><SquarePlus size={18} /></span><p><b>2. Aggiungi alla schermata Home</b><small>Scorri il menu e conferma con “Aggiungi”.</small></p></div>
            </>
          ) : (
            <>
              <div><span><Download size={18} /></span><p><b>Apri il menu del browser</b><small>Scegli “Installa app” oppure “Aggiungi alla schermata Home”.</small></p></div>
              <div><span><SquarePlus size={18} /></span><p><b>Conferma l’installazione</b><small>L’icona comparirà tra le applicazioni del dispositivo.</small></p></div>
            </>
          )}
          <button className="primary-button full-width" onClick={() => setShowHelp(false)}>Ho capito</button>
        </div>
      </Modal>
    </>
  )
}
