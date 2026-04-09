import { motion } from 'framer-motion'
import { ArrowUpRight, Shield, Activity, Scale } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
}

export default function Products() {
  const { t } = useI18n()

  const products = [
    {
      key: 'elder',
      icon: Shield,
      image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
      large: true,
    },
    {
      key: 'elio',
      icon: Activity,
      image: 'https://chutex-innovation.com/cdn/shop/files/1_1.png?v=1752930380&width=1200',
      large: false,
    },
    {
      key: 'vita',
      icon: Scale,
      image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
      large: false,
    },
  ]

  return (
    <section id="products" data-testid="products-section" className="py-20 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold text-slate-500 mb-4"
        >
          {t('products.overline')}
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
          className="font-heading text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-12 md:mb-16"
        >
          {t('products.title')}{' '}
          <span className="text-primary">{t('products.titleHighlight')}</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {products.map((product, i) => {
            const Icon = product.icon
            const data = t(`products.${product.key}`)
            return (
              <motion.div
                key={product.key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                data-testid={`product-${product.key}-card`}
                className={`group relative border border-gray-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                  product.large ? 'md:col-span-8 md:row-span-2' : 'md:col-span-4'
                }`}
              >
                <div className={`relative ${product.large ? 'h-80 md:h-full min-h-[500px]' : 'h-64 md:h-72'}`}>
                  <img
                    src={product.image}
                    alt={data.name}
                    className="w-full h-full object-contain p-8"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-accent px-3 py-1 rounded-full mb-3">
                        {data.badge}
                      </span>
                      <h3 className="font-heading text-xl md:text-2xl font-medium text-slate-900">
                        {data.name}
                        <span className="text-slate-400 font-light ml-2">{data.type}</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={20} strokeWidth={2} />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed mb-4 max-w-md">
                    {data.desc}
                  </p>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-heading text-2xl md:text-3xl font-medium text-slate-900">
                        {data.price}
                      </span>
                      <span className="text-sm text-slate-400 ml-1">{data.unit}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary hover:underline">
                      {t('products.cta')} &rarr;
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
