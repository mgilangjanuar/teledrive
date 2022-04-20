import axios from 'axios'
import { Request, Response } from 'express'
import { prisma } from '../../model'
import { markdownSafe } from '../../utils/StringParser'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Contact {

  @Endpoint.POST()
  public async send(req: Request, res: Response): Promise<any> {
    const { email, from, message } = req.body
    const user = await prisma.users.findFirst({
      where: { username: from },
      select: {
        plan: true
      }
    })
    await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TG_BOT_OWNER_ID,
      text: `🛎 @${markdownSafe(from)} wants to contact you!\n\n${markdownSafe(message)}\n\nfrom: \`${markdownSafe(req.headers['cf-connecting-ip'] as string || req.ip)}\`\nemail: \`${markdownSafe(email)}\`\ndomain: \`${req.headers['authority'] || req.headers.origin}\`${user ? `\nplan: ${user?.plan}` : ''}`,
      parse_mode: 'Markdown'
    })
    return res.send({ success: true })
  }
}