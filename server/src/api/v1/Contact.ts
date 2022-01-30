import axios from 'axios'
import { Request, Response } from 'express'
import { Users } from '../../model/entities/Users'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Contact {

  @Endpoint.POST()
  public async send(req: Request, res: Response): Promise<any> {
    const { email, from, message } = req.body
    const user = await Users.createQueryBuilder('users').select(['users.subscription_id', 'users.midtrans_id', 'users.plan']).where({ username: from }).getOne()
    await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TG_BOT_OWNER_ID,
      text: `🛎 @${from} wants to contact you!\n\n${message}\n\nfrom: \`${req.headers['cf-connecting-ip'] as string || req.ip}\`\nemail: \`${email}\`\ndomain: \`${req.headers['authority'] || req.headers.origin}\`${user ? `\nplan: ${user.plan}${user.subscription_id ? `\npaypal: ${user.subscription_id}` : ''}${user.midtrans_id ? `\nmidtrans: ${user.midtrans_id}` : ''}` : ''}`,
      parse_mode: 'Markdown'
    })
    return res.send({ success: true })
  }
}