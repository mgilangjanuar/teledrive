import axios from 'axios'
import { Request, Response } from 'express'
import { Redis } from '../../service/Cache'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class GitHub {

  @Endpoint.GET()
  public async contributors(_: Request, res: Response): Promise<any> {
    if (!process.env.GITHUB_TOKEN) {
      throw {
        status: 400,
        body: {
          error: 'GitHub PAT is unavailable'
        }
      }
    }

    const { data: collaborators } = await Redis.connect().getFromCacheFirst(
      'github:collaborators',
      async () => {
        return {
          data: (
            await axios.get(
              'https://api.github.com/repos/mgilangjanuar/teledrive/collaborators',
              {
                headers: {
                  authorization: `Bearer ${process.env.GITHUB_TOKEN}`
                }
              }
            )
          ).data
        }
      },
      21600
    )

    const { data: contributors } = await Redis.connect().getFromCacheFirst(
      'github:contributors',
      async () => {
        return {
          data: (
            await axios.get(
              'https://api.github.com/repos/mgilangjanuar/teledrive/contributors',
              {
                headers: {
                  authorization: `Bearer ${process.env.GITHUB_TOKEN}`
                }
              }
            )
          ).data
        }
      },
      21600
    )

    return res.send({
      contributors: [
        ...contributors,
        ...collaborators.filter(
          (col: any) =>
            !contributors.find((con: any) => con.login === col.login)
        )
      ]
    })
  }
}
