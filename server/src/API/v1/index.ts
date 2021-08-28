import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'

export const V1 = Router()
  .use(Endpoint.register(__dirname))