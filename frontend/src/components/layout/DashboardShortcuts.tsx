import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

export function DashboardShortcuts() {
  const navigate = useNavigate()

  useKeyboardShortcut('n', () => navigate(ROUTES.dashboard), {
    metaOrCtrl: false,
  })

  return null
}
