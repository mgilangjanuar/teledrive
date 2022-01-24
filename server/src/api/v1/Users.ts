import { Api } from '@mgilangjanuar/telegram'
import axios from 'axios'
import { Request, Response } from 'express'
import moment from 'moment'
import { Files } from '../../model/entities/Files'
import { Usages } from '../../model/entities/Usages'
import { Users as Model } from '../../model/entities/Users'
import { Redis } from '../../service/Cache'
import { Midtrans, TransactionDetails } from '../../service/Midtrans'
import { PayPal, SubscriptionDetails } from '../../service/PayPal'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'
import { AuthKey } from '../middlewares/Key'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async search(req: Request, res: Response): Promise<any> {
    const { username, limit } = req.query
    if (!username) {
      throw {
        status: 400,
        body: {
          error: 'Username is required'
        }
      }
    }

    const data = await req.tg.invoke(
      new Api.contacts.Search(
        {
          q: username as string,
          limit: Number(limit) || 10
        }
      )
    )

    return res.send({ users: data.users })
  }

  @Endpoint.GET('/me/usage', { middlewares: [AuthMaybe] })
  public async usage(req: Request, res: Response): Promise<any> {
    const key = req.user ?
      `u:${req.user.id}` :
      `ip:${req.headers['cf-connecting-ip'] as string || req.ip}`

    let usage = await Usages.findOne(
      { where: { key } }
    )

    if (!usage) {
      usage = new Usages()

      usage.key = key

      usage.usage = '0'
      usage.expire = moment().add(1, 'day').toDate()

      await usage.save()
    }

    if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {  // is expired
      usage.expire = moment().add(1, 'day').toDate()
      usage.usage = '0'
      await usage.save()
    }

    return res.send({ usage })
  }

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, offset, limit, ...filters } = req.query

    const [users, length] = await Model.createQueryBuilder('users')
      .select('users.username')
      .where(buildWhereQuery(filters) || 'true')
      .skip(Number(offset) || undefined)
      .take(Number(limit) || undefined)
      .orderBy(
        buildSort(sort as string)
      )
      .getManyAndCount()

    return res.send({ users, length })
  }

  @Endpoint.PATCH('/me/settings', { middlewares: [Auth] })
  public async settings(req: Request, res: Response): Promise<any> {
    const { settings } = req.body

    if (
      settings.theme === 'dark' &&
      (!req.user.plan || req.user.plan === 'free') &&
      moment().format('l') !== '2/2/2022'
    ) {
      throw {
        status: 402,
        body: {
          error: 'You need to upgrade your plan to use dark theme'
        }
      }
    }

    req.user.settings = {
      ...req.user.settings || {},
      ...settings
    }

    await req.user.save()

    return res.send({ settings: req.user?.settings })
  }

  @Endpoint.POST('/me/delete', { middlewares: [Auth] })
  public async remove(req: Request, res: Response): Promise<any> {
    const { reason, agreement } = req.body

    if (agreement !== 'permanently removed') {
      throw {
        status: 400,
        body: {
          error: 'Invalid agreement'
        }
      }
    }

    if (reason) {
      await axios.post(
        // TODO keep those kind of endpoints in some kind of static file
        `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TG_BOT_OWNER_ID,
          text: `😭 ${req.user.name} (@${req.user.username}) removed their account.\n\nReason: ${reason}`
        }
      )
    }

    await Files.delete({ user_id: req.user.id })
    await req.user.remove()

    const success = await req.tg.invoke(new Api.auth.LogOut())

    return res
      .clearCookie('authorization')
      .clearCookie('refreshToken')
      .send({ success })
  }

  @Endpoint.POST('/me/paymentSync', { middlewares: [Auth] })
  public async paymentSync(req: Request, res: Response): Promise<any> {
    type Payment = {
      subscription_id?: string, midtrans_id?: string, plan?: string
    }

    // TODO make those tries with a recursive function or some kind of thing
    // that avoids rewriting this whole block every time

    let result: Payment = null
    try {
      const { data } = await axios.get<{ payment: Payment }>(
        `https://teledriveapp.com/api/v1/users/${req.user.tg_id}/payment`,
        {
          headers: {
            token: process.env.UTILS_API_KEY
          }
        }
      )

      // TODO maybe having some kind of enum for the plans is better?
      if (data.payment.plan && data.payment.plan !== 'free') {
        result = data.payment
      }
    } catch (ignored) {
      //
    }

    if (!result) {
      try {
        const { data } = await axios.get<{ payment: Payment }>(
          `https://us.teledriveapp.com/api/v1/users/${req.user.tg_id}/payment`,
          {
            headers: {
              token: process.env.UTILS_API_KEY
            }
          }
        )
        if (data.payment.plan && data.payment.plan !== 'free') {
          result = data.payment
        }
      } catch (ignored) {
        //
      }
    }

    if (!result) {
      try {
        const { data } = await axios.get<{ payment: Payment }>(
          `https://ge.teledriveapp.com/api/v1/users/${req.user.tg_id}/payment`,
          {
            headers: {
              token: process.env.UTILS_API_KEY
            }
          }
        )
        if (data.payment.plan && data.payment.plan !== 'free') {
          result = data.payment
        }
      } catch (ignored) {
        //
      }
    }

    if (result) {
      req.user.subscription_id = result?.subscription_id
      req.user.midtrans_id = result?.midtrans_id
      req.user.plan = result?.plan as any

      await req.user.save()
    }

    return res.status(202).send({ accepted: true })
  }

  @Endpoint.GET('/:tgId/payment', { middlewares: [AuthKey] })
  public async payment(req: Request, res: Response): Promise<any> {
    const { tgId } = req.params
    const user = await Model.findOne({ where: { tg_id: tgId } })

    if (!user) {
      throw {
        status: 404,
        body: {
          error: 'User not found'
        }
      }
    }

    return res.send(
      {
        payment: {
          subscription_id: user.subscription_id,
          midtrans_id: user.midtrans_id,
          plan: user.plan
        }
      }
    )
  }

  @Endpoint.GET('/:username/:param?', { middlewares: [Auth] })
  public async retrieve(
    req: Request,
    res: Response
  ): Promise<void | Response> {
    const { username, param } = req.params

    if (param === 'photo') {
      const file = await req.tg.downloadProfilePhoto(username, { isBig: false })

      if (!file?.length) {
        return res.redirect(
          'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
        )
      }

      res.setHeader(
        'Content-Disposition',
        `inline; filename=${username === 'me' ? req.user.username : username}.jpg`
      )
        .setHeader('Content-Type', 'image/jpeg')
        .setHeader('Content-Length', file.length)
        .write(file)

      return res.end()
    }

    if (['me', req.user.username].includes(username)) {
      const username = req.userAuth.username || req.userAuth.phone

      let paymentDetails: SubscriptionDetails = null
      let midtransPaymentDetails: TransactionDetails = null

      if (req.user.subscription_id) {
        try {
          paymentDetails = await Redis.connect()
            .getFromCacheFirst(
              `paypal:subscription:${req.user.subscription_id}`,
              async () =>
                await new PayPal().getSubscription(
                  req.user.subscription_id
                ),
              3
            )
        } catch (ignored) {
          //
        }
      }

      if (req.user.midtrans_id) {
        try {
          midtransPaymentDetails = await Redis.connect()
            .getFromCacheFirst(
              `midtrans:transaction:${req.user.midtrans_id}`,
              async () =>
                await new Midtrans().getTransactionStatus(
                  req.user.midtrans_id
                ),
              3
            )

          if (!midtransPaymentDetails?.transaction_status) {
            midtransPaymentDetails = null
          }
        } catch (ignored) {
          //
        }
      }

      let plan: 'free' | 'premium' = 'free'

      if (
        paymentDetails &&
        paymentDetails.plan_id === process.env.PAYPAL_PLAN_PREMIUM_ID
      ) {
        const isExpired =
          new Date().getTime() - new Date(
            paymentDetails.billing_info?.last_payment.time
          ).getTime() > 3.154e+10

        if (
          paymentDetails.billing_info?.last_payment &&
          !isExpired ||
          ['APPROVED', 'ACTIVE'].includes(paymentDetails.status)
        ) {
          plan = 'premium'
        }
      }

      if (
        midtransPaymentDetails &&
        (
          midtransPaymentDetails.settlement_time ||
          midtransPaymentDetails.transaction_time
        )
      ) {
        // TODO make isExpired into some kind of function
        const isExpired =
          new Date().getTime() - new Date(
            paymentDetails.billing_info?.last_payment.time
          ).getTime() > 3.154e+10

        if (
          ['settlement', 'capture'].includes(
            midtransPaymentDetails.transaction_status
          ) &&
          !isExpired
        ) {
          plan = 'premium'
        }
      }

      req.user.plan = plan
      req.user.username = username
      req.user.name =
        `${req.userAuth.firstName || ''} ${req.userAuth.lastName || ''}`
          .trim() || username

      await req.user.save()
      // await Model.update(req.user.id, {
      //   plan,
      //   ...username ? { username } : {},
      //   name: `${req.userAuth.firstName || ''} ${req.userAuth.lastName || ''}`.trim() || username,
      // })
    }

    const user =
      username === 'me' || username === req.user.username ?
        req.user :
        await Model.findOne(  // i'm not sure if this is right
          {
            where: [
              { username },
              { id: username }
            ]
          }
        )

    if (!user) {
      throw {
        status: 404,
        body: {
          error: 'User not found'
        }
      }
    }

    return res.send({ user })
  }

  // @Endpoint.USE('/upgradePlans', { middlewares: [Auth] })
  // public async upgradePlans(req: Request, res: Response): Promise<any> {
  //   if (req.user.username !== 'mgilangjanuar') {
  //     throw { status: 403, body: { error: 'Forbidden' } }
  //   }

  //   const { username, plan, expired } = req.query || req.body
  //   let user: any
  //   if (username && plan && expired) {
  //     user = await Model.createQueryBuilder('users')
  //       .where('users.username = :username', { username }).update().set({
  //         plan,
  //         plan_expired_at: moment().add(expired, 'months').toISOString()
  //       }).returning('*').execute()
  //   }

  //   await Model.createQueryBuilder('users')
  //     .where('users.plan_expired_at > :date', {
  //       date: moment().add(3, 'days').toISOString()
  //     }).update().set({
  //       plan: null
  //     }).execute()
  //   return res.send({ ok: true, ...user ? { user: user.raw?.[0] } : {} })
  // }
}
