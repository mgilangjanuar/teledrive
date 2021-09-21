import axios from 'axios'
import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Contact {

  @Endpoint.POST()
  public async send(req: Request, res: Response): Promise<any> {
    const { from, message } = req.body
    await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TG_BOT_OWNER_ID,
      text: `From: @${from}\n\n${message}`
    })
    return res.send({ success: true })
  }
}