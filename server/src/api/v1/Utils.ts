import { Request, Response } from 'express'
import { readFileSync } from 'fs'
import { lookup } from 'geoip-lite'
import { Files } from '../../model/entities/Files'
import { Users } from '../../model/entities/Users'
import { Redis } from '../../service/Cache'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Utils {

  @Endpoint.GET()
  public async maintenance(_: Request, res: Response): Promise<any> {
    return res.send({ maintenance: ['1', 'true', 'yes'].includes(process.env.IS_MAINTENANCE) })
  }

  @Endpoint.GET()
  public async ipinfo(req: Request, res: Response): Promise<any> {
    return res.send({ ipinfo: { ip: req.headers['cf-connecting-ip'] as string || req.ip, ...lookup(req.headers['cf-connecting-ip'] as string || req.ip) } })
  }

  @Endpoint.GET()
  public async version(_: Request, res: Response): Promise<any> {
    return res.send({ version: JSON.parse(readFileSync(`${__dirname}/../../../package.json`, 'utf8')).version })
  }

  @Endpoint.GET()
  public async simpleAnalytics(_: Request, res: Response): Promise<any> {
    const analytics = await Redis.connect().getFromCacheFirst('simpleAnalytics', async () => {
      return {
        users: await Users.count(),
        files: await Files.count(),
        premiumUsers: await Users.count({ where: { plan: 'premium' } }),
      }
    }, 86400)
    return res.send({ analytics })
  }
}