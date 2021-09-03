import { Request, Response } from 'express'
import { Supabase } from '../../service/Supabase'
import { Endpoint } from '../base/Endpoint'
import { Waitings as Model } from '../../model/Waitings'

@Endpoint.API()
export class Waitings {

  @Endpoint.POST('/')
  public async create(req: Request, resp: Response): Promise<any> {
    const { email } = req.body
    const { data: waiting, error } = await Supabase.build().from<Model>('waitings').insert([{ email }])
    if (error) {
      throw { status: 400, body: { error: error.message, details: error } }
    }
    return resp.send({ waiting })
  }
}