import Hero from '../components/home/Hero'
import Products from '../components/home/Products'
import HowItWorks from '../components/home/HowItWorks'
import Stats from '../components/home/Stats'
import AppSection from '../components/home/AppSection'
import CTASection from '../components/home/CTASection'
import TrustSection from '../components/home/TrustSection'

export default function HomePage() {
  return (
    <div data-testid="home-page">
      <Hero />
      <Products />
      <HowItWorks />
      <Stats />
      <AppSection />
      <TrustSection />
      <CTASection />
    </div>
  )
}
