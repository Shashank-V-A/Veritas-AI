import { motion } from 'framer-motion'
import { VeritasMark } from '@/components/brand/VeritasMark'
import { APP_NAME } from '@/lib/constants'

export function AuthLoadingScreen() {
  return (
    <div className="grain flex min-h-svh items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="size-14 border border-accent/25"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <VeritasMark variant="on-light" />
        </motion.div>
        <p className="font-display text-xl text-foreground">{APP_NAME}</p>
      </motion.div>
    </div>
  )
}
