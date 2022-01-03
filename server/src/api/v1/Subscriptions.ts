import { Request, Response } from 'express'
import uuid from 'uuid-random'
import { Users } from '../../model/entities/Users'
import { Midtrans } from '../../service/Midtrans'
import { PayPal } from '../../service/PayPal'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Subscriptions {

  @Endpoint.POST('/', { middlewares: [Auth] })
  public async create(req: Request, res: Response): Promise<any> {
    if (req.query.provider === 'midtrans') {
      if (req.user.midtrans_id) {
        try {
          const result = await new Midtrans().getTransactionStatus(req.user.midtrans_id)
          const isExpired = new Date().getTime() - new Date(result.settlement_time || result.transaction_time).getTime() > 3.154e+10
          if (['settlement', 'capture'].includes(result.transaction_status) && !isExpired) {
            return res.send({ link: '/dashboard' })
          }
        } catch (error) {
          // ignore
        }
      }

      req.user.midtrans_id = `premium-${uuid()}`
      if (req.body.email) {
        req.user.email = req.body.email
      }
      await req.user.save()
      const result = await new Midtrans().getPaymentLink(req.user, 144_000)
      return res.send({ link: result.redirect_url })
    }

    if (req.user.subscription_id) {
      try {
        const result = await new PayPal().getSubscription(req.user.subscription_id)
        const link = result.links.find(link => link.rel === 'approve')?.href
        return res.send({ link: link || '/dashboard' })
      } catch (error) {
        // ignore
      }
    }

    const result = await new PayPal().createSubscription(req.user)
    await Users.update(req.user.id, { subscription_id: result.id })
    return res.send({ link: result.links.find(link => link.rel === 'approve').href })
  }
}