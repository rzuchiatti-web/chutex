import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

const WORDS_FR = ['La', 'santé', 'de', 'demain', 'est', 'portée', 'par', 'la', 'prévention,', 'pas', 'la', 'guérison.']
const WORDS_EN = ['Tomorrow\'s', 'health', 'is', 'driven', 'by', 'prevention,', 'not', 'cure.']

export default function ScrollText() {
  const { lang } = useI18n()
  const words = lang === 'fr' ? WORDS_FR : WORDS_EN
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.3'] })

  return (
    <section ref={ref} data-testid="scroll-text-section" className="relative py-32 md:py-48 bg-[#FAFAFA] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p className="font-heading text-[clamp(2rem,5vw,4.5rem)] font-light tracking-[-0.03em] leading-[1.15] text-center flex flex-wrap justify-center gap-x-[0.35em]">
          {words.map((word, i) => {
            const start = i / words.length
            const end = start + 1 / words.length
            return <Word key={i} word={word} range={[start, end]} progress={scrollYProgress} />
          })}
        </p>
      </div>
    </section>
  )
}

function Word({ word, range, progress }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  const y = useTransform(progress, range, [8, 0])
  return (
    <motion.span style={{ opacity, y }} className="inline-block text-slate-900 transition-colors">
      {word}
    </motion.span>
  )
}
