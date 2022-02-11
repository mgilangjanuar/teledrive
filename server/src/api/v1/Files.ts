import { Api, Logger, TelegramClient } from '@mgilangjanuar/telegram'
import { LogLevel } from '@mgilangjanuar/telegram/extensions/Logger'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import bigInt from 'big-integer'
import contentDisposition from 'content-disposition'
import { AES, enc } from 'crypto-js'
import { Request, Response } from 'express'
import moment from 'moment'
import { Files as Model } from '../../model/entities/Files'
import { Usages } from '../../model/entities/Usages'
import { Redis } from '../../service/Cache'
import { CONNECTION_RETRIES, PROCESS_RETRY, TG_CREDS } from '../../utils/Constant'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Files {

  @Endpoint.GET('/', { middlewares: [AuthMaybe] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, offset, limit, shared, exclude_parts: excludeParts, full_properties: fullProperties, no_cache: noCache, t: _t, ...filters } = req.query
    const parent = filters?.parent_id ? await Model.findOne(filters.parent_id as string) : null
    if (filters?.parent_id && !parent) {
      throw { status: 404, body: { error: 'Parent not found' } }
    }
    if (!req.user && !parent?.sharing_options?.includes('*')) {
      throw { status: 404, body: { error: 'Parent not found' } }
    }

    const getFiles = async () => {
      let where = 'files.user_id = :user'
      if (shared) {
        if (parent?.sharing_options?.includes(req.user?.username) || parent?.sharing_options?.includes('*')) {
          where = 'true'
        } else {
          where = ':user = any(files.sharing_options) and (files.parent_id is null or parent.sharing_options is null or cardinality(parent.sharing_options) = 0 or not :user = any(parent.sharing_options))'
        }
      }
      let query = Model.createQueryBuilder('files')
        .where(where, {
          user: shared ? req.user?.username : req.user?.id  })
        .andWhere(buildWhereQuery(filters, 'files.') || 'true')
      if (fullProperties !== 'true' && fullProperties !== '1') {
        query = query.select([
          'files.id',
          'files.name',
          'files.type',
          'files.size',
          'files.sharing_options',
          'files.upload_progress',
          'files.link_id',
          'files.user_id',
          'files.parent_id',
          'files.uploaded_at',
          'files.created_at'
        ])
      }
      if (excludeParts === 'true' || excludeParts === '1') {
        query = query.andWhere('(files.name ~ \'.part0*1$\' or files.name !~ \'.part[0-9]+$\')')
      }
      if (shared && where !== 'true') {
        query = query.leftJoin('files.parent', 'parent')
      }
      return await query
        .skip(Number(offset) || 0)
        .take(Number(limit) || 10)
        .orderBy(buildSort(sort as string, 'files.'))
        .getManyAndCount()
    }

    const [files, length] = noCache === 'true' || noCache === '1' ? await getFiles() : await Redis.connect().getFromCacheFirst(`files:${req.user?.id || 'null'}:${JSON.stringify(req.query)}`, getFiles, 2)
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
            channelId: bigInt(peerId),
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
    const count = data?.name ? null : await Model.createQueryBuilder('files').where(
      `type = :type and user_id = :userId and name like 'New Folder%' and parent_id ${data?.parent_id ? '= :parentId' : 'is null'}`, {
        type: 'folder',
        userId: req.user.id,
        parentId: data?.parent_id
      }).getCount()
    const parent = data?.parent_id ? await Model.createQueryBuilder('files')
      .where('id = :id', { id: data.parent_id })
      .addSelect('files.signed_key')
      .getOne() : null

    const { raw } = await Model.createQueryBuilder('files').insert().values({
      name: data?.name || `New Folder${count ? ` (${count})` : ''}`,
      mime_type: 'teledrive/folder',
      user_id: req.user.id,
      type: 'folder',
      uploaded_at: new Date(),
      ...parent ? {
        parent_id: parent.id,
        sharing_options: parent.sharing_options,
        signed_key: parent.signed_key
      } : {}
    }).returning('*').execute()
    return res.send({ file: raw[0] })
  }

  @Endpoint.GET('/:id', { middlewares: [AuthMaybe] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const file = await Model.createQueryBuilder('files')
      .where('id = :id', { id })
      .addSelect('files.signed_key')
      .getOne()

    const parent = file?.parent_id ? await Model.createQueryBuilder('files')
      .where('id = :id', { id: file.parent_id })
      .addSelect('files.signed_key')
      .getOne() : null
    if (!file || file.user_id !== req.user?.id && !file.sharing_options?.includes('*') && !file.sharing_options?.includes(req.user?.username)) {
      if (!parent?.sharing_options?.includes(req.user?.username) && !parent?.sharing_options?.includes('*')) {
        throw { status: 404, body: { error: 'File not found' } }
      }
    }
    file.signed_key = file.signed_key || parent?.signed_key

    let files = [file]
    if (/.*\.part0*1$/gi.test(file?.name)) {
      if (req.user?.plan !== 'premium') {
        throw { status: 402, body: { error: 'Please upgrade your plan for view this file' } }
      }
      files = await Model.createQueryBuilder('files')
        .where(`(id = :id or name like '${file.name.replace(/\.part0*1$/gi, '')}%') and user_id = :user_id and parent_id ${file.parent_id ? '= :parent_id' : 'is null'}`, {
          id, user_id: file.user_id, parent_id: file.parent_id
        })
        .addSelect('files.signed_key')
        .orderBy('name')
        .getMany()
      files[0].signed_key = file.signed_key = file.signed_key || parent?.signed_key
    }

    if (!req.user || file.user_id !== req.user?.id) {
      await Files.initiateSessionTG(req, files)
      await req.tg.connect()
    }

    return await Files.download(req, res, files)
  }

  @Endpoint.DELETE('/:id', { middlewares: [Auth] })
  public async remove(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const { deleteMessage } = req.query
    const { affected, raw } = await Model.createQueryBuilder('files')
      .delete()
      .where({ id, user_id: req.user.id })
      .returning('*')
      .execute()
    if (!affected) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    const file = raw[0]
    if (deleteMessage && ['true', '1'].includes(deleteMessage as string) && !file?.forward_info) {
      try {
        await req.tg.invoke(new Api.messages.DeleteMessages({ id: [Number(file.message_id)], revoke: true }))
      } catch (error) {
        try {
          await req.tg.invoke(new Api.channels.DeleteMessages({ id: [Number(file.message_id)], channel: 'me' }))
        } catch (error) {
          // ignore
        }
      }
    }

    if (/.*\.part0*1$/gi.test(file?.name)) {
      const { raw: files } = await Model.createQueryBuilder('files')
        .delete()
        .where(`(id = :id or name like '${file.name.replace(/\.part0*1$/gi, '')}%') and user_id = :user_id and parent_id ${file.parent_id ? '= :parent_id' : 'is null'}`, {
          id, user_id: file.user_id, parent_id: file.parent_id
        })
        .returning('*')
        .execute()
      files.map(async (file: any) => {
        if (deleteMessage && ['true', '1'].includes(deleteMessage as string) && !file?.forward_info) {
          try {
            await req.tg.invoke(new Api.messages.DeleteMessages({ id: [Number(file.message_id)], revoke: true }))
          } catch (error) {
            try {
              await req.tg.invoke(new Api.channels.DeleteMessages({ id: [Number(file.message_id)], channel: 'me' }))
            } catch (error) {
              // ignore
            }
          }
        }
      })
    }
    return res.send({ file })
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

    if (file.sharing_options?.length && currentFile.type === 'folder') {
      if (req.user.plan === 'free' || !req.user.plan) {
        throw { status: 402, body: { error: 'Payment required' } }
      }
    }

    const parent = file.parent_id ? await Model.createQueryBuilder('files')
      .where('id = :id', { id: file.parent_id })
      .addSelect('files.signed_key')
      .getOne() : null

    let key: string = currentFile.signed_key || parent?.signed_key
    if (file.sharing_options?.length && !key) {
      key = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), process.env.FILES_JWT_SECRET).toString()
    }

    if (!file.sharing_options?.length && !currentFile.sharing_options?.length && !parent?.sharing_options?.length) {
      key = null
    }

    if (/.*\.part0*1$/gi.test(currentFile?.name)) {
      const files = await Model.createQueryBuilder('files')
        .where(`(id = :id or name like '${currentFile.name.replace(/\.part0*1$/gi, '')}%') and user_id = :user_id and parent_id ${currentFile.parent_id ? '= :parent_id' : 'is null'}`, {
          id, user_id: currentFile.user_id, parent_id: currentFile.parent_id
        })
        .addSelect('files.signed_key')
        .getMany()
      await Promise.all(files.map(async current => await Model.createQueryBuilder('files')
        .update({
          ...file.name ? { name: current.name.replace(current.name.replace(/\.part0*\d+$/gi, ''), file.name) } : {},
          ...file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {},
          ...file.parent_id !== undefined ? { parent_id: file.parent_id } : {},
          ...parent && current.type === 'folder' ? {
            sharing_options: parent.sharing_options
          } : {},
          signed_key: key
        })
        .where({ id: current.id })
        .execute()))
    } else {
      await Model.createQueryBuilder('files')
        .update({
          ...file.name ? { name: currentFile.name.replace(currentFile.name.replace(/\.part0*1$/gi, ''), file.name) } : {},
          ...file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {},
          ...file.parent_id !== undefined ? { parent_id: file.parent_id } : {},
          ...parent && currentFile.type === 'folder' ? {
            sharing_options: parent.sharing_options
          } : {},
          signed_key: key
        })
        .where({ id, user_id: req.user.id })
        .execute()
    }

    if (file.sharing_options !== undefined && currentFile.type === 'folder') {
      const updateSharingOptions = async (currentFile: Model) => {
        const children = await Model.createQueryBuilder('files')
          .where('parent_id = :parent_id and type = \'folder\'', { parent_id: currentFile.id })
          .addSelect('files.signed_key')
          .getMany()
        for (const child of children) {
          await Model.createQueryBuilder('files')
            .update({ sharing_options: file.sharing_options, signed_key: key || child.signed_key })
            .where({ id: child.id, user_id: req.user.id })
            .execute()
          await updateSharingOptions(child)
        }
      }
      await updateSharingOptions(currentFile)
    }

    return res.send({ file: { id } })
  }

  @Endpoint.POST('/upload/:id?', { middlewares: [Auth] })
  public async upload(req: Request, res: Response): Promise<any> {
    const {
      name,
      size,
      mime_type: mimetype,
      parent_id: parentId,
      relative_path: relativePath,
      total_part: totalPart,
      part,
      message
    } = req.body as Record<string, any>

    let model: Model
    if (req.params?.id) {
      model = await Model.createQueryBuilder('files')
        .where('id = :id', { id: req.params.id })
        .addSelect('files.file_id')
        .getOne()
      if (!model) {
        throw { status: 404, body: { error: 'File not found' } }
      }
    }

    if (!message) {
      if ((!req.user?.plan || req.user?.plan === 'free') && /\.part\d+$/gi.test(name)) {
        throw { status: 402, body: { error: 'Payment required' } }
      }

      if (!model) {
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

        let currentParentId = parentId
        if (relativePath) {
          const paths = relativePath.split('/').slice(0, -1) || []
          for (const i in paths) {
            const path = paths[i]
            const findFolder = await Model.createQueryBuilder('files')
              .where(`type = :type and name = :name and user_id = :user_id and parent_id ${currentParentId ? '= :parent_id' : 'is null'}`, {
                type: 'folder',
                name: path,
                user_id: req.user.id,
                parent_id: currentParentId
              })
              .getOne()
            if (findFolder) {
              currentParentId = findFolder.id
            } else {
              const newFolder = new Model()
              newFolder.name = path
              newFolder.type = 'folder'
              newFolder.user_id = req.user.id
              newFolder.mime_type = 'teledrive/folder'
              if (currentParentId) {
                newFolder.parent_id = currentParentId
              }
              await newFolder.save()
              currentParentId = newFolder.id
            }
          }
        }

        model = new Model()
        model.name = name,
        model.mime_type = mimetype
        model.size = size
        model.user_id = req.user.id
        model.type = type
        model.parent_id = currentParentId || null
        model.upload_progress = 0
        model.file_id = bigInt.randBetween('-1e100', '1e100').toString()
        model.forward_info = req.user.settings?.saved_location || null
        await model.save()
      }

      // model.size = bigInt(model.size).add(file.buffer.length).toString()
      model.upload_progress = (Number(part) + 1) / Number(totalPart)
      await model.save()

      // if (Number(part) < Number(totalPart) - 1) {
      if (!message) {
        return res.status(202).send({ accepted: true, file: { id: model.id, file_id: model.file_id, name: model.name, size: model.size, type: model.type } })
      }
    }

    model.message_id = message.id?.toString()
    model.uploaded_at = message.date ? new Date(message.date * 1000) : null
    model.upload_progress = null
    if (req.user.settings?.saved_location) {
      const [type, peerId, _, accessHash] = req.user.settings?.saved_location.split('/')
      model.forward_info = `${type}/${peerId}/${message.id?.toString()}/${accessHash}`
    }
    await model.save()
    return res.status(202).send({ accepted: true, file: { id: model.id, file_id: model.file_id, name: model.name, size: model.size, type: model.type } })
  }

  @Endpoint.GET('/breadcrumbs/:id', { middlewares: [AuthMaybe] })
  public async breadcrumbs(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    let folder = await Model.findOne(id)
    if (!folder) {
      throw { status: 404, body: { error: 'File not found' } }
    }
    if (req.user?.id !== folder.user_id) {
      if (!folder.sharing_options?.includes('*') && !folder.sharing_options?.includes(req.user?.username)) {
        throw { status: 404, body: { error: 'File not found' } }
      }
    }

    const breadcrumbs = [folder]
    while (folder.parent_id) {
      folder = await Model.findOne(folder.parent_id)
      if (!req.user && folder.sharing_options?.includes('*') || folder.sharing_options?.includes(req.user?.username) || folder.user_id === req.user?.id) {
        breadcrumbs.push(folder)
      }
    }

    return res.send({ breadcrumbs: breadcrumbs.reverse() })
  }

  @Endpoint.POST('/sync', { middlewares: [Auth] })
  public async sync(req: Request, res: Response): Promise<any> {
    const { parent_id: parentId, limit } = req.query

    if (req.user.plan === 'free' || !req.user.plan) {
      throw { status: 402, body: { error: 'Payment required' } }
    }

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (req.user.settings?.saved_location) {
      const [type, peerId, _, accessHash] = req.user.settings?.saved_location.split('/')
      if (type === 'channel') {
        peer = new Api.InputPeerChannel({
          channelId: bigInt(peerId),
          accessHash: accessHash ? bigInt(accessHash as string) : null })
      } else if (type === 'user') {
        peer = new Api.InputPeerUser({
          userId: bigInt(peerId),
          accessHash: bigInt(accessHash as string) })
      } else if (type === 'chat') {
        peer = new Api.InputPeerChat({
          chatId: bigInt(peerId) })
      }
    }

    let files = []
    let found = true
    let offsetId: number
    while (files.length < (Number(limit) || 10) && found) {
      const messages = await req.tg.invoke(new Api.messages.GetHistory({
        peer: peer || 'me',
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

  @Endpoint.POST('/filesSync', { middlewares: [Auth] })
  public async filesSync(req: Request, res: Response): Promise<any> {
    const { files } = req.body
    for (const file of files) {
      const existFile = await Model.createQueryBuilder('files')
        .where('name = :name and type = :type', { name: file.name, type: file.type })
        .andWhere(`size ${file.size ? `= ${file.size}` : 'is null'}`)
        .andWhere(`parent_id is ${file.parent_id ? 'not' : ''} null`)
        .getOne()
      if (!existFile) {
        try {
          await Model.insert({
            ...file,
            user_id: req.user.id
          })
        } catch (error) {
          // ignore
        }
      }
    }
    return res.status(202).send({ accepted: true })
  }

  public static async download(req: Request, res: Response, files: Model[], onlyHeaders?: boolean): Promise<any> {
    const { raw, dl, thumb } = req.query

    let usage = await Usages.createQueryBuilder('usages')
      .where('key = :key', {
        key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] as string || req.ip}`
      }).getOne()
    if (!usage) {
      usage = new Usages()
      usage.key = req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] as string || req.ip}`
      usage.usage = '0'
      usage.expire = moment().add(1, 'day').toDate()
      try {
        await usage.save()
      } catch (error) {
        // ignore
      }
    }

    if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {   // is expired
      usage.expire = moment().add(1, 'day').toDate()
      usage.usage = '0'
      await usage.save()
    }

    const totalFileSize = files.reduce((res, file) => res.add(file.size || 0), bigInt(0))
    if (!req.user || !req.user.plan || req.user.plan === 'free') {      // not expired and free plan
      // check quota
      if (bigInt(usage.usage).add(bigInt(totalFileSize)).greater(1_500_000_000)) {
        throw { status: 402, body: { error: 'You just hit the daily bandwidth limit' } }
      }
    }

    if (!raw || Number(raw) === 0) {
      const { signed_key: _, ...result } = files[0]
      return res.send({ file: result })
    }

    usage.usage = bigInt(totalFileSize).add(bigInt(usage.usage)).toString()
    await usage.save()
    return res.send({ files })

    let cancel = false
    req.on('close', () => cancel = true)
    res.setHeader('Cache-Control', 'public, max-age=604800')
    res.setHeader('Content-Range', `bytes */${totalFileSize}`)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('ETag', Buffer.from(`${files[0].id}:${files[0].message_id}`).toString('base64'))
    res.setHeader('Content-Disposition', contentDisposition(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }))
    res.setHeader('Content-Type', files[0].mime_type)
    res.setHeader('Content-Length', totalFileSize.toString())

    if (onlyHeaders) return

    for (const file of files) {
      let chat: any
      if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
        const [type, peerId, id, accessHash] = file.forward_info.split('/')
        let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
        if (type === 'channel') {
          peer = new Api.InputPeerChannel({
            channelId: bigInt(peerId),
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

      let data = null

      const chunk = 512 * 1024
      let idx = 0

      while (!cancel && data === null || data.length && bigInt(file.size).greater(bigInt(idx * chunk))) {
        // const startDate = Date.now()
        const getData = async () => await req.tg.downloadMedia(chat['messages'][0].media, {
          ...thumb ? { sizeType: 'i' } : {},
          start: idx++ * chunk,
          end: bigInt.min(bigInt(file.size), bigInt(idx * chunk - 1)).toJSNumber(),
          workers: 1,   // using 1 for stable
          progressCallback: (() => {
            const updateProgess: any = () => {
              updateProgess.isCanceled = cancel
            }
            return updateProgess
          })()
        })

        let trial = 0
        while (trial < PROCESS_RETRY) {
          try {
            data = await getData()
            res.write(data)
            trial = PROCESS_RETRY
          } catch (error) {
            if (trial >= PROCESS_RETRY) {
              throw error
            }
            await new Promise(resolve => setTimeout(resolve, ++trial * 3000))
            await req.tg?.connect()
          }
        }
        res.flush()
      }
    }
    usage.usage = bigInt(totalFileSize).add(bigInt(usage.usage)).toString()
    await usage.save()

    res.end()
  }

  public static async initiateSessionTG(req: Request, files?: Model[]): Promise<Model[]> {
    if (!files?.length) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    let data: { file: { id: string }, session: string }
    try {
      data = JSON.parse(AES.decrypt(files[0].signed_key, process.env.FILES_JWT_SECRET).toString(enc.Utf8))
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid token' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, {
        connectionRetries: CONNECTION_RETRIES,
        useWSS: false,
        ...process.env.ENV === 'production' ? { baseLogger: new Logger(LogLevel.NONE) } : {}
      })
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid key' } }
    }
    return files
  }
}