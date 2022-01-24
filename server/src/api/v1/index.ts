import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from './Auth'
import { Contact } from './Contact'
import { Dialogs } from './Dialogs'
import { Documents } from './Documents'
import { Files } from './Files'
import { GitHub } from './GitHub'
import { Messages } from './Messages'
import { Subscriptions } from './Subscriptions'
import { Users } from './Users'
import { Utils } from './Utils'
import { Waitings } from './Waitings'

export const V1 = Router()
  .use(
    Endpoint.register(
      Auth,
      Users,
      Waitings,
      GitHub,
      Files,
      Dialogs,
      Messages,
      Documents,
      Contact,
      Subscriptions,
      Utils
    )
  )
