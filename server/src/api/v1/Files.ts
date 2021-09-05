import { Request, Response } from 'express'
import { Api } from 'telegram'
import { Files as Model } from '../../model/entities/Files'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Files {

  @Endpoint.POST({ middlewares: [Auth] })
  public async sync(req: Request, res: Response): Promise<any> {
    res.status(202).send({ accepted: true })

    const getData = async (offsetId?: number, messages?: any[]): Promise<any[]> => {
      const data = await req.tg.invoke(new Api.messages.GetHistory({
        peer: 'me',
        limit: 10,
        ...offsetId ? { offsetId } : {}
      }))

      const merged = [...messages || [], ...data['messages']]
      const lastDate = merged?.[merged?.length - 1]?.date ? new Date(merged[merged.length - 1].date * 1000) : null

      // get last 3 month messages
      if (lastDate && lastDate.getTime() > new Date().getTime() - 90 * 86400_000) {
        return await getData(merged[merged?.length - 1].id, merged)
      }
      return merged
    }

    // cleaning data
    const data = await getData()
    const filteredData = data?.filter(chat => chat.media?.document || chat.media?.photo)
    const existingData = filteredData?.length ? await Model.createQueryBuilder('files')
      .where('message_id in (:...ids)', { ids: filteredData.map(data => data.id) }).getMany() : null
    const excludeIds = existingData?.map(data => data.message_id) || []
    const insertedData = existingData ? filteredData.filter(data => {
      return !excludeIds.includes(data.id.toString())
    }) : filteredData

    // storing
    await Model.insert(insertedData?.map(chat => {
      const mimeType = chat.media.photo ? 'image/jpeg' : chat.media.document.mimeType || 'unknown'
      const name = chat.media.photo ? `${chat.media.photo.id}.jpg` : chat.media.document.attributes?.find((atr: any) => atr.fileName)?.fileName || `untitled.${mimeType.split('/').pop()}`

      const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size
      const size = chat.media.photo ? getSizes(chat.media.photo.sizes.pop()) : chat.media.document?.size
      let type = chat.media.photo ? 'image' : null
      if (!type) {
        if (chat.media.document.mimeType.match(/^video/gi)) {
          type = 'video'
        } else if (chat.media.document.mimeType.match(/pdf$/gi)) {
          type = 'document'
        }
      }

      return {
        name,
        message_id: chat.id,
        path: '/',
        mime_type: mimeType,
        size,
        media: chat.media,
        user_id: req.user.id,
        uploaded_at: new Date(chat.date * 1000),
        type
      }
    }))
  }
}