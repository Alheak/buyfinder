import { LaunchOptions } from "rebrowser-puppeteer"
import dotenv from 'dotenv'

dotenv.config()

const width = `12${Math.floor(70 * Math.random()) + 10}`
const height = `6${Math.floor(90 * Math.random()) + 10}`

// console.log(`Browser window size: ${width}x${height}`)

const browserOptions: LaunchOptions = {
  handleSIGINT: false,
  defaultViewport: null,
  executablePath: process.env.PUPPETEER_BROWSER_PATH,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--disable-dev-mode',
    '--disable-debug-mode',
    '--no-zygote',
    '--no-first-run',
    // '--enable-gpu',
    // '--use-gl=angle',
    // '--use-angle=gl-egl',
    // '--ignore-gpu-blocklist',
    `--window-size=${width},${height}`
  ],
  // headless: false
}

export default browserOptions
