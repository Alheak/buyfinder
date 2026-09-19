import fs from 'node:fs'
import https from 'node:https'

export default async function downloadImage (url: string, folder: string = '/images/', filename: string = `${Date.now().toString()}.jpg`) {
  try {
    const filepath = (/^\//.test(folder) ? '/' : '') + folder + (/\/$/.test(folder) ? '/' : '') + filename
    const res = await https.get(url)

    await res.pipe(fs.createWriteStream('../../public' + filepath))

    return filepath
  } catch (error) {
    console.error('Something went wrong downloading the image', url, error)

    throw new Error('Error downloading the image')
  }
}
