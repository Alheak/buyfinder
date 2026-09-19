import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import 'chartjs-adapter-moment'
import DatePicker from "react-datepicker"
import LoadingSpinner from "../_utils/LoadingSpinner"
import { useCurrency } from "../../store/CurrencyContext"
import convertPrice from "../../mixins/convertPrice"
import { useToast } from "../../store/ToastContext"
import { Figure } from "../../types/Figure"
import { CoreChartOptions, DatasetChartOptions, ElementChartOptions, PluginChartOptions, ScaleChartOptions, LineControllerChartOptions } from "chart.js"
import { _DeepPartialObject } from "chart.js/types/utils"
import 'chart.js/auto'
import { shops } from "../../data/shopsClient"
import { DataPoint, PriceDatasets } from "../../types/Price"
import { Types } from "mongoose"
import Modal from "../_utils/Modal"
import CleanupDialog from "./CleanupDialog"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBroom } from "@fortawesome/free-solid-svg-icons"

import "react-datepicker/dist/react-datepicker.css"

interface Line {
  params: {
    _id: Types.ObjectId
    shop?: string
    scale?: number
    condition?: 'new' | 'used'
    from?: Date
    to?: Date
    percentile?: number
  }
  color?: string
  order?: number
  fill?: number
  borderWidth?: number
  pointRadius?: number
}

interface Lines {
  [key: string]: Line
}

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_MONTH = ONE_DAY * 30
const ONE_YEAR = ONE_DAY * 365

export default function PriceChart ({ figure }: { figure: Figure }) {
  const { data: session } = useSession()
  const { currency } = useCurrency()
  const { updateToast } = useToast()
  const [controllers, setControllers] = useState<AbortController[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRequestingCleanup, setIsRequestingCleanup] = useState(false)
  const [shop, setShop] = useState('all')
  const [datasets, setDatasets] = useState<PriceDatasets>({})
  const [to, setTo] = useState(Date.now())
  const [from, setFrom] = useState(to - 1000 * 60 * 60 * 24 * 365)
  const scale = useMemo(() => {
    const diff = Math.abs(to - from)

    if (diff <= ONE_MONTH) {
      return 1
    }

    if (diff <= ONE_YEAR) {
      return 10
    }

    return 30
  }, [to, from])

  const lines: Lines = {
    tenthPrice: {
      params: {
        _id: figure._id,
        shop: shop === 'all' ? undefined : shop,
        percentile: 10
      },
      color: 'rgba(0, 0, 0, 0.25)',
      fill: 1,
      borderWidth: 0,
      order: 5,
      pointRadius: 0
    },
    ninetiethPrice: {
      params: {
        _id: figure._id,
        shop: shop === 'all' ? undefined : shop,
        percentile: 90
      },
      color: 'rgba(0, 0, 0, 0.25)',
      fill: 1,
      borderWidth: 0,
      order: 4,
      pointRadius: 0
    },
    medianPriceUsed: {
      params: {
        _id: figure._id,
        shop: shop === 'all' ? undefined : shop,
        percentile: 50,
        condition: 'used'
      },
      color: 'rgb(202, 138, 4)',
      order: 2
    },
    medianPriceNew: {
      params: {
        _id: figure._id,
        shop: shop === 'all' ? undefined : shop,
        percentile: 50,
        condition: 'new'
      },
      color: 'rgb(2, 132, 199)',
      order: 1
    }
  }

  const earliestPriceTimestamp = Math.min(...Object.keys(datasets).filter(dataset => !!datasets[dataset][0]).map(dataset => new Date(datasets[dataset][0].x).getTime()))
  const data = {
    datasets: Object.keys(datasets).map((name, i) => {
      const line: Line = lines[name]
      const color = line.color
      const data = datasets[name].map(({ x, y: price }) => ({
        x,
        y: parseInt(convertPrice(price, 'JPY', currency)?.toFixed(0) || '0')
      }))

      return {
        label: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, (match, p1) => ` ${p1.toLowerCase()}`),
        data,
        borderColor: color,
        backgroundColor: color,
        tension: 0.2,
        fill: line.fill,
        borderWidth: line.borderWidth,
        order: line.order,
        pointRadius: line.pointRadius
      }
    }
  )}
  const containsData = !!data?.datasets.find(dataset => dataset.data.length)
  const options: _DeepPartialObject<CoreChartOptions<"line"> & ElementChartOptions<"line"> & PluginChartOptions<"line"> & DatasetChartOptions<"line"> & ScaleChartOptions<"line"> & LineControllerChartOptions> = {
    plugins: {
      title: {
        display: true,
        text: currency,
        align: 'start'
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          parser: 'YYYY-MM-DD',
          tooltipFormat: 'll',
          displayFormats: {
            'day': 'MM/DD',
            'week': 'MM/DD',
            'month': 'YY/MM'
          }
        },
        min: Math.min(earliestPriceTimestamp, from)
      },
      y: {
        ticks: {
          callback: (price: string | number) => {
            if (typeof price === 'string') price = parseInt(price)

            return price > 1000 ? `${price / 1000}k` : `${price}`
          }
        },
        beginAtZero: true
      }
    }
  }

  async function getDataset (line: string) {
    try {
      const controller = new AbortController
      const signal = controller.signal

      setControllers(prev => ([...prev, controller]))
      setIsLoading(true)

      const datasetRes = await fetch(`/api/prices/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...lines[line].params,
          from,
          to
        }),
        signal
      })

      if (!datasetRes.ok) throw new Error('Unable to load the price chart')

      const dataset = await datasetRes.json() as DataPoint[]

      return dataset
    } catch (error) {
      updateToast('Something went wrong trying to load the price chart.', 'error')

      return []
    } finally {
      setIsLoading(false)
      setControllers([])
    }
  }

  async function refreshDatasets () {
    const newDatasets: PriceDatasets = {}

    for (let i = 0; i < Object.keys(lines).length; i++) {
      const line = Object.keys(lines)[i]
      const dataset = await getDataset(line)

      newDatasets[line] = dataset
    }

    setDatasets(newDatasets)
  }

  useEffect(() => {
    refreshDatasets()

    return (() => { for (let i = 0; i < controllers.length; i++) controllers[i].abort() })
  }, [JSON.stringify(lines), from, to])

  return (
    <div className="flex flex-col">
      <select className="mt-2 p-1 rounded-md shadow-sm bg-zinc-50 dark:bg-zinc-700" name="ShopSelect" id="ShopSelect" value={shop} onChange={(e) => setShop(e.target.value)}>
        <option value="all">All shops</option>
        {
          Object.keys(shops).sort().map(shop => (
            <option key={shop} value={shop}>{shops[shop].name}</option>
          ))
        }
      </select>
      <div className="flex mt-2 gap-x-2">
        <div className="grow flex flex-wrap items-center gap-x-2">
          <label htmlFor="">From</label>
          <DatePicker className="grow p-1 rounded-md shadow-inner bg-zinc-50 dark:bg-zinc-700" selected={new Date(from)} dateFormat="YYYY/MM/dd" onChange={(date) => { if (date) setFrom(date.getTime()) }} />
        </div>
        <div className="grow flex flex-wrap items-center gap-x-2">
          <label htmlFor="">To</label>
          <DatePicker className="grow p-1 rounded-md shadow-inner bg-zinc-50 dark:bg-zinc-700" selected={new Date(to)} dateFormat="YYYY/MM/dd" onChange={(date) => { if (date) setTo(date.getTime()) }} />
        </div>
      </div>
      {
        isLoading ? (
          <div className="flex justify-center items-center p-4">
            <LoadingSpinner />
            <span className="ml-2">
              Calculating price points,<br />
              this could take a while...
            </span>
          </div>
        ) : (
          containsData ? (
            <Line
              datasetIdKey="Prices"
              data={data}
              options={options}
            />
          ) : (
            <div className="flex justify-center items-center p-4">
              <span>
                No prices found during the selected timeframe
              </span>
            </div>
          )
        )
      }
      {
        session?.user.admin && (
          <p className="py-1 text-xs text-right">
            <Link href={"/admin/listings/" + figure._id.toString()}>
              <FontAwesomeIcon icon={faBroom} />
              <span className="ml-1">
                Clean listings
              </span>
            </Link>
          </p>
        )
      }
      {
        (!session?.user.admin && containsData) && (
          <p className="py-1 text-xs text-right">
            <a href="#" onClick={() => setIsRequestingCleanup(true)}>Chart doesn&apos;t look right?</a>
          </p>
        )
      }
      {
        isRequestingCleanup && (
          <Modal title="Request data clean-up" onClose={() => setIsRequestingCleanup(false)}>
            <CleanupDialog figure={figure} close={() => setIsRequestingCleanup(false)} />
          </Modal>
        )
      }
    </div>
  )
}
