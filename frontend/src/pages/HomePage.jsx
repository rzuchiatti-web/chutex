import Hero from '../components/home/Hero'
import ScrollText from '../components/home/ScrollText'
import BeforeAfter from '../components/home/BeforeAfter'
import Products from '../components/home/Products'
import HowItWorks from '../components/home/HowItWorks'
import Stats from '../components/home/Stats'
import AppSection from '../components/home/AppSection'
import Testimonials from '../components/home/Testimonials'
import CTASection from '../components/home/CTASection'

export default function HomePage() {
  return (
    <div data-testid="home-page">
      <Hero />
      <ScrollText />
      <BeforeAfter />
      <Products />
      <HowItWorks />
      <Stats />
      <AppSection />
      <Testimonials />
      <CTASection />
    </div>
  )
}
