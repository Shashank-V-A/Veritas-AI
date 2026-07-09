import { NavBar, HeroSection } from '@/components/landing/HeroSection'
import { DemoPreview } from '@/components/landing/DemoPreview'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { WhyVeritasSection } from '@/components/landing/WhyVeritasSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'

export function LandingPage() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <DemoPreview />
      <FeaturesSection />
      <HowItWorksSection />
      <WhyVeritasSection />
      <CtaSection />
      <Footer />
    </>
  )
}
