import type { ShopsClient } from '../types/Shops'

export const shops: ShopsClient = {
  amiami: {
    name: "AmiAmi",
    url: "https://www.amiami.com",
    currency: "JPY",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  amiamijp: {
    name: "AmiAmi JP",
    url: "https://slist.amiami.jp",
    isDomesticOnly: true,
    currency: "JPY",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  rakuten: {
    name: "Rakuten",
    url: "https://search.rakuten.co.jp",
    country: "JP",
    currency: "JPY",
    isDomesticOnly: true,
    isAccurate: false,
    bootlegWarning: true,
    restockPotential: true,
    searchByJAN: true
  },
  tom: {
    name: "Tokyo Otaku Mode",
    url: "https://otakumode.com",
    currency: "USD",
    country: "US",
    shippingWarning: true,
    isAccurate: false,
    searchByJAN: false
  },
  mandarake: {
    name: "Mandarake",
    url: "https://order.mandarake.co.jp",
    currency: "JPY",
    country: "JP",
    isAccurate: false,
    siteIsBrokenNotice: 'Site has a bug where some people cannot access the website. Try visiting this url first to fix it: https://ekizo.mandarake.co.jp/auction/item/indexEn.html',
    restockPotential: true,
    searchByJAN: false
  },
  lashinbang: {
    name: "Lashinbang",
    url: "https://shop.lashinbang.com",
    currency: "JPY",
    country: "JP",
    isDomesticOnly: true,
    restockPotential: true,
    searchByJAN: true
  },
  hobbysearch: {
    name: "Hobby Search",
    url: "https://1999.co.jp",
    currency: "JPY",
    country: "JP",
    searchByJAN: true
  },
  hobbylinkjapan: {
    name: "Hobby Link Japan",
    url: "https://www.hlj.com",
    currency: "JPY",
    country: "JP",
    exchangeRatesWarning: true,
    searchByJAN: true
  },
  biginjapan: {
    name: "Big In Japan",
    url: "https://www.biginjap.com",
    currency: "JPY",
    country: "JP",
    searchByJAN: true
  },
  mfc: {
    name: "MyFigureCollection",
    url: "https://myfigurecollection.net",
    currency: "USD",
    country: "global",
    restockPotential: true,
    accountWarning: true,
    nsfwBlock: true,
    searchByJAN: true
  },
  goodsmileshop: {
    name: "Good Smile Shop",
    url: "https://goodsmileshop.com",
    currency: "JPY",
    country: "JP",
    isAccurate: false,
    stockStatusWarning: true,
    searchByJAN: false
  },
  goodsmileshopus: {
    name: "Good Smile Shop US",
    url: "https://www.goodsmileus.com",
    currency: "USD",
    country: "US",
    canShipTo: ["US", "CA"],
    isAccurate: false,
    searchByJAN: true
  },
  goodsmileshopeu: {
    name: "Good Smile Shop EU",
    url: "https://goodsmile-europe.com",
    currency: "EUR",
    country: "EU",
    canShipTo: ["EU"],
    // inStockWishlistWarning: true,
    // isAccurate: false,
    searchByJAN: true
  },
  kotobukiya: {
    name: "Kotobukiya",
    url: "https://shop.kotobukiya.co.jp",
    country: "JP",
    currency: "JPY",
    isDomesticOnly: true,
    searchByJAN: true
  },
  aniplex: {
    name: "Aniplex+",
    url: "https://www.aniplexplus.com",
    currency: "JPY",
    country: "JP",
    isDomesticOnly: true,
    searchByJAN: false
  },
  native: {
    name: "Native Store",
    url: "https://native-store.net",
    currency: "JPY",
    country: "JP",
    searchByJAN: false
  },
  cdjapan: {
    name: "CDJapan",
    url: "https://www.cdjapan.co.jp",
    currency: "JPY",
    country: "JP",
    searchByJAN: true
  },
  // playasia: {
  //   name: "Play-Asia",
  //   url: "https://www.play-asia.com",
  //   currency: "JPY",
  //   country: "HK",
  //   locationPriceWarning: true,
  //   searchByJAN: true
  // },
  solarisjapan: {
    name: "Solaris Japan",
    url: "https://solarisjapan.com",
    currency: "USD",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  jfigure: {
    name: "JFigure",
    url: "https://www.jfigure.com/",
    currency: "JPY",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  ninoma: {
    name: "Ninoma",
    url: "https://ninoma.com",
    currency: "JPY",
    country: "JP",
    isAccurate: false,
    searchByJAN: true
  },
  ninningame: {
    name: "Nin Nin Game",
    url: "https://www.nin-nin-game.com",
    currency: "JPY",
    country: "JP",
    exchangeRatesWarning: true,
    restockPotential: true,
    searchByJAN: true
  },
  hobbygenki: {
    name: "Hobby Genki",
    url: "https://hobby-genki.com",
    currency: "JPY",
    country: "JP",
    exchangeRatesWarning: true,
    searchByJAN: true
  },
  animate: {
    name: "Animate",
    url: "https://www.animate.shop",
    currency: "JPY",
    country: "JP",
    isAccurate: false,
    searchByJAN: true
  },
  animatejp: {
    name: "Animate Japan",
    url: "https://www.animate-onlineshop.jp",
    currency: "JPY",
    country: "JP",
    canShipTo: ["JP"],
    searchByJAN: true
  },
  animateus: {
    name: "Animate USA",
    url: "https://animateusaonlineshop.com",
    currency: "USD",
    country: "US",
    canShipTo: ["US", "CA"],
    searchByJAN: true
  },
  ixudeviance: {
    name: "iXu Deviance",
    url: "https://www.ixudeviance.com",
    currency: "EUR",
    country: "FR",
    isAccurate: false,
    searchByJAN: true
  },
  surugaya: {
    name: "Suruga-Ya Japan",
    url: "https://www.suruga-ya.jp",
    currency: "JPY",
    country: "JP",
    canShipTo: ["JP"],
    restockPotential: true,
    searchByJAN: true
  },
  surugayaen: {
    name: "Suruga-Ya Global",
    url: "https://www.suruga-ya.com",
    currency: "JPY",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  // japamo: {
  //   name: "Japamo",
  //   url: "https://japamo.com",
  //   currency: "USD",
  //   country: "JP",
  //   restockPotential: true
  // },
  akibasoul: {
    name: "Akiba Soul",
    url: "https://www.akibasoul.com",
    currency: "USD",
    country: "US",
    restockPotential: true,
    searchByJAN: true
  },
  okiniland: {
    name: "Okini Land",
    url: "https://okini.land",
    currency: "USD",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  crunchyroll: {
    name: "Crunchyroll",
    url: "https://store.crunchyroll.com",
    currency: "USD",
    country: "US",
    searchByJAN: true
  },
  akibahobby: {
    name: "Akiba Hobby",
    url: "https://shop.akbh.jp",
    currency: "JPY",
    country: "JP",
    exchangeRatesWarning: true,
    restockPotential: true,
    searchByJAN: true
  },
  amazonjp: {
    name: "Amazon Japan",
    url: "https://www.amazon.co.jp",
    currency: "JPY",
    country: "JP",
    bootlegWarning: true,
    shippingWarning: true,
    restockPotential: true,
    reportShopOnly: true,
    searchByJAN: true
  },
  amazonus: {
    name: "Amazon US",
    url: "https://www.amazon.com",
    currency: "USD",
    country: "US",
    bootlegWarning: true,
    shippingWarning: true,
    restockPotential: true,
    reportShopOnly: true,
    searchByJAN: true
  },
  hobbybee: {
    name: "Hobby Bee",
    url: "https://hobby-bee.com",
    currency: "CAD",
    country: "CA",
    searchByJAN: true
  },
  nekonokoe: {
    name: "Neko no Koe",
    url: "https://www.nekonokoeshop.com",
    currency: "EUR",
    country: "IT",
    searchByJAN: true
  },
  // otakuplanete: {
  //   name: "Otaku-Planète",
  //   url: "https://www.otaku-planete.com",
  //   currency: "EUR",
  //   country: "FR",
  //   searchByJAN: true
  // },
  // animegamieu: {
  //   name: "Animegami EU",
  //   url: "https://animegami.eu",
  //   country: "PT",
  //   currency: "EUR"
  // },
  // animegamiuk: {
  //   name: "Animegami UK",
  //   url: "https://animegami.co.uk",
  //   country: "GB",
  //   currency: "GBP"
  // },
  archonia: {
    name: "Archonia",
    url: "https://www.archonia.com",
    country: "BE",
    currency: "EUR",
    searchByJAN: true
  },
  // lacitedesnuages: {
  //   name: "La Cité des Nuages",
  //   url: "https://www.lacitedesnuages.be",
  //   country: "BE",
  //   currency: "EUR",
  //   searchByJAN: true
  // },
  mecchajapan: {
    name: "Meccha Japan",
    url: "https://meccha-japan.com",
    country: "JP",
    currency: "JPY",
    locationPriceWarning: true,
    searchByJAN: true
  },
  plazajapan: {
    name: "Plaza Japan",
    url: "https://www.plazajapan.com",
    currency: "JPY",
    country: "JP",
    searchByJAN: true
  },
  jungle: {
    name: "Jungle",
    url: "https://jungle-scs-ensale.com",
    currency: "JPY",
    country: "JP",
    restockPotential: true,
    searchByJAN: true
  },
  animenpc: {
    name: "Anime NPC",
    url: "https://animenpc.com",
    currency: "USD",
    country: "JP",
    isAccurate: false,
    searchByJAN: false
  },
  // animeexport: {
  //   name: "Anime Export",
  //   url: "https://www.anime-export.com",
  //   currency: "JPY",
  //   country: "JP",
  //   isAccurate: false
  // },
  animota: {
    name: "animota",
    url: "https://animota.net",
    currency: "JPY",
    country: "JP",
    restockPotential: true,
    isAccurate: false,
    exchangeRatesWarning: true,
    searchByJAN: true
  },
  figuya: {
    name: "Figuya",
    url: "https://figuya.com",
    country: "DE",
    currency: "EUR",
    // isAccurate: false,
    searchByJAN: true
  },
  yorokonde: {
    name: "Yorokonde",
    url: "https://www.yorokonde.de",
    country: "DE",
    currency: "EUR",
    isAccurate: false,
    searchByJAN: false
  },
  bigbadtoystore: {
    name: "Big Bad Toy Store",
    url: "https://www.bigbadtoystore.com",
    country: "US",
    currency: "USD",
    isAccurate: false,
    searchByJAN: false
  },
  // globalfreaks: {
  //   name: "Global Freaks",
  //   url: "https://www.global-freaks.com",
  //   country: "ES",
  //   currency: "EUR",
  //   locationPriceWarning: true
  // },
  // kyodaietaniki: {
  //   name: "Kyodai & Aniki",
  //   url: "https://www.kyodai-et-aniki.com",
  //   country: "FR",
  //   currency: "EUR",
  //   isAccurate: false
  // },
  sugotoys: {
    name: "Sugotoys",
    url: "https://sugotoys.com.au",
    country: "AU",
    currency: "AUD",
    isAccurate: true,
    searchByJAN: true
  },
  akimomo: {
    name: "Aki Momo",
    url: "https://akimomo.com",
    country: "AU",
    currency: "AUD",
    isAccurate: false,
    searchByJAN: true
  },
  // animecornerstore: {
  //   name: "The Anime Corner Store",
  //   url: "https://www.animecornerstore.com",
  //   country: "US",
  //   currency: "USD",
  //   isAccurate: true
  // },
  // animecornerstorepreowned: {
  //   name: "The Anime Corner Store Pre-Owned",
  //   url: "https://www.animecornerstore.com/prowbanfi.html",
  //   country: "US",
  //   currency: "USD",
  //   isAccurate: true
  // },
  yja: {
    name: "Yahoo! JAPAN Auction",
    url: "https://auctions.yahoo.co.jp",
    country: "JP",
    isDomesticOnly: true,
    currency: "JPY",
    isAccurate: false,
    bootlegWarning: true,
    restockPotential: true,
    searchByJAN: false
  },
  mercari: {
    name: "Mercari Japan",
    url: "https://jp.mercari.com",
    country: "JP",
    currency: "JPY",
    isDomesticOnly: true,
    isAccurate: false,
    bootlegWarning: true,
    restockPotential: true,
    searchByJAN: false
  },
  ebay: {
    name: "eBay",
    url: "https://www.ebay.com",
    country: "global",
    currency: "USD",
    bootlegWarning: true,
    restockPotential: true,
    searchByJAN: true
  },
  booth: {
    name: "BOOTH",
    url: "https://booth.pm",
    country: "JP",
    currency: "JPY",
    isAccurate: false,
    restockPotential: true,
    searchByJAN: false
  },
  tsoto: {
    name: "Tsoto.net",
    url: "https://tsoto.net",
    country: "DE",
    currency: "EUR",
    isAccurate: true,
    restockPotential: false,
    searchByJAN: true
  },
  achoonya: {
    name: "Achoon-ya",
    url: "https://achoon-ya.com",
    country: "JP",
    currency: "USD",
    isAccurate: true,
    restockPotential: false,
    searchByJAN: true
  },
  kappahobby: {
    name: "Kappa Hobby",
    url: "https://kappahobby.com",
    country: "US",
    currency: "USD",
    isAccurate: true,
    restockPotential: false,
    searchByJAN: true
  }
}
