import { useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

const FOOTER_BG = 'https://images.unsplash.com/photo-1774799560672-151b971fd336?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=2000'

export default function Footer() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')

  const col1 = [
    { label: t('footer.mainPage'), href: '/' },
    { label: t('footer.about'), href: '#' },
    { label: t('nav.elder'), href: '#products' },
    { label: t('nav.elio'), href: '#products' },
    { label: t('nav.vita'), href: '#products' },
  ]

  const col2 = [
    { label: t('footer.teleassistance'), href: '#' },
    { label: t('footer.proSpace'), href: '#' },
    { label: t('footer.privacy'), href: '#' },
    { label: t('footer.terms'), href: '#' },
    { label: t('footer.mentions'), href: '#' },
  ]

  return (
    <footer data-testid="main-footer" className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={FOOTER_BG}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0a1a1f]/60" />
      </div>

      {/* Curved separator top */}
      <div className="relative z-10">
        <svg viewBox="0 0 1514 80" className="w-full block" preserveAspectRatio="none" style={{ marginBottom: '-1px' }}>
          <path d="M0 80V0h1514v80C1514 80 1214 30 757 30S0 80 0 80Z" fill="#FAFAFA" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Main footer content */}
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-10 md:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

            {/* Left: Newsletter */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2
                data-testid="footer-newsletter-title"
                className="text-[clamp(2.2rem,5vw,3.8rem)] font-light text-white leading-[1.1] tracking-[-0.03em] mb-6"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t('footer.newsletterTitle').split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h2>

              <p className="text-[14px] md:text-[15px] text-white/50 leading-[1.7] max-w-md mb-10">
                {t('footer.newsletterDesc')}
              </p>

              {/* Email input + Subscribe */}
              <div className="flex items-end gap-4 mb-4 max-w-md">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer.emailPlaceholder')}
                    data-testid="footer-email-input"
                    className="w-full bg-transparent text-white text-[14px] placeholder:text-white/30 pb-3 border-b border-white/25 focus:border-white/60 outline-none transition-colors duration-300"
                  />
                </div>
                <button
                  data-testid="footer-subscribe-btn"
                  className="group flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[13px] font-medium tracking-wide uppercase hover:bg-white/20 transition-all duration-300"
                >
                  {t('footer.subscribe')}
                  <span className="w-1.5 h-1.5 rounded-full bg-white group-hover:scale-125 transition-transform duration-300" />
                </button>
              </div>

              <p className="text-[12px] text-white/30 max-w-md">
                {t('footer.privacyNote')}{' '}
                <a href="#" className="text-white/50 underline underline-offset-2 hover:text-white/70 transition-colors duration-300">
                  {t('footer.privacyLink')}
                </a>
              </p>
            </motion.div>

            {/* Right: Sitemap */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                data-testid="footer-sitemap-label"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40 mb-8"
              >
                {t('footer.sitemap')}
              </p>

              <div className="grid grid-cols-2 gap-x-16 gap-y-5">
                <div className="flex flex-col gap-5">
                  {col1.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-[15px] text-white/70 hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
                <div className="flex flex-col gap-5">
                  {col2.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-[15px] text-white/70 hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Separator */}
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="h-px bg-white/10" />
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 lg:px-16 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

            {/* Left: Contact + Socials */}
            <div>
              <p className="text-[14px] text-white/50 mb-5">
                {t('footer.contactUs')}{' '}
                <a
                  href="mailto:contact@chutexcare.com"
                  data-testid="footer-contact-email"
                  className="text-white font-medium hover:text-white/80 transition-colors duration-300"
                >
                  contact@chutexcare.com
                </a>
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-4" data-testid="footer-social-icons">
                <a
                  href="https://www.instagram.com/chutex_innovation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-instagram"
                  className="text-white/40 hover:text-white transition-colors duration-300"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/people/Chutex-Innovation/61574765878865/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-facebook"
                  className="text-white/40 hover:text-white transition-colors duration-300"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-linkedin"
                  className="text-white/40 hover:text-white transition-colors duration-300"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-youtube"
                  className="text-white/40 hover:text-white transition-colors duration-300"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M164.44,121.34l-48-32A8,8,0,0,0,104,96v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,145.05V111l25.58,17ZM234.33,69.52a24,24,0,0,0-14.49-16.4C185.56,39.88,131,40,128,40s-57.56-.12-91.84,13.12a24,24,0,0,0-14.49,16.4C19.08,79.5,16,97.74,16,128s3.08,48.5,5.67,58.48a24,24,0,0,0,14.49,16.41C69,215.56,120.4,216,127.34,216h1.32c6.94,0,58.37-.44,91.18-13.11a24,24,0,0,0,14.49-16.41c2.59-10,5.67-28.22,5.67-58.48S236.92,79.5,234.33,69.52Zm-15.49,113a8,8,0,0,1-4.77,5.49c-31.65,12.22-85.48,12-86,12H128c-.54,0-54.33.2-86-12a8,8,0,0,1-4.77-5.49C34.8,173.39,32,156.57,32,128s2.8-45.39,5.16-54.47A8,8,0,0,1,41.93,68c30.52-11.79,81.66-12,85.85-12h.27c.54,0,54.38-.18,86,12a8,8,0,0,1,4.77,5.49C221.2,82.61,224,99.43,224,128S221.2,173.39,218.84,182.47Z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Center: Copyright */}
            <p data-testid="footer-copyright" className="text-[12px] text-white/30 order-last md:order-none">
              {t('footer.copyright')}
            </p>

            {/* Right: Payment methods */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/30 mb-3">
                {t('footer.securePayment')}
              </p>
              <div className="flex items-center gap-3 flex-wrap" data-testid="footer-payment-methods">
                {/* Visa */}
                <div className="h-7 px-2 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center" title="Visa">
                  <svg className="h-4" viewBox="0 0 48 16" fill="none">
                    <text x="0" y="13" fill="white" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="0.5">VISA</text>
                  </svg>
                </div>
                {/* Mastercard */}
                <div className="h-7 px-2 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center gap-0.5" title="Mastercard">
                  <svg className="h-5" viewBox="0 0 32 20" fill="none">
                    <circle cx="12" cy="10" r="7" fill="#EB001B" opacity="0.8" />
                    <circle cx="20" cy="10" r="7" fill="#F79E1B" opacity="0.8" />
                    <path d="M16 4.58a7 7 0 010 10.84 7 7 0 000-10.84z" fill="#FF5F00" opacity="0.9" />
                  </svg>
                </div>
                {/* PayPal */}
                <div className="h-7 px-2 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center" title="PayPal">
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">PayPal</span>
                </div>
                {/* Apple Pay */}
                <div className="h-7 px-2 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center" title="Apple Pay">
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">Apple Pay</span>
                </div>
                {/* Bancontact */}
                <div className="h-7 px-2 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center" title="Bancontact">
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">Bancontact</span>
                </div>
                {/* iDEAL */}
                <div className="h-7 px-2 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center" title="iDEAL">
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">iDEAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
