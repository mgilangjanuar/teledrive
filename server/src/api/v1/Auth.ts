import { Request, Response } from 'express'
import { Api } from 'telegram'
import { Users } from '../../model//entities/Users'
import { Waitings } from '../../model/entities/Waitings'
import { TG_CREDS } from '../../utils/Constant'
import { Endpoint } from '../base/Endpoint'
import { TGClient } from '../middlewares/TGClient'
import { TGSessionAuth } from '../middlewares/TGSessionAuth'

@Endpoint.API()
export class Auth {

  @Endpoint.POST({ middlewares: [TGClient] })
  public async sendCode(req: Request, res: Response): Promise<any> {
    const { token: id, phoneNumber } = req.body
    if (!id || !phoneNumber) {
      throw { status: 400, body: { error: 'Token and phone number are required' } }
    }

    const waiting = await Waitings.findOne({ id })
    if (!waiting) {
      throw { status: 400, body: { error: 'Invalid token' } }
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
    const { token: id, phoneNumber, phoneCodeHash } = req.body
    if (!id || !phoneNumber || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Token, phone number, and phone code hash are required' } }
    }

    const waiting = await Waitings.findOne({ id })
    if (!waiting) {
      throw { status: 400, body: { error: 'Invalid token' } }
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
    const { token: id, phoneNumber, phoneCode, phoneCodeHash } = req.body
    if (!id || !phoneNumber || !phoneCode || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Token, phone number, phone code, and phone code hash are required' } }
    }

    const waiting = await Waitings.findOne({ id })
    if (!waiting) {
      throw { status: 400, body: { error: 'Invalid token' } }
    }

    await req.tg.connect()
    const signIn = await req.tg.invoke(new Api.auth.SignIn({ phoneNumber, phoneCode, phoneCodeHash }))
    const user = signIn['user']
    if (!await Users.findOne({ tg_id: user.id })) {
      const username = user.username || user.phone || phoneNumber
      await Users.insert([{
        username,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || username,
        email: waiting.email,
        tg_id: user.id
      }])
    }

    const session = req.tg.session.save()
    return res.cookie('authorization', `Bearer ${session}`, { expires: new Date(Date.now() + 3.154e+12) })
      .send({ user, accessToken: session })
  }

  @Endpoint.GET({ middlewares: [TGSessionAuth] })
  public async me(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const data = await req.tg.getMe()
    return res.send({ user: data })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async logout(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const data = await req.tg.invoke(new Api.auth.LogOut())
    return res.clearCookie('authorization').send({ success: data })
  }
}