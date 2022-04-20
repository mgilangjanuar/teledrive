import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Subscriptions {

  @Endpoint.POST('/', { middlewares: [Auth] })
  public async create(_req: Request, _res: Response): Promise<any> {
    throw { status: 500, body: { error: 'Not implemented' } }
    //   if (req.query.provider === 'midtrans') {
    //     if (req.user.midtrans_id) {
    //       try {
    //         const result = await new Midtrans().getTransactionStatus(req.user.midtrans_id)
    //         const isExpired = new Date().getTime() - new Date(result.settlement_time || result.transaction_time).getTime() > 3.154e+10
    //         if (['settlement', 'capture'].includes(result.transaction_status) && !isExpired) {
    //           return res.send({ link: '/dashboard' })
    //         }
    //       } catch (error) {
    //         // ignore
    //       }
    //     }

    //     req.user.midtrans_id = `premium-${uuid()}`
    //     if (req.body.email) {
    //       req.user.email = req.body.email
    //     }
    //     await prisma.users.update({
    //       where: { id: req.user.id },
    //       data: req.user
    //     })
    //     await Redis.connect().del(`auth:${req.authKey}`)
    //     const result = await new Midtrans().getPaymentLink(req.user, 144_000)
    //     return res.send({ link: result.redirect_url })
    //   }

    //   if (req.user.subscription_id) {
    //     try {
    //       const result = await new PayPal().getSubscription(req.user.subscription_id)
    //       const link = result.links.find(link => link.rel === 'approve')?.href
    //       return res.send({ link: link || '/dashboard' })
    //     } catch (error) {
    //       // ignore
    //     }
    //   }

  //   const result = await new PayPal().createSubscription(req.user)
  //   await prisma.users.update({
  //     where: { id: req.user.id },
  //     data: { subscription_id: result.id }
  //   })
  //   await Redis.connect().del(`auth:${req.authKey}`)
  //   return res.send({ link: result.links.find(link => link.rel === 'approve').href })
  }
}