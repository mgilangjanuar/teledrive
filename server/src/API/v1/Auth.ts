import { Request, Response } from 'express'
import { Api } from 'telegram'
import { Users } from '../../model//entities/Users'
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
    return res.cookie('authorization', `Bearer ${session}`)
      .send({ phoneCodeHash, accessToken: session })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async reSendCode(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCodeHash } = req.body
    if (!phoneNumber || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Phone number and phone code hash are required' } }
    }

    await req.tg.connect()
    const { phoneCodeHash: newPhoneCodeHash } = await req.tg.invoke(new Api.auth.ResendCode({
      phoneNumber, phoneCodeHash }))
    const session = req.tg.session.save()
    return res.cookie('authorization', `Bearer ${session}`)
      .send({ phoneCodeHash: newPhoneCodeHash, accessToken: session })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async login(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCode, phoneCodeHash } = req.body
    if (!phoneNumber || !phoneCode || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Phone number, phone code, and phone code hash are required' } }
    }

    await req.tg.connect()
    const signIn = await req.tg.invoke(new Api.auth.SignIn({ phoneNumber, phoneCode, phoneCodeHash }))
    const user = signIn['user']
    await Users.insert([
      { username: user.username, name: `${user.firstName} ${user.lastName || ''}`.trim(), tg_id: user.id, tg_raw: user }
    ])

    const session = req.tg.session.save()
    return res.cookie('authorization', `Bearer ${session}`)
      .send({ user, accessToken: session })
  }

  @Endpoint.GET({ middlewares: [TGSessionAuth] })
  public async me(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const data = await req.tg.getMe()
    return res.send({ user: data })
  }
}