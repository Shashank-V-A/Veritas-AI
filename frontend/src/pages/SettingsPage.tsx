import { useEffect, useState } from 'react'
import { LogOut, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { slideUp } from '@/animations/variants'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { investigationAudio } from '@/lib/investigationAudio'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const reducedMotion = useReducedMotion()
  const [soundOn, setSoundOn] = useState(() => investigationAudio.isEnabled())

  useEffect(() => investigationAudio.subscribe(setSoundOn), [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-10 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : slideUp}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <header className="mb-8">
          <p className="font-mono text-xs text-accent-secondary/80">{t('settings.title')}</p>
          <h1 className="mt-2 font-display text-3xl text-card-foreground">{t('settings.title')}</h1>
        </header>

        <section className="mb-8 dossier-panel p-6">
          <h2 className="font-display text-lg text-card-foreground">{t('settings.language')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('settings.languageHint')}</p>
          <div className="mt-4 flex gap-2">
            {(['en', 'hi'] as const).map((lng) => (
              <Button
                key={lng}
                type="button"
                variant={i18n.language === lng ? 'default' : 'outline'}
                size="sm"
                onClick={() => void i18n.changeLanguage(lng)}
                aria-pressed={i18n.language === lng}
              >
                {lng === 'en' ? t('settings.english') : t('settings.hindi')}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-8 dossier-panel p-6">
          <h2 className="font-display text-lg text-card-foreground">{t('settings.sound')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('settings.soundHint')}</p>
          <Button
            type="button"
            variant={soundOn ? 'default' : 'outline'}
            size="sm"
            className="mt-4 gap-2"
            aria-pressed={soundOn}
            onClick={() => {
              investigationAudio.unlock()
              investigationAudio.setEnabled(!soundOn)
              if (!soundOn) {
                investigationAudio.preview()
              }
            }}
          >
            {soundOn ? (
              <Volume2 className="size-4" strokeWidth={1.5} />
            ) : (
              <VolumeX className="size-4" strokeWidth={1.5} />
            )}
            {soundOn ? t('settings.soundOn') : t('settings.soundOff')}
          </Button>
        </section>

        <section className="dossier-panel p-6">
          <h2 className="font-display text-lg text-card-foreground">{t('settings.account')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('settings.logoutHint')}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => void logout()}
            aria-label={t('settings.logout')}
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            {t('settings.logout')}
          </Button>
        </section>
      </motion.div>
    </div>
  )
}
