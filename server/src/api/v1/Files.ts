import { Api, TelegramClient } from '@mgilangjanuar/telegram'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import bigInt from 'big-integer'
import contentDisposition from 'content-disposition'
import { AES, enc } from 'crypto-js'
import { Request, Response } from 'express'
import moment from 'moment'
import multer from 'multer'
import { Files as Model } from '../../model/entities/Files'
import { Usages } from '../../model/entities/Usages'
import { TG_CREDS } from '../../utils/Constant'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Files {

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, offset, limit, shared, t: _t, ...filters } = req.query
    const [files, length] = await Model.createQueryBuilder('files')
      .where(!shared ? 'files.user_id = :user' : ':user = any(sharing_options)', {
        user: !shared ? req.user.id : req.user.username })
      .andWhere(buildWhereQuery(filters) || 'true')
      .skip(Number(offset) || undefined)
      .take(Number(limit) || undefined)
      .orderBy(buildSort(sort as string))
      .getManyAndCount()
    return res.send({ files, length })
  }

  @Endpoint.POST('/', { middlewares: [Auth] })
  public async save(req: Request, res: Response): Promise<any> {
    const { messageId } = req.query
    const { file } = req.body
    if (!file) {
      throw { status: 400, body: { error: 'File is required in body.' } }
    }

    let message: any = {}
    if (messageId) {
      if (!file.forward_info) {
        throw { status: 400, body: { error: 'Forward info is required in body.' } }
      }

      let chat: any
      if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
        const [type, peerId, _id, accessHash] = file.forward_info.split('/')
        let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
        if (type === 'channel') {
          peer = new Api.InputPeerChannel({
            channelId: Number(peerId),
            accessHash: bigInt(accessHash as string) })
          chat = await req.tg.invoke(new Api.channels.GetMessages({
            channel: peer,
            id: [new Api.InputMessageID({ id: Number(messageId) })]
          }))
        }
      } else {
        chat = await req.tg.invoke(new Api.messages.GetMessages({
          id: [new Api.InputMessageID({ id: Number(messageId) })]
        })) as any
      }

      if (!chat?.['messages']?.[0]) {
        throw { status: 404, body: { error: 'Message not found' } }
      }

      const mimeType = chat['messages'][0].media.photo ? 'image/jpeg' : chat['messages'][0].media.document.mimeType || 'unknown'
      const name = chat['messages'][0].media.photo ? `${chat['messages'][0].media.photo.id}.jpg` : chat['messages'][0].media.document.attributes?.find((atr: any) => atr.fileName)?.fileName || `${chat['messages'][0].media?.document.id}.${mimeType.split('/').pop()}`

      const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size
      const size = chat['messages'][0].media.photo ? getSizes(chat['messages'][0].media.photo.sizes.pop()) : chat['messages'][0].media.document?.size
      let type = chat['messages'][0].media.photo || mimeType.match(/^image/gi) ? 'image' : null
      if (chat['messages'][0].media.document?.mimeType.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
        type = 'video'
      } else if (chat['messages'][0].media.document?.mimeType.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
        type = 'document'
      } else if (chat['messages'][0].media.document?.mimeType.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
        type = 'audio'
      }

      message = {
        name,
        message_id: chat['messages'][0].id,
        mime_type: mimeType,
        size,
        user_id: req.user.id,
        uploaded_at: new Date(chat['messages'][0].date * 1000),
        type
      }
    }

    const { raw } = await Model.createQueryBuilder('files').insert().values({
      ...file,
      ...message
    }).returning('*').execute()
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

  @Endpoint.GET('/:id', { middlewares: [AuthMaybe] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { id } = req.params

    const file = await Model.createQueryBuilder('files')
      .where(`id = :id and (\'*\' = any(sharing_options) or ${req.user ? ':username = any(sharing_options) or user_id = :user_id' : 'false'})`, {
        id, username: req.user?.username, user_id: req.user?.id })
      .addSelect('files.signed_key')
      .getOne()
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    if (!req.user || file.user_id !== req.user?.id) {
      await Files.initiateSessionTG(req, file)
      await req.tg.connect()
    }

    return await Files.download(req, res, file)
  }

  @Endpoint.DELETE('/:id', { middlewares: [Auth] })
  public async remove(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const { affected } = await Model.createQueryBuilder('files')
      .delete()
      .where({ id, user_id: req.user.id })
      .returning('*')
      .execute()
    if (!affected) {
      throw { status: 404, body: { error: 'File not found' } }
    }
    return res.send({ file: { id } })
  }

  @Endpoint.PATCH('/:id', { middlewares: [Auth] })
  public async update(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const { file } = req.body
    if (!file) {
      throw { status: 400, body: { error: 'File is required in body' } }
    }

    const currentFile = await Model.createQueryBuilder('files')
      .where({ id, user_id: req.user.id })
      .addSelect('files.signed_key')
      .getOne()
    if (!currentFile) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    let key: string = currentFile.signed_key
    if (file.sharing_options?.length && !key) {
      key = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), process.env.FILES_JWT_SECRET).toString()
    }

    const { affected } = await Model.createQueryBuilder('files')
      .update({
        ...file.name ? { name: file.name } : {},
        ...file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {},
        ...file.parent_id !== undefined ? { parent_id: file.parent_id } : {},
        signed_key: key
      })
      .where({ id, user_id: req.user.id })
      .returning('*')
      .execute()
    if (!affected) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    return res.send({ file: { id } })
  }

  @Endpoint.POST('/upload/:id?', { middlewares: [Auth, multer().single('upload')] })
  public async upload(req: Request, res: Response): Promise<any> {
    const { name, size, mime_type: mimetype, parent_id: parentId, total_part: totalPart, part } = req.query as Record<string, string>
    if (!name || !size || !mimetype || !part || !totalPart) {
      throw { status: 400, body: { error: 'Name, size, mimetype, part, and total part are required' } }
    }
    const file = req.file
    if (!file) {
      throw { status: 400, body: { error: 'File upload is required' } }
    }

    if (file.size > 512 * 1024) {
      throw { status: 400, body: { error: 'Maximum file part size is 500kB' } }
    }

    let model: Model
    if (req.params?.id) {
      model = await Model.createQueryBuilder('files')
        .where('id = :id', { id: req.params.id })
        .addSelect('files.file_id')
        .getOne()
      if (!model) {
        throw { status: 404, body: { error: 'File not found' } }
      }
    } else {
      let type = null
      if (mimetype.match(/^image/gi)) {
        type = 'image'
      } else if (mimetype.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
        type = 'video'
      } else if (mimetype.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
        type = 'document'
      } else if (mimetype.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
        type = 'audio'
      } else {
        type = 'unknown'
      }

      model = new Model()
      model.name = name,
      model.mime_type = mimetype
      model.size = Number(size)
      model.user_id = req.user.id
      model.type = type
      model.parent_id = parentId as string || null
      model.upload_progress = 0
      model.file_id = bigInt.randBetween('-1e100', '1e100').toString()
      await model.save()
    }

    // upload per part
    let uploadPartStatus: boolean
    const uploadPart = async () => await req.tg.invoke(new Api.upload.SaveBigFilePart({
      fileId: bigInt(model.file_id),
      filePart: Number(part),
      fileTotalParts: Number(totalPart),
      bytes: file.buffer
    }))

    try {
      uploadPartStatus = await uploadPart()
    } catch (error) {
      await req.tg?.connect()
      uploadPartStatus = await uploadPart()
    }

    const { affected } = await Model.update(model.id, { upload_progress: (Number(part) + 1) / Number(totalPart) }, { reload: true })
    if (!affected) {
      await Model.delete(model.id)
      throw { status: 404, body: { error: 'File not found' } }
    }

    if (Number(part) < Number(totalPart) - 1) {
      return res.status(202).send({ accepted: true, file: { id: model.id }, uploadPartStatus })
    }

    // begin to send
    const sendData = async (forceDocument: boolean) => await req.tg.sendFile('me', {
      file: new Api.InputFileBig({
        id: bigInt(model.file_id),
        parts: Number(totalPart),
        name: model.name
      }),
      forceDocument,
      fileSize: model.size,
      attributes: forceDocument ? [
        new Api.DocumentAttributeFilename({ fileName: model.name })
      ] : undefined,
      workers: 1
    })

    let data: any
    try {
      data = await sendData(false)
    } catch (error) {
      console.error('HJKBHJKBHJKBK', error)
      data = await sendData(true)
    }

    await Model.update(model.id, {
      message_id: data.id,
      uploaded_at: data.date ? new Date(data.date * 1000) : null,
      upload_progress: null
    })
    return res.status(202).send({ accepted: true, file: { id: model.id } })
  }

  @Endpoint.GET('/breadcrumbs/:id', { middlewares: [Auth] })
  public async breadcrumbs(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    let folder = await Model.findOne(id)
    if (!folder) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    const breadcrumbs = [folder]
    while (folder.parent_id) {
      folder = await Model.findOne(folder.parent_id)
      breadcrumbs.push(folder)
    }

    return res.send({ breadcrumbs: breadcrumbs.reverse() })
  }

  @Endpoint.POST('/sync', { middlewares: [Auth] })
  public async sync(req: Request, res: Response): Promise<any> {
    const { parent_id: parentId, limit } = req.query

    if (req.user.plan === 'free' || !req.user.plan) {
      throw { status: 402, body: { error: 'Payment required' } }
    }

    let files = []
    let found = true
    let offsetId: number
    while (files.length < (Number(limit) || 10) && found) {
      const messages = await req.tg.invoke(new Api.messages.GetHistory({
        peer: 'me',
        limit: Number(limit) || 10,
        offsetId: offsetId || 0,
      }))

      if (messages['messages']?.length) {
        offsetId = messages['messages'][messages['messages'].length - 1].id
        files = [...files, ...messages['messages'].filter((msg: any) => msg?.media?.photo || msg?.media?.document)]
      } else {
        found = false
      }
    }

    files = files.slice(0, Number(limit) || 10)

    if (files?.length) {
      const existFiles = await Model
        .createQueryBuilder('files')
        .where(`message_id IN (:...ids) AND parent_id ${parentId ? '= :parentId' : 'IS NULL'} and forward_info IS NULL`, {
          ids: files.map(file => file.id),
          parentId
        })
        .getMany()
      const filesWantToSave = files.filter(file => !existFiles.find(e => e.message_id == file.id))
      if (filesWantToSave?.length) {
        await Model.createQueryBuilder('files')
          .insert()
          .values(filesWantToSave.map(file => {
            const mimeType = file.media.photo ? 'image/jpeg' : file.media.document.mimeType || 'unknown'
            const name = file.media.photo ? `${file.media.photo.id}.jpg` : file.media.document.attributes?.find((atr: any) => atr.fileName)?.fileName || `${file.media?.document.id}.${mimeType.split('/').pop()}`

            const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size
            const size = file.media.photo ? getSizes(file.media.photo.sizes.pop()) : file.media.document?.size
            let type = file.media.photo || mimeType.match(/^image/gi) ? 'image' : null
            if (file.media.document?.mimeType.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
              type = 'video'
            } else if (file.media.document?.mimeType.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
              type = 'document'
            } else if (file.media.document?.mimeType.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
              type = 'audio'
            }

            return {
              name,
              message_id: file.id,
              mime_type: mimeType,
              size,
              user_id: req.user.id,
              uploaded_at: new Date(file.date * 1000),
              type,
              parent_id: parentId ? parentId.toString() : null
            }
          }))
          .execute()
      }
    }
    return res.send({ files })
  }

  public static async download(req: Request, res: Response, file: Model): Promise<any> {
    const { raw, dl, thumb } = req.query
    if (!raw || Number(raw) === 0) {
      const { signed_key: _, ...result } = file
      return res.send({ file: result })
    }

    let usage = await Usages.findOne({ where: { key: req.user ? `u:${req.user.id}` : `ip:${req.ip}` } })
    if (!usage) {
      usage = new Usages()
      usage.key = req.user ? `u:${req.user.id}` : `ip:${req.ip}`
      usage.usage = 0
      usage.expire = moment().add(1, 'day').toDate()
      await usage.save()
    }

    if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {   // is expired
      usage.expire = moment().add(1, 'day').toDate()
      await usage.save()
    } else if (!req.user || !req.user.plan || req.user.plan === 'free') {      // not expired and free plan
      // check quota
      if (usage.usage + file.size > 1_500_000_000) {
        throw { status: 402, body: { error: 'Payment required' } }
      }
    }

    let chat: any
    if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
      const [type, peerId, id, accessHash] = file.forward_info.split('/')
      let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
      if (type === 'channel') {
        peer = new Api.InputPeerChannel({
          channelId: Number(peerId),
          accessHash: bigInt(accessHash as string) })
        chat = await req.tg.invoke(new Api.channels.GetMessages({
          channel: peer,
          id: [new Api.InputMessageID({ id: Number(id) })]
        }))
      }
    } else {
      chat = await req.tg.invoke(new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(file.message_id) })]
      }))
    }

    let cancel = false
    req.on('close', () => cancel = true)

    res.setHeader('Content-Disposition', contentDisposition(file.name, { type: Number(dl) === 1 ? 'attachment' : 'inline' }))
    res.setHeader('Content-Type', file.mime_type)
    res.setHeader('Content-Length', file.size)
    let data = null

    const chunk = 512 * 1024
    let idx = 0

    while (!cancel && data === null || data.length && idx * chunk < file.size) {
      // const startDate = Date.now()
      data = await req.tg.downloadMedia(chat['messages'][0].media, {
        ...thumb ? { sizeType: 'i' } : {},
        start: idx++ * chunk,
        end: Math.min(file.size, idx * chunk - 1),
        workers: 1,   // using 1 for stable
        progressCallback: (() => {
          const updateProgess: any = () => {
            updateProgess.isCanceled = cancel
          }
          return updateProgess
        })()
      })
      res.write(data)
      // if (!req.user?.plan || req.user?.plan === 'free') {
      //   await new Promise(res => setTimeout(res, 1000 - (Date.now() - startDate))) // bandwidth 512 kbsp
      // }
    }
    usage.usage += file.size
    await usage.save()
    res.end()
  }

  public static async initiateSessionTG(req: Request, file?: Model): Promise<Model> {
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    let data: { file: { id: string }, session: string }
    try {
      data = JSON.parse(AES.decrypt(file.signed_key, process.env.FILES_JWT_SECRET).toString(enc.Utf8))
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid token' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: 5 })
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid key' } }
    }
    return file
  }
}