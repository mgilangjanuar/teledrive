import { Router } from 'express'
import { V1 } from './v1'

export const API = Router()
  .use('/v1', V1)