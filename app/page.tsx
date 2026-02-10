import { HeroSection } from "@/components/hero-section"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HowToUseSection } from "@/components/how-to-use-section"
import { AllFeaturesSection } from "@/components/all-features-section"
import { StartNowSection } from "@/components/start-now-section"
import { BenefitsSection } from "@/components/benefits-section"
import { FAQSection } from "@/components/faq-section"
import { FeaturesHighlight } from "@/components/features-highlight"
import { TestimonialsSection } from "@/components/testimonials-section"
import { PricingSection } from "@/components/pricing-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesHighlight />
        <AllFeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <HowToUseSection />
        <StartNowSection />
        <BenefitsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
