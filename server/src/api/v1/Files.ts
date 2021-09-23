import bigInt from 'big-integer'
import { Request, Response } from 'express'
import { sign, verify } from 'jsonwebtoken'
import multer from 'multer'
import { Api, TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { Files as Model } from '../../model/entities/Files'
import { PLANS, TG_CREDS } from '../../utils/Constant'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Files {

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, skip, take, shared, ...filters } = req.query
    const [files, length] = await Model.createQueryBuilder('files')
      .where(!shared ? 'files.user_id = :user' : ':user = any(sharing_options)', {
        user: !shared ? req.user.id : req.user.username })
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

    const currentFile = await Model.findOne({ where: { id, user_id: req.user.id } })
    if (!currentFile) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    // checking plans
    if (file.sharing_options?.length) {
      const sharingUsers = file.sharing_options.filter((user: string) => user !== '*').length
      if (sharingUsers > PLANS[req.user.plan].sharingUsers) {
        throw { status: 402, body: { error: 'Payment required' } }
      }
      const publicFiles = await Model.createQueryBuilder('files')
        .where('\'*\' = any(sharing_options) and user_id = :user_id', {
          user_id: req.user?.id })
        .getCount()
      if (publicFiles > PLANS[req.user.plan].publicFiles) {
        throw { status: 402, body: { error: 'Payment required' } }
      }

      const sharedFiles = await Model.createQueryBuilder('files')
        .where('sharing_options is not null and sharing_options::text != \'{}\' and user_id = :user_id', {
          user_id: req.user?.id })
        .getCount()
      if (sharedFiles > PLANS[req.user.plan].sharedFiles) {
        throw { status: 402, body: { error: 'Payment required' } }
      }
    }

    let key: string = currentFile.signed_key
    if (file.sharing_options?.length && !key) {
      const signedKey = sign({ file: { id: file.id }, session: req.tg.session.save() }, process.env.FILES_JWT_SECRET)
      key = Buffer.from(signedKey).toString('base64')
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
      console.log(bigInt.randBetween('-1e100', '1e100'))
      await model.save()
    }

    // upload per part
    const uploadPartStatus = await req.tg.invoke(new Api.upload.SaveBigFilePart({
      fileId: bigInt(model.file_id),
      filePart: Number(part),
      fileTotalParts: Number(totalPart),
      bytes: file.buffer
    }))

    const { affected } = await Model.update(model.id, { upload_progress: (Number(part) + 1) / Number(totalPart) }, { reload: true })
    if (!affected) {
      await Model.delete(model.id)
      throw { status: 404, body: { error: 'File not found' } }
    }

    if (Number(part) < Number(totalPart) - 1) {
      return res.status(202).send({ accepted: true, file: { id: model.id }, uploadPartStatus })
    }

    // begin to send
    try {
      const data = await req.tg.sendFile('me', {
        file: new Api.InputFileBig({
          id: bigInt(model.file_id),
          parts: Number(totalPart),
          name: model.name
        }),
        forceDocument: true,
        fileSize: model.size,
        attributes: [
          new Api.DocumentAttributeFilename({ fileName: model.name })
        ],
        workers: 10
      })

      await Model.update(model.id, {
        message_id: data.id,
        uploaded_at: data.date ? new Date(data.date * 1000) : null,
        upload_progress: null
      })
      return res.status(202).send({ accepted: true, file: { id: model.id } })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  public static async download(req: Request, res: Response, file: Model): Promise<any> {
    const { raw, dl } = req.query
    if (!raw || Number(raw) === 0) {
      const { signed_key: _, ...result } = file
      return res.send({ file: result })
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
        end: Math.min(file.size, idx * chunk - 1),
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

  public static async initiateSessionTG(req: Request, file?: Model): Promise<Model> {
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    const key = Buffer.from(file.signed_key, 'base64').toString()
    let data: { file: { id: string }, session: string }
    try {
      data = verify(key, process.env.FILES_JWT_SECRET) as { file: { id: string }, session: string }
    } catch (error) {
      console.error(error)
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