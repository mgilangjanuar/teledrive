import 'source-map-support/register'
require('dotenv').config({ path: '.env' })

import axios from 'axios'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// import compression from 'compression'
import { cURL } from 'curly-express'
import express, {
  json,
  NextFunction,
  raw,
  Request,
  Response,
  static as serveStatic,
  urlencoded
} from 'express'
import listEndpoints from 'express-list-endpoints'
import morgan from 'morgan'
import path from 'path'
import { serializeError } from 'serialize-error'
import serverless from 'serverless-http'
import { API } from './api'
import { Redis } from './service/Cache'
import { markdownSafe } from './utils/StringParser'

(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}


Redis.connect()

const curl = cURL({ attach: true })

const app = express()

app.set('trust proxy', 1)

app.use(cors({
  credentials: true,
  origin: [
    /.*/
  ]
}))
// app.use(compression())
app.use(json({ limit: '100mb' }))
app.use(urlencoded({ extended: true, limit: '100mb' }))
app.use(raw({ limit: '100mb' }))
app.use(cookieParser())
if (process.env.ENV !== 'production') {
  app.use(morgan('tiny'))
}
app.use(curl)

app.get('/ping', (_, res) => res.send({ pong: true }))
app.get('/security.txt', (_, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('Contact: security@teledriveapp.com\nPreferred-Languages: en, id')
})
app.use('/api', API)

// error handler
app.use(async (err: { status?: number, body?: Record<string, any> }, req: Request, res: Response, __: NextFunction) => {
  if (process.env.ENV !== 'production') {
    console.error(err)
  }
  if ((err.status || 500) >= 500) {
    if (process.env.TG_BOT_TOKEN && (process.env.TG_BOT_ERROR_REPORT_ID || process.env.TG_BOT_OWNER_ID)) {
      try {
        await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
          chat_id: process.env.TG_BOT_ERROR_REPORT_ID || process.env.TG_BOT_OWNER_ID,
          parse_mode: 'Markdown',
          text: `🔥 *${markdownSafe(err.body.error  || (err as any).message || 'Unknown error')}*\n\n\`[${err.status || 500}] ${markdownSafe(req.protocol + '://' + req.get('host') + req.originalUrl)}\`\n\n\`\`\`\n${JSON.stringify(serializeError(err), null, 2)}\n\`\`\`\n\n\`\`\`\n${req['_curl']}\n\`\`\``
        })
      } catch (error) {
        if (process.env.ENV !== 'production') {
          console.error(error)
        }
        // ignore
      }
    }
  }
  return res.status(err.status || 500).send(err.body || { error: 'Something error', details: serializeError(err) })
})

// serve web
app.use(serveStatic(path.join(__dirname, '..', '..', 'web', 'build')))
app.use((req: Request, res: Response) => {
  try {
    if (req.headers['accept'] !== 'application/json') {
      return res.sendFile(path.join(__dirname, '..', '..','web', 'build', 'index.html'))
    }
    return res.status(404).send({ error: 'Not found' })
  } catch (error) {
    return res.send({ empty: true })
  }
})

app.listen(process.env.PORT || 4000, () => console.log(`Running at :${process.env.PORT || 4000}...`))

console.log(listEndpoints(app))

module.exports = app
module.exports.handler = serverless(app)