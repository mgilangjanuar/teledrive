import axios from 'axios'
import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Github {

  @Endpoint.GET()
  public async contributors(_: Request, res: Response): Promise<any> {
    if (!process.env.GITHUB_TOKEN) {
      throw { status: 400, body: { error: 'Token is unavailable' } }
    }
    const { data: contributors } = await axios.get('https://api.github.com/repos/mgilangjanuar/teledrive/contributors', {
      headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    })
    return res.send({ contributors })
  }
}
