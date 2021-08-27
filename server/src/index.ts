import 'source-map-support/register'
require('dotenv').config({ path: '.env' })

import cookieParser from 'cookie-parser'
import express, {
  json,
  NextFunction,
  raw,
  Request,
  Response,
  static as serveStatic,
  urlencoded
} from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import { API } from './API'

const app = express()
app.use(cors({
  credentials: true,
  origin: [
    /localhost:[0-9]{1,7}$/,
    /.*\.telebit\.io/,
    'teledrive.vercel.app'
  ]
}))
app.use(json())
app.use(urlencoded({ extended: true }))
app.use(raw())
app.use(cookieParser())
app.use(morgan('tiny'))

app.get('/ping', (_, res) => res.send({ pong: true }))
app.use('/api', API)

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

// error handler
app.use((err: { status?: number, body?: Record<string, any> }, _: Request, res: Response, __: NextFunction) => {
  return res.status(err.status || 500).send(err.body || { error: 'Something error' })
})

app.listen(process.env.PORT || 4000, () => console.log(`Running at :${process.env.PORT || 4000}...`))