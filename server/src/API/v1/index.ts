import { Router } from 'express'
import { Endpoints } from '../base/Endpoints'

const endpoints = new Endpoints(__dirname)

export const V1 = Router()
  .use(endpoints.run())