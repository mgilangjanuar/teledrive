import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from './Auth'
import { Config } from './Config'
import { Dialogs } from './Dialogs'
import { Files } from './Files'
import { Messages } from './Messages'
import { Users } from './Users'
import { Utils } from './Utils'

export const V1 = Router()
  .use(
    Endpoint.register(
      Auth,
      Users,
      Files,
      Dialogs,
      Messages,
      Utils,
      Config
    )
  )
