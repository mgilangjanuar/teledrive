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
import { API } from './api'
import { runDB } from './model'

runDB()

const app = express()
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
  points: Number(process.env.RPS) || 7,
  duration: 1,
  tableName: 'rate_limits',
  tableCreated: true
})
app.use((req, res, next) => {
  rateLimiter.consume(req.ip).then(() => next()).catch(error => {
    return res.status(429).setHeader('retry-after', error.msBeforeNext).send({ error: 'Too many requests' })
  })
})

app.get('/ping', (_, res) => res.send({ pong: true }))
app.use('/api', API)

// error handler
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