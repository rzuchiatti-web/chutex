import Hero from '../components/home/Hero'
import Products from '../components/home/Products'
import Mission from '../components/home/Mission'
import Solutions from '../components/home/Solutions'
import AppShowcase from '../components/home/AppShowcase'
import Teleassistance from '../components/home/Teleassistance'
import Professionals from '../components/home/Professionals'
import TrustSection from '../components/home/TrustSection'
import CTASection from '../components/home/CTASection'

export default function HomePage() {
  return (
    <div data-testid="home-page">
      <Hero />
      <Products />
      <Mission />
      <Solutions />
      <AppShowcase />
      <Teleassistance />
      <Professionals />
      <TrustSection />
      <CTASection />
    </div>
  )
}
