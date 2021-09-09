import { Request, Response } from 'express'
import multer from 'multer'
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
        mime_type: mimeType,
        size,
        user_id: req.user.id,
        uploaded_at: new Date(chat.date * 1000),
        type
      }
    }))
  }

  @Endpoint.GET({ middlewares: [Auth] })
  public async test(req: Request, res: Response): Promise<any> {
    const chat = await req.tg.invoke(new Api.messages.GetMessages({ id: [241255 as any] }))

    let cancelled = false
    req.on('close', () => cancelled = true)

    const size = 28261
    res.setHeader('Content-disposition', 'attachment; filename=ttest.png')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', size)
    let data = null
    const oneMB = 512 * 1024
    let page = 0
    while (!cancelled && (data === null || data.length && page * oneMB < size)) {
      data = await req.tg.downloadMedia(chat['messages'][0].media, {
        start: page++ * oneMB,
        end: size < page * oneMB - 1 ? size : page * oneMB - 1,
        workers: 15,
        progressCallback: console.log
      } as any)
      res.write(data)
    }
    res.end()
  }

  @Endpoint.POST({ middlewares: [Auth, multer().single('upload')] })
  public async test1(req: Request, res: Response): Promise<any> {
    let saved: Model
    const file = req.file
    if (req.query.cancel) {
      const { affected } = await Model.delete(req.query.cancel as string)
      if (!affected) {
        throw { status: 404, body: { error: 'File not found' } }
      }
      return res.status(202).send({ accepted: true, file: { id: req.query.cancel } })
    } else if (file) {
      let type = null
      if (file.mimetype.match(/^image/gi)) {
        type = 'image'
      } else if (file.mimetype.match(/^video/gi)) {
        type = 'video'
      } else if (file.mimetype.match(/pdf$/gi)) {
        type = 'document'
      }

      saved = new Model()
      saved.name = file.originalname,
      saved.mime_type = file.mimetype
      saved.size = file.size
      saved.user_id = req.user.id
      saved.type = type
      await saved.save()
      res.status(202).send({ accepted: true, file: { id: req.query.cancel || saved.id } })

      let isUpdateProgress = true
      let cancel = false
      const updateProgress = () => {
        const updateProgess: any = async (progress: number) => {
          if (isUpdateProgress) {
            const { affected } = await Model.update(saved.id, { upload_progress: progress }, { reload: true })
            if (affected) {
              isUpdateProgress = false
              setTimeout(() => isUpdateProgress = true, 2000)
            } else {
              cancel = true
            }
          }
          updateProgess.isCanceled = cancel
        }
        return updateProgess
      }

      let data: any
      try {
        data = await req.tg.sendFile('me', {
          file: file.buffer,
          fileSize: file.size,
          attributes: [
            new Api.DocumentAttributeFilename({ fileName: file.originalname })
          ],
          progressCallback: updateProgress(),
          workers: 15
        })

        await Model.update(saved.id, { message_id: data.id, updated_at: new Date(data.date * 1000) })
      } catch (error) {
        await Model.delete(saved.id)
      }

    } else {
      throw { status: 400, body: { error: 'Upload file is required' } }
    }
  }
}