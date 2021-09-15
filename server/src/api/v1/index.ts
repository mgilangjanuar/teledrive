import { Router } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from './Auth'
import { Documents } from './Documents'
import { Files } from './Files'
import { Github } from './GitHub'
import { Users } from './Users'
import { Waitings } from './Waitings'

export const V1 = Router()
  .use(Endpoint.register(Auth, Users, Waitings, Github, Files, Documents))