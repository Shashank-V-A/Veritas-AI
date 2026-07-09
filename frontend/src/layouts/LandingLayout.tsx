import { Outlet } from 'react-router-dom'

export function LandingLayout() {
  return (
    <div className="min-h-svh bg-background">
      <Outlet />
    </div>
  )
}
