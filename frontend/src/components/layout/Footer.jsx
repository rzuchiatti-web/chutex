import { useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

const FOOTER_BG = 'https://images.unsplash.com/photo-1774799560672-151b971fd336?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=2000'

/* ── SVG payment brand marks ── */
const VisaIcon = () => (
  <svg viewBox="0 0 780 500" className="h-5 w-auto" fill="none">
    <path d="M293.2 348.73l33.36-195.76h53.34l-33.38 195.76H293.2zm246.11-191.54c-10.57-3.98-27.14-8.22-47.83-8.22-52.73 0-89.87 26.6-90.16 64.67-.28 28.16 26.5 43.86 46.75 53.23 20.77 9.58 27.75 15.71 27.67 24.28-.14 13.12-16.59 19.12-31.93 19.12-21.37 0-32.7-2.97-50.24-10.28l-6.88-3.12-7.49 43.95c12.47 5.48 35.53 10.23 59.49 10.47 56.07 0 92.47-26.27 92.87-66.94.2-22.3-14.01-39.27-44.78-53.27-18.64-9.07-30.06-15.12-29.95-24.29 0-8.14 9.66-16.85 30.55-16.85 17.43-.28 30.07 3.54 39.91 7.51l4.78 2.26 7.24-42.51h-.01z" fill="white"/>
    <path d="M651.84 153h-41.23c-12.77 0-22.33 3.49-27.95 16.27l-79.29 179.49h56.05s9.16-24.14 11.24-29.45l68.33.08c1.6 6.87 6.49 29.37 6.49 29.37h49.53l-43.17-195.76zm-65.58 126.41c4.41-11.28 21.26-54.71 21.26-54.71-.32.52 4.38-11.33 7.07-18.69l3.6 16.89 12.35 56.51h-44.28z" fill="white"/>
    <path d="M247.16 153l-52.24 133.5-5.59-27.13c-9.72-31.27-39.99-65.15-73.88-82.12l47.78 171.38 56.44-.06 83.97-195.57h-56.48z" fill="white"/>
    <path d="M146.92 152.96H60.88l-.68 3.97c66.94 16.21 111.23 55.39 129.56 102.44l-18.69-89.96c-3.23-12.39-12.59-16.1-24.15-16.45z" fill="#F9A533"/>
  </svg>
)

const MastercardIcon = () => (
  <svg viewBox="0 0 32 20" className="h-5 w-auto" fill="none">
    <circle cx="11" cy="10" r="8" fill="#EB001B" opacity="0.9" />
    <circle cx="21" cy="10" r="8" fill="#F79E1B" opacity="0.9" />
    <path d="M16 3.36a8 8 0 010 13.28 8 8 0 000-13.28z" fill="#FF5F00" />
  </svg>
)

const PaypalIcon = () => (
  <svg viewBox="0 0 100 28" className="h-4 w-auto" fill="none">
    <path d="M13.4 3.8h-9C3.7 3.8 3 4.4 2.9 5.1L.4 20.8c-.1.5.3.9.8.9h4.3c.7 0 1.3-.5 1.4-1.2l.7-4.2c.1-.7.7-1.2 1.4-1.2h3.2c6.6 0 10.5-3.2 11.5-9.5.4-2.7 0-4.9-1.4-6.4C20.9 4.7 17.7 3.8 13.4 3.8z" fill="#27346A" opacity="0.85"/>
    <path d="M38.4 3.8h-9c-.7 0-1.3.5-1.4 1.2L25.5 20.8c-.1.5.3.9.8.9h4.6c.5 0 .9-.3 1-0.8l.7-4.7c.1-.7.7-1.2 1.4-1.2h3.2c6.6 0 10.5-3.2 11.5-9.5.4-2.7 0-4.9-1.4-6.4C45.9 4.7 42.7 3.8 38.4 3.8z" fill="#2790C3" opacity="0.85"/>
    <text x="55" y="18" fill="white" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif" opacity="0.8">Pay</text>
  </svg>
)

const ApplePayIcon = () => (
  <svg viewBox="0 0 50 20" className="h-4 w-auto" fill="none">
    <path d="M9.2 2.9c-.6.7-1.5 1.3-2.5 1.2-.1-1 .4-2 .9-2.7C8.2.7 9.3.1 10.2 0c.1 1.1-.3 2.1-.9 2.9zM10.2 4.2c-1.4-.1-2.5.8-3.2.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2.1 1 0 1.4-.7 2.6-.7 1.2 0 1.5.7 2.6.6 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.2-3.2 0-2 1.6-2.9 1.7-3-1-1.4-2.4-1.6-2.9-1.6h.4z" fill="white" opacity="0.9"/>
    <text x="15" y="15" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif" opacity="0.8">Pay</text>
  </svg>
)

const BancontactIcon = () => (
  <svg viewBox="0 0 40 16" className="h-4 w-auto" fill="none">
    <rect x="0" y="0" width="16" height="16" rx="3" fill="#005498" opacity="0.9"/>
    <rect x="4" y="4" width="8" height="3" rx="1" fill="white" opacity="0.9"/>
    <rect x="4" y="9" width="8" height="3" rx="1" fill="#FFD800" opacity="0.9"/>
    <text x="19" y="12" fill="white" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif" opacity="0.7">BC</text>
  </svg>
)

const IdealIcon = () => (
  <svg viewBox="0 0 40 16" className="h-4 w-auto" fill="none">
    <rect x="0" y="0" width="16" height="16" rx="3" fill="#CC0066" opacity="0.9"/>
    <circle cx="8" cy="5" r="2.5" fill="white" opacity="0.9"/>
    <rect x="4" y="9" width="8" height="4" rx="1" fill="white" opacity="0.9"/>
    <text x="19" y="12" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif" opacity="0.7">iDEAL</text>
  </svg>
)

export default function Footer() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')

  const colSolutions = [
    { label: t('nav.elio'), href: '/produits/elio' },
    { label: t('nav.vita'), href: '/produits/vita' },
    { label: t('nav.elder'), href: '/produits/elder' },
    { label: t('nav.teleassistance'), href: '/teleassistance' },
    { label: t('footer.accessories'), href: '/produits/accessoires' },
    { label: t('footer.theApp'), href: '/application' },
  ]

  const colPro = [
    { label: t('footer.saad'), href: '/professionnels/saad' },
    { label: t('footer.coach'), href: '/professionnels/coach' },
    { label: t('footer.kine'), href: '/professionnels/kine' },
    { label: t('footer.distributor'), href: '/devenir-distributeur' },
  ]

  const colResources = [
    { label: t('footer.blog'), href: '/blog' },
    { label: t('footer.faq'), href: '/faq' },
    { label: t('footer.about'), href: '/a-propos' },
    { label: t('footer.contact'), href: '/contact' },
    { label: t('footer.orderTracking'), href: '/suivi-commande' },
    { label: t('footer.myAccount'), href: '/mon-compte' },
  ]

  const colLegal = [
    { label: t('footer.terms'), href: '/cgv' },
    { label: t('footer.privacy'), href: '/confidentialite' },
    { label: t('footer.mentions'), href: '/mentions-legales' },
    { label: t('footer.cookies'), href: '/cookies' },
  ]

  const footerCols = [
    { title: t('footer.solutions'), links: colSolutions },
    { title: t('footer.professionals'), links: colPro },
    { title: t('footer.resources'), links: colResources },
    { title: t('footer.legal'), links: colLegal },
  ]

  return (
    <footer data-testid="main-footer" className="relative overflow-hidden bg-white">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={FOOTER_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a1a1f]/60" />
      </div>

      {/* Curved separator */}
      <div className="relative z-10">
        <svg viewBox="0 0 1514 80" className="w-full block" preserveAspectRatio="none" style={{ marginBottom: '-1px' }}>
          <path d="M0 80V0h1514v80C1514 80 1214 30 757 30S0 80 0 80Z" fill="white" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Top section: Newsletter + App Store | Sitemap columns */}
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-10 md:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-20">

            {/* Left: Newsletter + App buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2
                data-testid="footer-newsletter-title"
                className="text-[clamp(2.2rem,5vw,3.8rem)] font-light text-white leading-[1.1] tracking-[-0.03em] mb-6"
              >
                {t('footer.newsletterTitle').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </h2>

              <p className="text-[14px] md:text-[15px] text-white/50 leading-[1.7] max-w-md mb-10">
                {t('footer.newsletterDesc')}
              </p>

              {/* Email input */}
              <div className="flex items-end gap-4 mb-4 max-w-md">
                <div className="flex-1">
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

              <p className="text-[12px] text-white/30 max-w-md mb-12">
                {t('footer.privacyNote')}{' '}
                <a href="/confidentialite" className="text-white/50 underline underline-offset-2 hover:text-white/70 transition-colors duration-300">
                  {t('footer.privacyLink')}
                </a>
              </p>

              {/* App Store buttons */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
                  {t('footer.downloadApp')}
                </p>
                <div className="flex items-center gap-3" data-testid="footer-app-buttons">
                  <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity duration-300">
                    <img
                      src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                      alt="App Store"
                      className="h-10 w-auto"
                    />
                  </a>
                  <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity duration-300">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                      alt="Google Play"
                      className="h-10 w-auto"
                    />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right: 4-column Sitemap */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
                {footerCols.map((col) => (
                  <div key={col.title}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40 mb-6">
                      {col.title}
                    </p>
                    <div className="flex flex-col gap-4">
                      {col.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="text-[14px] text-white/60 hover:text-white transition-colors duration-300"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
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

            {/* Left: Logo + Contact + Socials */}
            <div>
              <img src="/images/logo_white.png" alt="Chutex Care" className="h-10 w-auto mb-5 brightness-0 invert" data-testid="footer-logo" />
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
              <div className="flex items-center gap-4" data-testid="footer-social-icons">
                {[
                  { href: 'https://www.instagram.com/chutex_innovation/', label: 'Instagram', tid: 'footer-instagram', d: 'M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z' },
                  { href: 'https://www.facebook.com/people/Chutex-Innovation/61574765878865/', label: 'Facebook', tid: 'footer-facebook', d: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z' },
                  { href: 'https://www.linkedin.com/', label: 'LinkedIn', tid: 'footer-linkedin', d: 'M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z' },
                  { href: 'https://www.youtube.com/', label: 'YouTube', tid: 'footer-youtube', d: 'M164.44,121.34l-48-32A8,8,0,0,0,104,96v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,145.05V111l25.58,17ZM234.33,69.52a24,24,0,0,0-14.49-16.4C185.56,39.88,131,40,128,40s-57.56-.12-91.84,13.12a24,24,0,0,0-14.49,16.4C19.08,79.5,16,97.74,16,128s3.08,48.5,5.67,58.48a24,24,0,0,0,14.49,16.41C69,215.56,120.4,216,127.34,216h1.32c6.94,0,58.37-.44,91.18-13.11a24,24,0,0,0,14.49-16.41c2.59-10,5.67-28.22,5.67-58.48S236.92,79.5,234.33,69.52Zm-15.49,113a8,8,0,0,1-4.77,5.49c-31.65,12.22-85.48,12-86,12H128c-.54,0-54.33.2-86-12a8,8,0,0,1-4.77-5.49C34.8,173.39,32,156.57,32,128s2.8-45.39,5.16-54.47A8,8,0,0,1,41.93,68c30.52-11.79,81.66-12,85.85-12h.27c.54,0,54.38-.18,86,12a8,8,0,0,1,4.77,5.49C221.2,82.61,224,99.43,224,128S221.2,173.39,218.84,182.47Z' },
                ].map(({ href, label, tid, d }) => (
                  <a key={tid} href={href} target="_blank" rel="noopener noreferrer" data-testid={tid}
                    className="text-white/40 hover:text-white transition-colors duration-300" aria-label={label}>
                    <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor"><path d={d} /></svg>
                  </a>
                ))}
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
              <div className="flex items-center gap-2.5 flex-wrap" data-testid="footer-payment-methods">
                <div className="h-8 px-2.5 rounded-md bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center" title="Visa">
                  <VisaIcon />
                </div>
                <div className="h-8 px-2.5 rounded-md bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center" title="Mastercard">
                  <MastercardIcon />
                </div>
                <div className="h-8 px-2.5 rounded-md bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center" title="PayPal">
                  <PaypalIcon />
                </div>
                <div className="h-8 px-2.5 rounded-md bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center" title="Apple Pay">
                  <ApplePayIcon />
                </div>
                <div className="h-8 px-2.5 rounded-md bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center" title="Bancontact">
                  <BancontactIcon />
                </div>
                <div className="h-8 px-2.5 rounded-md bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center" title="iDEAL">
                  <IdealIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
