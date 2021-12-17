import 'source-map-support/register'
require('dotenv').config({ path: '.env' })

import cookieParser from 'cookie-parser'
import cors from 'cors'
import compression from 'compression'
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
// import bigInt from 'json-bigint'
import morgan from 'morgan'
import path from 'path'
import { Pool } from 'pg'
import { RateLimiterPostgres } from 'rate-limiter-flexible'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { API } from './api'
import { runDB } from './model'

// const parse = JSON.parse
// JSON.parse = str => {
//   if (!str) return str
//   try {
//     const res = bigInt({ storeAsString: true }).parse(str)
//     return parse(JSON.stringify(res))
//   } catch (error) {
//     console.error('FATAL JSON.parse:', str)
//     return parse(str)
//   }
// }

// const stringify = JSON.stringify
// JSON.stringify = str => {
//   if (!str) return str
//   try {
//     const res = bigInt({ storeAsString: true }).stringify(str)
//     return stringify(JSON.stringify(res))
//   } catch (error) {
//     console.error('FATAL JSON.stringify:', str)
//     return stringify(str)
//   }
// }


runDB()

const app = express()
Sentry.init({
  dsn: 'https://9b19fe16a45741798b87cfd3833822b2@o1062116.ingest.sentry.io/6052883',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
})

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

app.set('trust proxy', 1)

app.use(cors({
  credentials: true,
  origin: [
    /.*/
  ]
}))
app.use(compression())
app.use(json())
app.use(urlencoded({ extended: true }))
app.use(raw())
app.use(cookieParser())
app.use(morgan('tiny'))

const rateLimiter = new RateLimiterPostgres({
  storeClient: new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
  }),
  points: Number(process.env.RPS) || 20,
  duration: 1,
  tableName: 'rate_limits',
  tableCreated: false
})

app.get('/ping', (_, res) => res.send({ pong: true }))
app.get('/security.txt', (_, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('Contact: mgilangjanuar+tdsecurity@gmail.com\nPreferred-Languages: en, id')
})
app.use('/api', (req, res, next) => {
  rateLimiter.consume(req.ip).then(() => next()).catch(error => {
    if (error.msBeforeNext) {
      return res.status(429).setHeader('retry-after', error.msBeforeNext).send({ error: 'Too many requests' })
    }
    throw error
  })
}, API)

// error handler
app.use(Sentry.Handlers.errorHandler())
app.use((err: { status?: number, body?: Record<string, any> }, _: Request, res: Response, __: NextFunction) => {
  return res.status(err.status || 500).send(err.body || { error: 'Something error' })
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