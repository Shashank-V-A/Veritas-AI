export const ONBOARDING_KEY = 'veritas-onboarding-complete'

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY)
}
