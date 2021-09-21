import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from './Auth'
import { Contact } from './Contact'
import { Documents } from './Documents'
import { Files } from './Files'
import { Github } from './GitHub'
import { Messages } from './Messages'
import { Users } from './Users'
import { Waitings } from './Waitings'

export const V1 = Router()
  .use(
    Endpoint.register(
      Auth,
      Users,
      Waitings,
      Github,
      Files,
      Messages,
      Documents,
      Contact
    )
  )
