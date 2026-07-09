import { motion } from 'framer-motion'
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
        <div className="relative size-12">
          <motion.div
            className="absolute inset-0 rounded-full border border-black/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-1 rounded-full border-t border-foreground"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="text-xl font-semibold text-foreground">{APP_NAME}</p>
      </motion.div>
    </div>
  )
}
