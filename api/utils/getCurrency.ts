interface CurrencyIdentifiers {
  [key: string]: string[]
}

const currencies: CurrencyIdentifiers = {
  AUD: [
    'aud',
    'ａｕｄ',
    '$A',
    'A$',
    'AU$',
    'AUD$',
    '＄A',
    'A＄',
    'AU＄',
    'AUD＄',
    'aus dollar',
    'australian dollar'
  ],
  CAD: [
    'cad',
    'ｃａｄ',
    'can',
    '$C',
    'C$',
    'CA$',
    'CAD$',
    '＄C',
    'C＄',
    'CA＄',
    'CAD＄',
    'ca dollar',
    'can dollar',
    'canadian dollar'
  ],
  HKD: [
    'hkd',
    'ｈｋｄ',
    '$HK',
    'HK$',
    '＄HK',
    'HK＄',
    'hk dollar',
    'hong kong dollar'
  ],
  SGD: [
    'sgd',
    'ｓｇｄ',
    'SG$',
    '$SG',
    '＄SG',
    'SG＄',
    'sg dollar',
    'singapore dollar'
  ],
  TWD: [
    'twd',
    'ｔｗｄ',
    'TW$',
    '$TW',
    'TW＄',
    '＄TW',
    'tw dollar',
    'taiwan dollar'
  ],
  USD: [
    'usd',
    'ｕｓｄ',
    'US$',
    'USD$',
    '$',
    '＄',
    'dollar'
  ],
  EUR: [
    'eur',
    'ｅｕｒ',
    '€'
  ],
  CNY: [
    'cny',
    'ｃｎｙ',
    'cn¥',
    'cn￥',
    '¥cn',
    '￥cn',
    'yuan'
  ],
  JPY: [
    'jpy',
    'ｊｐｙ',
    '¥',
    '￥',
    '円',
    'yen'
  ],
  GBP: [
    'gbp',
    'ｇｂｐ',
    '£',
    '￡',
    'pound'
  ],
  KRW: [
    'krw',
    'ｋｒｗ',
    '원',
    '₩',
    'won'
  ],
  MXN: [
    'mxn',
    'mexp',
    'mxp',
    'ｍｘｎ',
    'mxn$',
    'Mex$',
    'peso'
  ],
  ZAR: [
    'sar',
    'zar',
    'rand',
    'south african rand'
  ],
  RSD: [
    'rsd',
    'serbian dinar',
    'dinar',
    'din'
  ]
}

export default function getCurrency(price: string, currency: string = 'JPY') {
  price = price.replaceAll(/\s/g, '').toLowerCase()

  for (let iso in currencies) {
    const identifiers = currencies[iso]

    for (let i = 0; i < identifiers.length; i++) {
      const identifier = identifiers[i].replaceAll(/\s/g, '').toLowerCase()

      if (price.indexOf(identifier) !== -1) return iso.toUpperCase()
    }
  }

  return currency.toUpperCase()
}
