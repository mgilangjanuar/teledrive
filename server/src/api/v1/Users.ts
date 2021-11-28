import { Api } from '@mgilangjanuar/telegram'
import { Request, Response } from 'express'
import moment from 'moment'
import { Usages } from '../../model/entities/Usages'
import { Users as Model } from '../../model/entities/Users'
import { PayPal, SubscriptionDetails } from '../../service/PayPal'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async search(req: Request, res: Response): Promise<any> {
    const { username, limit } = req.query
    if (!username) {
      throw { status: 400, body: { error: 'Username is required' } }
    }
    const data = await req.tg.invoke(new Api.contacts.Search({
      q: username as string,
      limit: Number(limit) || 10
    }))
    return res.send({ users: data.users })
  }

  @Endpoint.GET('/me/usage', { middlewares: [AuthMaybe] })
  public async usage(req: Request, res: Response): Promise<any> {
    let usage = await Usages.findOne({ where: { key: req.user ? `u:${req.user.id}` : `ip:${req.ip}` } })
    if (!usage) {
      usage = new Usages()
      usage.key = req.user ? `u:${req.user.id}` : `ip:${req.ip}`
      usage.usage = 0
      usage.expire = moment().add(1, 'day').toDate()
      await usage.save()
    }

    if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {   // is expired
      usage.expire = moment().add(1, 'day').toDate()
      usage.usage = 0
      await usage.save()
    }

    return res.send({ usage })
  }

  @Endpoint.GET('/:username/:param?', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { username, param } = req.params
    if (param === 'photo') {
      const file = await req.tg.downloadProfilePhoto(username, { isBig: false })
      if (!file?.length) {
        return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')
      }
      res.setHeader('Content-Disposition', `inline; filename=${username === 'me' ? req.user.username : username}.jpg`)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', file.length)
      res.write(file)
      return res.end()
    }

    if (username === 'me' || username === req.user.username) {
      const username = req.userAuth.username || req.userAuth.phone
      let paymentDetails: SubscriptionDetails = null
      if (req.user.subscription_id) {
        try {
          paymentDetails = await new PayPal().getSubscription(req.user.subscription_id)
        } catch (error) {
          // ignore
        }
      }

      let plan: 'free' | 'premium' = 'free'
      if (paymentDetails && paymentDetails.plan_id === process.env.PAYPAL_PLAN_PREMIUM_ID) {
        const isExpired = paymentDetails.billing_info?.last_payment && new Date().getTime() - new Date(paymentDetails.billing_info.last_payment.time).getTime() > 3.154e+10
        if (paymentDetails.status === 'APPROVED' || paymentDetails.status === 'ACTIVE' || !isExpired) {
          plan = 'premium'
        }
      }
      await Model.update(req.user.id, {
        plan,
        ...username ? { username } : {},
        name: `${req.userAuth.firstName || ''} ${req.userAuth.lastName || ''}`.trim() || username,
      })
    }

    const user = await Model.findOne({ where: [
      { username: username === 'me' ? req.user.username : username },
      { id: username === 'me' ? req.user.id : username }] })
    if (!user) {
      throw { status: 404, body: { error: 'User not found' } }
    }

    return res.send({ user })
  }

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, offset, limit, ...filters } = req.query
    const [users, length] = await Model.createQueryBuilder('users')
      .select('users.username')
      .where(buildWhereQuery(filters) || 'true')
      .skip(Number(offset) || undefined)
      .take(Number(limit) || undefined)
      .orderBy(buildSort(sort as string))
      .getManyAndCount()
    return res.send({ users, length })
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