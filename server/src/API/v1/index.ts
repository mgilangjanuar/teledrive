import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from './Auth'
import { Users } from './Users'

export const V1 = Router()
  .use(Endpoint.register(Auth, Users))