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
import morgan from 'morgan'
import path from 'path'
import { Pool } from 'pg'
import { RateLimiterPostgres } from 'rate-limiter-flexible'
import { serializeError } from 'serialize-error'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { API } from './api'
import { runDB } from './model'
import { Redis } from './service/Cache'

// import bigInt from 'json-bigint'
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

process.env.PORT = process.env.PORT || '4000'


Redis.connect()
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
  .use(Sentry.Handlers.tracingHandler())

  .set('trust proxy', 1)

  .use(cors({
    credentials: true,
    origin: [
      /.*/
    ]
  }))
  .use(compression())
  .use(json())
  .use(urlencoded({ extended: true }))
  .use(raw())
  .use(cookieParser())
  .use(morgan('tiny'))
// .use((req, _, next) => {
//   req['ip'] = req.headers['cf-connecting-ip'] as string || req.ip
//   return next()
// })

const rateLimiter = new RateLimiterPostgres(
  {
    storeClient: new Pool(
      {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || process.env.DB_USERNAME,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
      }
    ),
    points: Number(process.env.RPS) || 20,
    duration: 1,
    tableName: 'rate_limits',
    tableCreated: false
  }
)

app
  .get('/ping', (_, res) => res.send({ pong: true }))

  .get(
    '/security.txt',
    (_, res) => {
      res.setHeader('Content-Type', 'text/plain')
      res.send('Contact: mgilangjanuar+tdsecurity@gmail.com\nPreferred-Languages: en, id')
    }
  )

  .use(
    '/api',
    (req, res, next) => {
      rateLimiter.consume(req.headers['cf-connecting-ip'] as string || req.ip).then(() => next()).catch(error => {
        if (error.msBeforeNext) {
          return res.status(429).setHeader('retry-after', error.msBeforeNext).send({ error: 'Too many requests', retryAfter: error.msBeforeNext })
        }
        throw error
      })
    },
    API
  )

// error handler
  .use(Sentry.Handlers.errorHandler())

  .use(
    (
      err: { status?: number, body?: Record<string, any> },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      console.error(err)
      return res.status(err.status || 500).send(err.body || { error: 'Something error', details: serializeError(err) })
    }
  )

// serve web
  .use(serveStatic(path.join(__dirname, '..', '..', 'web', 'build')))

  .use((req: Request, res: Response) => {
    try {
      if (req.headers['accept'] !== 'application/json') {
        return res.sendFile(path.join(__dirname, '..', '..','web', 'build', 'index.html'))
      }
      return res.status(404).send({ error: 'Not found' })
    } catch (error) {
      return res.send({ empty: true })
    }
  })

  .listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}!`))

console.log(listEndpoints(app))
