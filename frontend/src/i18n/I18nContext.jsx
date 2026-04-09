import { createContext, useContext, useState, useEffect } from 'react'
import translations from './translations'

const I18nContext = createContext()

const LANG_MAP = {
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', CA: 'fr',
  US: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en', IN: 'en',
  DE: 'en', AT: 'en', ES: 'en', IT: 'en', PT: 'en', NL: 'en',
}

const CURRENCY_MAP = {
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', BE: 'EUR', NL: 'EUR', AT: 'EUR',
  PT: 'EUR', IE: 'EUR', LU: 'EUR', FI: 'EUR', MC: 'EUR',
  US: 'USD', GB: 'GBP', CH: 'CHF', CA: 'CAD', AU: 'AUD',
  SE: 'SEK', DK: 'DKK', NO: 'NOK', PL: 'PLN', CZ: 'CZK',
}

const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: 'CA$',
  AUD: 'A$', SEK: 'kr', DKK: 'kr', NOK: 'kr', PLN: 'zł', CZK: 'Kč',
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('fr')
  const [currency, setCurrency] = useState('EUR')
  const [country, setCountry] = useState('FR')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const browserLang = navigator.language?.split('-')[0]
    if (browserLang && translations[browserLang]) {
      setLang(browserLang)
    }

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const cc = data.country_code
        if (cc) {
          setCountry(cc)
          if (LANG_MAP[cc]) setLang(LANG_MAP[cc])
          if (CURRENCY_MAP[cc]) setCurrency(CURRENCY_MAP[cc])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[lang] || translations.fr
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  const formatPrice = (price) => {
    const symbol = CURRENCY_SYMBOLS[currency] || '€'
    return `${price}${symbol}`
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, currency, setCurrency, country, t, formatPrice, loading }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
