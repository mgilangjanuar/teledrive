import { Request, Response } from 'express'
import { serializeError } from 'serialize-error'
import { Api } from 'telegram'
import { TG_CREDS } from '../../utils/Constant'
import { Endpoint } from '../base/Endpoint'
import { TGClient } from '../middlewares/TGClient'
import { TGSessionAuth } from '../middlewares/TGSessionAuth'

@Endpoint.API()
export class Auth {

  @Endpoint.POST({ middlewares: [TGClient] })
  public async sendCode(req: Request, res: Response): Promise<any> {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      throw { status: 400, body: { error: 'Phone number is required' } }
    }

    await req.tg.connect()
    const { phoneCodeHash } = await req.tg.invoke(new Api.auth.SendCode({
      ...TG_CREDS,
      phoneNumber,
      settings: new Api.CodeSettings({
        allowFlashcall: true,
        currentNumber: true,
        allowAppHash: true,
      })
    }))
    const session = req.tg.session.save()
    return res.cookie('authorization', `Bearer ${session}`).send({ phoneCodeHash: phoneCodeHash, accessToken: session })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async login(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCode, phoneCodeHash } = req.body
    if (!phoneNumber || !phoneCode || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Phone number, phone code, and phone code hash are required' } }
    }

    await req.tg.connect()
    const signIn = await req.tg.invoke(new Api.auth.SignIn({ phoneNumber, phoneCode, phoneCodeHash }))
    console.log(signIn)
    // TODO: save user data to db

    const session = req.tg.session.save()
    return res.cookie('authorization', `Bearer ${session}`).send({ user: signIn['user'], accessToken: session })
  }

  @Endpoint.GET({ middlewares: [TGSessionAuth] })
  public async me(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const data = await req.tg.getMe()
    return res.send({ user: data })
  }
}