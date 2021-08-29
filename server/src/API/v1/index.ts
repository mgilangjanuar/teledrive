import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from './Auth'

export const V1 = Router()
  .use(Endpoint.register(Auth))