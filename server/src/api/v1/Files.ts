import { Request, Response } from 'express'
import { sign, verify } from 'jsonwebtoken'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { Api, TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { getRepository } from 'typeorm'
import { Files as Model } from '../../model/entities/Files'
import { Links } from '../../model/entities/Links'
import { TG_CREDS } from '../../utils/Constant'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Files {

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, skip, take, ...filters } = req.query
    const [files, length] = await Model.createQueryBuilder('files')
      .where('files.user_id = :user_id', { user_id: req.user.id })
      .andWhere(buildWhereQuery(filters) || 'true')
      .skip(Number(skip) || undefined)
      .take(Number(take) || undefined)
      .orderBy(buildSort(sort as string))
      .getManyAndCount()
    return res.send({ files, length })
  }

  @Endpoint.POST('/', { middlewares: [Auth] })
  public async save(req: Request, res: Response): Promise<any> {
    const { file } = req.body
    if (!file) {
      throw { status: 400, body: { error: 'File is required in body.' } }
    }
    const { raw } = await Model.createQueryBuilder('files').insert().values(file).returning('*').execute()
    return res.send({ file: raw[0] })
  }

  @Endpoint.POST({ middlewares: [Auth] })
  public async addFolder(req: Request, res: Response): Promise<any> {
    const { file: data } = req.body
    const count = data?.name ? null : await Model.count({ type: 'folder', user_id: req.user.id, ...data?.parent_id ? { parent_id: data?.parent_id } : {} })
    const { raw } = await Model.createQueryBuilder('files').insert().values({
      name: data?.name || `New Folder${count ? ` (${count})` : ''}`,
      mime_type: 'teledrive/folder',
      user_id: req.user.id,
      type: 'folder',
      parent_id: data?.parent_id,
      uploaded_at: new Date()
    }).returning('*').execute()
    return res.send({ file: raw[0] })
  }

  @Endpoint.GET('/signedKey/:id', { middlewares: [Auth] })
  public async signedKey(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const file = await Model.createQueryBuilder('files')
      .where('id = :id and user_id = :user_id ', {
        id, user_id: req.user.id })
      .getOne()
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    if (file.signed_key) {
      const link = await Links.findOne({ signed_key: file.signed_key })
      let key = link?.shorten
      if (!link) {
        key = nanoid()
        getRepository<Links>(Links).save([{ signed_key: file.signed_key, shorten: key }])
      }
      return res.send({ key })
    }

    const signedKey = sign({ file: { id: file.id }, session: req.tg.session.save() }, process.env.FILES_JWT_SECRET)
    const base64 = Buffer.from(signedKey).toString('base64')

    const key = nanoid()
    Model.update(id, { signed_key: base64 })
    getRepository<Links>(Links).save([{ signed_key: base64, shorten: key }])
    return res.send({ key })
  }

  @Endpoint.GET('/link/:id')
  public async link(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const link = await Links.findOne({ shorten: id })
    if (!link) {
      throw { status: 404, body: { error: 'Link not found' } }
    }

    const key = Buffer.from(link.signed_key, 'base64').toString()
    let data: { file: { id: string }, session: string }
    try {
      data = verify(key, process.env.FILES_JWT_SECRET) as { file: { id: string }, session: string }
    } catch (error) {
      console.error(error)
      throw { status: 401, body: { error: 'Invalid token' } }
    }
    const file = await Model.createQueryBuilder('files')
      .where('id = :id and \'*\' = any(sharing_options)', { id: data.file.id })
      .getOne()
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: 5 })
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid key' } }
    }
    await req.tg.connect()

    return await Files.download(req, res, file)
  }

  @Endpoint.GET('/:id', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { id } = req.params

    const file = await Model.createQueryBuilder('files')
      .where('id = :id and (user_id = :user_id or :username = any(sharing_options) or \'*\' = any(sharing_options))', {
        id, user_id: req.user.id, username: req.user.username })
      .getOne()
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    return await Files.download(req, res, file)
  }

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
      return !excludeIds.includes(data.id)
    }) : filteredData

    // insert many
    await Model.insert(insertedData?.map(chat => {
      const mimeType = chat.media.photo ? 'image/jpeg' : chat.media.document.mimeType || 'unknown'
      const name = chat.media.photo ? `${chat.media.photo.id}.jpg` : chat.media.document.attributes?.find((atr: any) => atr.fileName)?.fileName || `untitled.${mimeType.split('/').pop()}`

      const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size
      const size = chat.media.photo ? getSizes(chat.media.photo.sizes.pop()) : chat.media.document?.size

      let type = chat.media.photo ? 'image' : null
      if (!type) {
        if (chat.media.document.mimeType.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
          type = 'video'
        } else if (chat.media.document.mimeType.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
          type = 'document'
        } else if (chat.media.document.mimeType.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
          type = 'audio'
        } else {
          type = 'unknown'
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

  @Endpoint.DELETE('/:id', { middlewares: [Auth] })
  public async remove(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const { affected, raw } = await Model.createQueryBuilder('files')
      .delete()
      .where({ id, user_id: req.user.id })
      .returning('*')
      .execute()
    if (!affected) {
      throw { status: 404, body: { error: 'File not found' } }
    }
    if (raw[0].signed_key) {
      await getRepository<Links>(Links).delete({ signed_key: raw[0].signed_key })
    }

    return res.send({ file: { id } })
  }

  @Endpoint.PATCH('/:id', { middlewares: [Auth] })
  public async update(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const { file } = req.body
    if (!file) {
      throw { status: 400, body: { error: 'File is required in body.' } }
    }

    const { affected } = await Model.createQueryBuilder('files')
      .update({
        ...file.name ? { name: file.name } : {},
        ...file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {},
        ...file.parent_id !== undefined ? { parent_id: file.parent_id } : {}
      })
      .where({ id, user_id: req.user.id })
      .returning('*')
      .execute()
    if (!affected) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    return res.send({ file: { id } })
  }

  @Endpoint.POST('/forward/:id/:username', { middlewares: [Auth] })
  public async forward(req: Request, res: Response): Promise<any> {
    const { id, username } = req.params
    const { message } = req.body
    const file = await Model.createQueryBuilder('files')
      .where('id = :id and (user_id = :user_id or :username = any(sharing_options) or \'*\' = any(sharing_options))', {
        id, user_id: req.user.id, username: req.user.username })
      .getOne()
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    await req.tg.invoke(new Api.messages.ForwardMessages({
      fromPeer: 'me',
      id: [file.message_id],
      toPeer: username
    }))
    if (message) {
      await req.tg.sendMessage(username, { message })
    }
    return res.send({ success: true })
  }

  @Endpoint.POST({ middlewares: [Auth, multer().single('upload')] })
  public async upload(req: Request, res: Response): Promise<any> {
    const file = req.file
    if (!file) {
      throw { status: 400, body: { error: 'File upload is required' } }
    }

    let type = null
    if (file.mimetype.match(/^image/gi)) {
      type = 'image'
    } else if (file.mimetype.match(/^video/gi) || file.originalname.match(/\.mp4$/gi) || file.originalname.match(/\.mkv$/gi) || file.originalname.match(/\.mov$/gi)) {
      type = 'video'
    } else if (file.mimetype.match(/pdf$/gi) || file.originalname.match(/\.doc$/gi) || file.originalname.match(/\.docx$/gi) || file.originalname.match(/\.xls$/gi) || file.originalname.match(/\.xlsx$/gi)) {
      type = 'document'
    } else if (file.mimetype.match(/audio$/gi) || file.originalname.match(/\.mp3$/gi) || file.originalname.match(/\.ogg$/gi)) {
      type = 'audio'
    } else {
      type = 'unknown'
    }

    const model = new Model()
    model.name = file.originalname,
    model.mime_type = file.mimetype
    model.size = file.size
    model.user_id = req.user.id
    model.type = type
    model.parent_id = req.query?.parent_id as string || null
    await model.save()
    res.status(202).send({ accepted: true, file: { id: model.id } })

    let isUpdateProgress = true
    let cancel = false

    let data: any
    try {
      data = await req.tg.sendFile('me', {
        file: file.buffer,
        fileSize: file.size,
        attributes: [
          new Api.DocumentAttributeFilename({ fileName: file.originalname })
        ],
        progressCallback: (() => {
          const updateProgess: any = async (progress: number) => {
            console.log('progress', progress)
            if (isUpdateProgress) {
              const { affected } = await Model.update(model.id, { upload_progress: progress }, { reload: true })
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
        })(),
        workers: 1
      })

      await Model.update(model.id, { message_id: data.id, uploaded_at: data.date ? new Date(data.date * 1000) : null, upload_progress: null })
    } catch (error) {
      console.error(error)
      await Model.delete(model.id)
    }
  }

  public static async download(req: Request, res: Response, file: Model): Promise<any> {
    const { raw, dl } = req.query
    if (!raw || Number(raw) === 0) {
      return res.send({ file })
    }

    const chat = await req.tg.invoke(new Api.messages.GetMessages({
      id: [new Api.InputMessageID({ id: Number(file.message_id) })]
    }))

    let cancel = false
    req.on('close', () => cancel = true)

    res.setHeader('Content-Disposition', Number(dl) === 1 ? `attachment; filename=${file.name}` : `inline; filename=${file.name}`)
    res.setHeader('Content-Type', file.mime_type)
    res.setHeader('Content-Length', file.size)
    let data = null

    const chunk = 512 * 1024
    let idx = 0

    while (!cancel && data === null || data.length && idx * chunk < file.size) {
      data = await req.tg.downloadMedia(chat['messages'][0].media, {
        start: idx++ * chunk,
        end: file.size < idx * chunk - 1 ? file.size : idx * chunk - 1,
        workers: 1,   // using 1 for stable
        progressCallback: (() => {
          const updateProgess: any = (progress: number) => {
            console.log('progress', progress)
            updateProgess.isCanceled = cancel
          }
          return updateProgess
        })()
      } as any)
      res.write(data)
    }
    res.end()
  }
}