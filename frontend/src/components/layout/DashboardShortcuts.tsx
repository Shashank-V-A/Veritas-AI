import { useNavigate } from 'react-router-dom'
import { ROUTES, FOCUS_INTAKE_EVENT } from '@/lib/constants'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

export function DashboardShortcuts() {
  const navigate = useNavigate()

  useKeyboardShortcut(
    'n',
    () => {
      navigate(ROUTES.dashboard)
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(FOCUS_INTAKE_EVENT))
      }, 100)
    },
    { metaOrCtrl: false },
  )

  return null
}
