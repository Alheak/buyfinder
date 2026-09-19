import { Client, ClientOptions } from '@elastic/elasticsearch'
import * as fs from 'node:fs'
import dotenv from 'dotenv'

dotenv.config()

const options: ClientOptions = {
  node: process.env.ELASTICSEARCH_NODE
}

if (process.env.ELASTICSEARCH_USER) {
  options.auth = {
    username: process.env.ELASTICSEARCH_USER,
    password: process.env.ELASTICSEARCH_PASSWORD || ''
  }
  options.tls = {
    // ca: fs.readFileSync('./http_ca.crt'),
    rejectUnauthorized: false
  }
}

const client = new Client(options)

export default client
