import Hero from '../components/home/Hero'
import StoreLogos from '../components/home/StoreLogos'
import Products from '../components/home/Products'
import Stats from '../components/home/Stats'
import AppSection from '../components/home/AppSection'
import Testimonials from '../components/home/Testimonials'
import CTASection from '../components/home/CTASection'

export default function HomePage() {
  return (
    <div data-testid="home-page">
      <Hero />
      <StoreLogos />
      <Products />
      <Stats />
      <AppSection />
      <Testimonials />
      <CTASection />
    </div>
  )
}
