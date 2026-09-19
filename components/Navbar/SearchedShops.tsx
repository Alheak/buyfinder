import { useState } from 'react'
import countries from 'i18n-iso-countries'
import * as flags from 'country-flag-icons/react/3x2'
import { useShops } from "../../store/ShopsContext"
import { shops } from '../../data/shopsClient'

countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

interface Region {
  name: string
  countries: string[]
}

export default function SearchedShops ({ fullWidth }: { fullWidth?: boolean }) {
  const { disabledShops, updateShops } = useShops()
  const [regionFrom, setRegionFrom] = useState('all')
  const [countryTo, setCountryTo] = useState('all')
  const REGIONS: {[key: string]: Region} = {
    'namerica': {
      name: 'North America',
      countries: ['CA', 'US', 'MX']
    },
    'europe': {
      name: 'Europe',
      countries: ['GB', 'FR', 'BE', 'DE', 'ES', 'IT', 'PT', 'EU']
    },
    'asia': {
      name: 'Asia',
      countries: ['JP', 'CN', 'HK', 'KR']
    },
    'oceania': {
      name: 'Oceania',
      countries: ['AU', 'NZ']
    }
  }

  const countryCodes = countries.getNames('en', { select: 'official' })
  const shopsCountryCodes = Object.keys(shops).map(shop => shops[shop].country).filter((country, index, countriesArray) => countriesArray.indexOf(country) === index).sort()

  function toggleShop (shop: string | null) {
    let newDisabledShops: string[] = []

    if (shop) {
      const index = disabledShops.indexOf(shop)

      newDisabledShops = index > -1 ? disabledShops.filter(disabledShop => disabledShop !== shop) : [...disabledShops, shop]
    } else if (disabledShops.length === 0) {
      newDisabledShops = Object.keys(shops)
    }

    updateShops(newDisabledShops)
  }

  function toggleRegionFrom (region: string) {
    if (region === 'all') {
      toggleShop(null)
    } else {
      const countriesArray = [...(REGIONS[region]?.countries || [region])]
      const shopsNotFromCountries = Object.keys(shops).filter(shop => !countriesArray.includes(shops[shop].country))

      updateShops(shopsNotFromCountries)
    }

    setRegionFrom(region)
  }

  function toggleCountryTo (country: string) {
    if (country === 'all') {
      toggleShop(null)
    } else {
      const shopsNotToCountry = Object.keys(shops).filter(shop => (shops[shop].isDomesticOnly && shops[shop].country !== country) || !(!shops[shop].canShipTo || (shops[shop].canShipTo || []).includes(country)))

      updateShops(shopsNotToCountry)
    }

    setCountryTo(country)
  }

  function getFlagComponent (shop: string) {
    const shopInfo = shops[shop]
    const Flag = flags[shopInfo.country?.toUpperCase() as keyof typeof flags]
    const countryName = shopInfo.country ? countries.getName(shopInfo.country, 'en') : ''

    return (
      <Flag title={countryName} className="inline-block h-3 border border-zinc-800 rounded-sm" />
    )
  }

  return (
    <div className={`${fullWidth ? 'w-full' : 'max-w-lg'} p-4`}>
      <div className="flex text-xl">
        <input type="checkbox" name="all-shops" checked={disabledShops.length === 0} onChange={() => toggleShop(null)} />
        <label className="ml-2 cursor-pointer" htmlFor="all-shops" onClick={() => toggleShop(null)}>
          <span>All</span>
        </label>
      </div>
      <hr className="my-2 border-zinc-400 dark:border-zinc-700" />
      <div className="flex flex-wrap w-full gap-4">
        <div className="flex-grow flex flex-col mb-2">
          <label className="mr-2" htmlFor="fromCountry">From</label>
          <select className="p-2 rounded-md shadow-md transition-colors bg-white dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600 cursor-pointer" name="fromCountry" id="fromCountry" value={regionFrom} onChange={(e) => toggleRegionFrom(e.target.value)}>
            <option key="all" value="all">All</option>
            <optgroup key="regions" label="Regions">
              {
                Object.keys(REGIONS).map((region: string) => (
                  <option key={region} value={region}>{REGIONS[region].name}</option>
                ))
              }
            </optgroup>
            <optgroup key="countries" label="Countries">
              {
                shopsCountryCodes.map(code => (
                  <option key={code} value={code}>{code === 'global' ? 'Global' : countryCodes[code]}</option>
                ))
              }
            </optgroup>
          </select>
        </div>
        <div className="flex-grow flex flex-col mb-2">
          <label className="mr-2" htmlFor="toCountry">To</label>
          <select className="p-2 rounded-md shadow-md transition-colors bg-white dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600 cursor-pointer" name="toCountry" id="toCountry" value={countryTo} onChange={(e) => toggleCountryTo(e.target.value)}>
            <option key="all" value="all">All</option>
            {
              Object.keys(countryCodes).map(code => (
                <option key={code} value={code}>{countryCodes[code]}</option>
              ))
            }
          </select>
        </div>
      </div>
      <div className="flex flex-col">
        {
          Object.keys(shops).sort().map(shop => (
            <div key={shop} className="flex flex-row items-center my-2 mr-4 gap-2">
              <input type="checkbox" name={shop} checked={!disabledShops.includes(shop)} onChange={() => toggleShop(shop)} />
              <label className="flex flex-row items-center w-full cursor-pointer gap-2" htmlFor={shop} onClick={() => toggleShop(shop)}>
                {
                  (shops[shop].country && shops[shop].country !== 'global') && (
                    <span>
                      { getFlagComponent(shop) }
                    </span>
                  )
                }
                <span>{shops[shop].name}</span>
                <span className="italic text-xs text-zinc-600 dark:text-zinc-400">{shops[shop].url.replace(/http(s)?\:\/\/(www\.)?/, '')}</span>
              </label>
            </div>
          ))
        }
      </div>
    </div>
  )
}
