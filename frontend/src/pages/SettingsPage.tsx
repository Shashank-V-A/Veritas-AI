import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Key, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { slideUp } from '@/animations/variants'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const reducedMotion = useReducedMotion()
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState('')
  const [keyName, setKeyName] = useState('API key')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.getTeams(),
  })

  const createTeamMutation = useMutation({
    mutationFn: () => api.createTeam(teamName.trim() || 'Newsroom'),
    onSuccess: () => {
      setTeamName('')
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const createKeyMutation = useMutation({
    mutationFn: () => api.createApiKey(keyName.trim() || undefined),
    onSuccess: (data) => {
      setGeneratedKey(data.key)
    },
  })

  async function copyKey() {
    if (!generatedKey) return
    await navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

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
          <h2 className="font-display text-lg text-card-foreground">{t('settings.theme')}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <ThemeToggle variant="labeled" />
          </div>
        </section>

        <section className="mb-8 dossier-panel p-6">
          <h2 className="font-display text-lg text-card-foreground">{t('settings.language')}</h2>
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
                {lng === 'en' ? 'English' : 'हिन्दी'}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-8 dossier-panel p-6">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-accent-secondary" strokeWidth={1.5} />
            <h2 className="font-display text-lg text-card-foreground">{t('settings.apiKeys')}</h2>
          </div>
          <p className="mt-2 text-sm text-card-foreground/60">
            Generate a key for programmatic access via the Veritas API.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key label"
              className="max-w-xs border-accent/20 bg-surface/50"
              aria-label="API key name"
            />
            <Button
              type="button"
              onClick={() => createKeyMutation.mutate()}
              disabled={createKeyMutation.isPending}
              aria-label={t('settings.generateKey')}
            >
              {t('settings.generateKey')}
            </Button>
          </div>
          {createKeyMutation.isError && (
            <p className="mt-2 text-xs text-danger" role="alert">
              {getFriendlyErrorMessage(createKeyMutation.error)}
            </p>
          )}
          {generatedKey && (
            <div className="mt-4 flex items-center gap-2 border border-warning/30 bg-warning/5 p-3">
              <code className="flex-1 break-all font-mono text-xs">{generatedKey}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void copyKey()}
                aria-label="Copy API key"
              >
                <Copy className="size-4" />
              </Button>
              {copied && <span className="text-xs text-success">Copied</span>}
            </div>
          )}
        </section>

        <section className="dossier-panel p-6">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-accent-secondary" strokeWidth={1.5} />
            <h2 className="font-display text-lg text-card-foreground">{t('settings.teams')}</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              className="max-w-xs border-accent/20 bg-surface/50"
              aria-label="Team name"
            />
            <Button
              type="button"
              onClick={() => createTeamMutation.mutate()}
              disabled={createTeamMutation.isPending}
              aria-label={t('settings.createTeam')}
            >
              {t('settings.createTeam')}
            </Button>
          </div>
          {createTeamMutation.isError && (
            <p className="mt-2 text-xs text-danger" role="alert">
              {getFriendlyErrorMessage(createTeamMutation.error)}
            </p>
          )}
          <ul className="mt-4 space-y-2">
            {teamsQuery.data?.teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between border border-accent/15 px-3 py-2 text-sm"
              >
                <span className="text-card-foreground">{team.name}</span>
                <span className="font-mono text-[10px] text-card-foreground/45">
                  {team.members?.length ?? 0} members
                </span>
              </li>
            ))}
            {teamsQuery.isSuccess && teamsQuery.data.teams.length === 0 && (
              <li className="text-xs text-card-foreground/45">No teams yet.</li>
            )}
          </ul>
        </section>
      </motion.div>
    </div>
  )
}
