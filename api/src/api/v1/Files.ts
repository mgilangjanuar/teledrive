import { files, Prisma } from '@prisma/client'
import bigInt from 'big-integer'
import { compareSync, hashSync } from 'bcryptjs'
import checkDiskSpace from 'check-disk-space'
import contentDisposition from 'content-disposition'
import { AES, enc } from 'crypto-js'
import { Request, Response } from 'express'
import { appendFileSync, createReadStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'fs'
import moment from 'moment'
import multer from 'multer'
import { Api, Logger, TelegramClient } from 'telegram'
import { LogLevel } from 'telegram/extensions/Logger'
import { StringSession } from 'telegram/sessions'
import { prisma } from '../../model'
import { Redis } from '../../service/Cache'
import { CACHE_FILES_LIMIT, CONNECTION_RETRIES, FILES_JWT_SECRET, TG_CREDS } from '../../utils/Constant'
import { buildSort } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

const CACHE_DIR = `${__dirname}/../../../../.cached`

@Endpoint.API()
export class Files {

  @Endpoint.GET('/', { middlewares: [AuthMaybe] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, offset, limit, shared, exclude_parts: excludeParts, full_properties: fullProperties, no_cache: noCache, t: _t, ...filters } = req.query
    const parent = filters?.parent_id && filters.parent_id !== 'null' ? await prisma.files.findFirst({ where: { id: filters.parent_id as string } }) : null
    if (filters?.parent_id && filters.parent_id !== 'null' && !parent) {
      throw { status: 404, body: { error: 'Parent not found' } }
    }
    if (!req.user && !parent?.sharing_options?.includes('*')) {
      throw { status: 404, body: { error: 'Parent not found' } }
    }

    const getFiles = async (): Promise<[files[], number]> => {
      let where: Record<string, any> = { user_id: req.user?.id }   // 'files.user_id = :user'
      if (shared) {
        if (parent?.sharing_options?.includes(req.user?.username) || parent?.sharing_options?.includes('*')) {
          where = {}
        } else {
          // :user = any(files.sharing_options) and (files.parent_id is null or parent.sharing_options is null or cardinality(parent.sharing_options) = 0 or not :user = any(parent.sharing_options))
          where = {
            AND: [
              {
                sharing_options: {
                  has: req.user?.username
                }
              },
              {
                OR: [
                  { parent_id: null },
                  { parent: {
                    sharing_options: undefined }
                  },
                  {
                    parent: {
                      sharing_options: {
                        isEmpty: true
                      }
                    }
                  },
                  {
                    NOT: {
                      parent: {
                        sharing_options: {
                          has: req.user?.username
                        }
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      }

      let select = null
      if (fullProperties !== 'true' && fullProperties !== '1') {
        select = {
          id: true,
          name: true,
          type: true,
          size: true,
          sharing_options: true,
          upload_progress: true,
          link_id: true,
          user_id: true,
          parent_id: true,
          uploaded_at: true,
          created_at: true,
          password: true
        }
      }
      if (shared && Object.keys(where).length) {
        select['parent'] = true
      }

      const whereQuery: Prisma.filesWhereInput = {
        AND: [
          where,
          ...Object.keys(filters).reduce((res, k) => {
            let obj = { [k]: filters[k] }
            if (filters[k] === 'null') {
              obj = { [k]: null }
            }
            if (/\.in$/.test(k)) {
              obj = { [k.replace(/\.in$/, '')]: {
                in: (filters[k] as string)
                  .replace(/^\(/, '')
                  .replace(/\'/g, '')
                  .replace(/\)$/, '')
                  .split(',')
              } }
            }
            if (/\.like$/.test(k)) {
              obj = { [k.replace(/\.like$/, '')]: {
                startsWith: filters[k].toString()
              } }
            }
            return [...res, obj]
          }, []),
          ...excludeParts === 'true' || excludeParts === '1' ? [
            {
              OR: [   // (files.name ~ \'.part0*1$\' or files.name !~ \'.part[0-9]+$\')
                {
                  AND: [
                    { name: { contains: '.part0' } },
                    { name: { endsWith: '1' } },
                    { NOT: { name: { endsWith: '11' } } },
                    { NOT: { name: { endsWith: '111' } } },
                    { NOT: { name: { endsWith: '1111' } } },
                    { NOT: { name: { endsWith: '21' } } },
                    { NOT: { name: { endsWith: '31' } } },
                    { NOT: { name: { endsWith: '41' } } },
                    { NOT: { name: { endsWith: '51' } } },
                    { NOT: { name: { endsWith: '61' } } },
                    { NOT: { name: { endsWith: '71' } } },
                    { NOT: { name: { endsWith: '81' } } },
                    { NOT: { name: { endsWith: '91' } } },
                  ]
                },
                {
                  NOT: { name: { contains: '.part' } }
                }
              ]
            }
          ] : []
        ],
      }
      return [
        await prisma.files.findMany({
          ...select ? { select } : {},
          where: whereQuery,
          skip: Number(offset) || 0,
          take: Number(limit) || 10,
          orderBy: buildSort(sort as string)
        }),
        await prisma.files.count({ where: whereQuery })
      ]
    }

    const [files, length] = noCache === 'true' || noCache === '1' ? await getFiles() : await Redis.connect().getFromCacheFirst(`files:${req.user?.id || 'null'}:${JSON.stringify(req.query)}`, getFiles, 2)
    return res.send({ files: files.map(file => ({ ...file, password: file.password ? '[REDACTED]' : null })), length })
  }

  @Endpoint.GET('/stats', { middlewares: [Auth] })
  public async stats(req: Request, res: Response): Promise<any> {
    const totalFilesSize = await prisma.files.aggregate({
      _sum: { size: true }
    })
    const totalUserFilesSize = await prisma.files.aggregate({
      _sum: { size: true },
      where: {
        user_id: req.user.id
      }
    })

    try {
      mkdirSync(`${CACHE_DIR}`, { recursive: true })
    } catch (error) {
      // ignore
    }
    const cachedSize = readdirSync(`${CACHE_DIR}`)
      .filter(filename => statSync(`${CACHE_DIR}/${filename}`).isFile())
      .reduce((res, file) => res + statSync(`${CACHE_DIR}/${file}`).size, 0)
    return res.send({
      stats: {
        system: await checkDiskSpace(__dirname),
        totalFilesSize: totalFilesSize._sum.size,
        totalUserFilesSize: totalUserFilesSize._sum.size,
        cachedSize
      }
    })
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
        message_id: chat['messages'][0].id.toString(),
        mime_type: mimeType,
        size,
        user_id: req.user.id,
        uploaded_at: new Date(chat['messages'][0].date * 1000),
        type
      }
    }
    return res.send({ file: await prisma.files.create({
      data: {
        ...file,
        ...message
      }
    }) })
  }

  @Endpoint.POST({ middlewares: [Auth] })
  public async addFolder(req: Request, res: Response): Promise<any> {
    const { file: data } = req.body
    const count = await prisma.files.count({
      where: {
        AND: [
          { type: 'folder' },
          { user_id: req.user.id },
          { name: { startsWith: data?.name || 'New Folder' } },
          { parent_id: data?.parent_id || null },
          { link_id: data?.link_id || null }
        ]
      }
    })
    const parent = data?.parent_id ? await prisma.files.findUnique({
      where: { id: data.parent_id }
    }) : null

    return res.send({ file: await prisma.files.create({
      data: {
        name: (data?.name || 'New Folder') + `${count ? ` (${count})` : ''}`,
        mime_type: 'teledrive/folder',
        user_id: req.user.id,
        type: 'folder',
        uploaded_at: new Date(),
        link_id: data?.link_id,
        ...parent ? {
          parent_id: parent.id,
          sharing_options: parent.sharing_options,
          signed_key: parent.signed_key
        } : {}
      }
    }) })
  }

  @Endpoint.POST({ middlewares: [Auth] })
  public async cloneFile(req: Request, res: Response): Promise<any> {
    const { file: body } = req.body
    const source = await prisma.files.findUnique({ where: { id: body.key } })
    const files = await prisma.files.findMany({
      where: {
        AND: [
          { name: source.name.endsWith('.part001') ? { startsWith: source.name.replace(/\.part0*\d+$/, '.part') } : source.name },
          { user_id: req.user?.id },
          { parent_id: source.parent_id },
        ]
      }
    })

    const countExists = await prisma.files.count({
      where: {
        AND: [
          { name: source.name.endsWith('.part001') ? { startsWith: source.name.replace(/\.part0*\d+$/, ''), endsWith: '.part001' } : { startsWith: source.name } },
          { user_id: req.user?.id },
          { parent_id: body.parent_id }
        ]
      }
    })

    delete body.key
    let countFiles = 0
    for (const file of files) {
      const { forward_info: forwardInfo, message_id: messageId, mime_type: mimeType } = file
      let peerFrom: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
      let peerTo: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
      if (forwardInfo && forwardInfo.match(/^channel\//gi)) {
        const [type, peerId, _id, accessHash] = forwardInfo?.split('/') ?? []
        if (type === 'channel') {
          peerFrom = new Api.InputPeerChannel({
            channelId: bigInt(peerId),
            accessHash: accessHash ? bigInt(accessHash as string) : null })
        } else if (type === 'user') {
          peerFrom = new Api.InputPeerUser({
            userId: bigInt(peerId),
            accessHash: bigInt(accessHash as string) })
        } else if (type === 'chat') {
          peerFrom = new Api.InputPeerChat({
            chatId: bigInt(peerId) })
        }
      }
      const [type, peerId, _, accessHash] = ((req.user.settings as Prisma.JsonObject).saved_location as string).split('/')
      if ((req.user.settings as Prisma.JsonObject)?.saved_location) {
        if (type === 'channel') {
          peerTo = new Api.InputPeerChannel({
            channelId: bigInt(peerId),
            accessHash: accessHash ? bigInt(accessHash as string) : null })
        } else if (type === 'user') {
          peerTo = new Api.InputPeerUser({
            userId: bigInt(peerId),
            accessHash: bigInt(accessHash as string) })
        } else if (type === 'chat') {
          peerTo = new Api.InputPeerChat({
            chatId: bigInt(peerId) })
        }
      }

      const chat = await req.tg.invoke(new Api.messages.ForwardMessages({
        fromPeer: peerFrom || 'me',
        id: [Number(messageId)],
        toPeer: peerTo || 'me',
        randomId: [bigInt.randBetween('-1e100', '1e100')],
        silent: true,
        dropAuthor: true
      })) as any

      const newForwardInfo = peerTo ? `${type}/${peerId}/${chat.updates[0].id.toString()}/${accessHash}` : null
      const message = {
        size: Number(file.size),
        message_id: chat.updates[0].id.toString(),
        mime_type: mimeType,
        forward_info: newForwardInfo,
        uploaded_at: new Date(chat.date * 1000)
      }

      const response = await prisma.files.create({
        data: {
          ...body,
          name: files.length == 1 ? body.name + `${countExists ? ` (${countExists})` : ''}` : body.name.replace(/\.part0*\d+$/, '')+`${countExists ? ` (${countExists})` : ''}`+`.part${String(countFiles + 1).padStart(3, '0')}`,
          ...message
        }
      })
      if (countFiles++ == 0)
        res.send({ file: response })
    }
  }

  @Endpoint.GET('/:id', { middlewares: [AuthMaybe] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    const { password } = req.query
    const file = await prisma.files.findUnique({
      where: { id }
    })

    const parent = file?.parent_id ? await prisma.files.findUnique({
      where: { id: file.parent_id }
    }) : null
    if (!file || file.user_id !== req.user?.id && !file.sharing_options?.includes('*') && !file.sharing_options?.includes(req.user?.username)) {
      if (!parent?.sharing_options?.includes(req.user?.username) && !parent?.sharing_options?.includes('*')) {
        throw { status: 404, body: { error: 'File not found' } }
      }
    }
    file.signed_key = file.signed_key || parent?.signed_key

    if (file.password && req.user?.id !== file.user_id) {
      if (!password) {
        throw { status: 400, body: { error: 'Unauthorized' } }
      }
      if (!compareSync(password as string, file.password)) {
        throw { status: 400, body: { error: 'Wrong passphrase' } }
      }
    }

    let files = [file]
    if (/.*\.part0*1$/gi.test(file?.name)) {
      // if (req.user?.plan !== 'premium') {
      //   throw { status: 402, body: { error: 'Please upgrade your plan for view this file' } }
      // }
      files = await prisma.files.findMany({
        where: {
          AND: [
            {
              OR: [
                { id },
                { name: { startsWith: file.name.replace(/\.part0*1$/gi, '') } }
              ]
            },
            { user_id: file.user_id },
            { parent_id: file.parent_id || null }
          ]
        }
      })
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
    const file = await prisma.files.findFirst({
      where: {
        AND: [{ id }, { user_id: req.user.id }]
      },
    })
    if (!file) {
      throw { status: 404, body: { error: 'File not found' } }
    }
    await prisma.files.delete({ where: { id } })

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
      const files = await prisma.files.findMany({
        where: {
          AND: [
            {
              OR: [
                { id },
                { name: { startsWith: file.name.replace(/\.part0*1$/gi, '') } }
              ],
            },
            { user_id: file.user_id },
            { parent_id: file.parent_id || null }
          ]
        }
      })
      files.map(async (file: files) => {
        await prisma.files.delete({ where: { id: file.id } })
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

    const currentFile = await prisma.files.findFirst({
      where: {
        AND: [{ id }, { user_id: req.user.id }]
      }
    })
    if (!currentFile) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    const parent = file.parent_id ? await prisma.files.findUnique({
      where: { id: file.parent_id }
    }) : null

    let key: string = currentFile.signed_key || parent?.signed_key
    if (file.sharing_options?.length && !key) {
      key = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), FILES_JWT_SECRET).toString()
    }

    if (!file.sharing_options?.length && !currentFile.sharing_options?.length && !parent?.sharing_options?.length) {
      key = null
    }

    if (/.*\.part0*1$/gi.test(currentFile?.name)) {
      const files = await prisma.files.findMany({
        where: {
          AND: [
            {
              OR: [
                { id },
                { name: { startsWith: currentFile.name.replace(/\.part0*1$/gi, '') } }
              ]
            },
            { user_id: currentFile.user_id },
            { parent_id: currentFile.parent_id || null }
          ]
        }
      })
      await Promise.all(files.map(async current => await prisma.files.update({
        where: { id: current.id },
        data: {
          ...file.name ? { name: current.name.replace(current.name.replace(/\.part0*\d+$/gi, ''), file.name) } : {},
          ...file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {},
          ...file.parent_id !== undefined ? { parent_id: file.parent_id } : {},
          ...parent && current.type === 'folder' ? {
            sharing_options: parent.sharing_options
          } : {},
          signed_key: key,
          ...file.password !== undefined ? {
            password: file.password !== null ? hashSync(file.password, 10) : null
          } : {}
        }
      })))
    } else {
      await prisma.files.updateMany({
        where: {
          AND: [
            { id },
            { user_id: req.user.id }
          ],
        },
        data: {
          ...file.name ? { name: currentFile.name.replace(currentFile.name.replace(/\.part0*1$/gi, ''), file.name) } : {},
          ...file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {},
          ...file.parent_id !== undefined ? { parent_id: file.parent_id } : {},
          ...parent && currentFile.type === 'folder' ? {
            sharing_options: parent.sharing_options
          } : {},
          signed_key: key,
          ...file.password !== undefined ? {
            password: file.password !== null ? hashSync(file.password, 10) : null
          } : {}
        }
      })
    }

    if (file.sharing_options !== undefined && currentFile.type === 'folder') {
      const updateSharingOptions = async (currentFile: files) => {
        const children = await prisma.files.findMany({
          where: {
            AND: [
              { parent_id: currentFile.id },
              { type: 'folder' }
            ]
          }
        })
        for (const child of children) {
          await prisma.files.updateMany({
            where: {
              AND: [
                { id: child.id },
                { user_id: req.user.id }
              ]
            },
            data: {
              sharing_options: file.sharing_options,
              signed_key: key || child.signed_key,
              ...file.password !== undefined ? {
                password: file.password !== null ? hashSync(file.password, 10) : null
              } : {}
            }
          })
          await updateSharingOptions(child)
        }
      }
      await updateSharingOptions(currentFile)
    }

    return res.send({ file: { id } })
  }

  @Endpoint.POST('/upload/:id?', { middlewares: [Auth, multer().single('upload')] })
  public async upload(req: Request, res: Response): Promise<any> {
    const { name, size, mime_type: mimetype, parent_id: parentId, relative_path: relativePath, total_part: totalPart, part } = req.query as Record<string, string>

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

    // if ((!req.user?.plan || req.user?.plan === 'free') && /\.part\d+$/gi.test(name)) {
    //   throw { status: 402, body: { error: 'Payment required' } }
    // }

    let model: files

    if (req.params?.id) {
      model = await prisma.files.findUnique({
        where: { id: req.params.id }
      })
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

      let currentParentId = parentId
      if (relativePath) {
        const paths = relativePath.split('/').slice(0, -1) || []
        for (const i in paths) {
          const path = paths[i]
          const findFolder = await prisma.files.findFirst({
            where: {
              AND: [
                { type: 'folder' },
                { name: path },
                { parent_id: currentParentId || null }
              ]
            }
          })
          if (findFolder) {
            currentParentId = findFolder.id
          } else {
            const newFolder = await prisma.files.create({
              data: {
                name: path,
                type: 'folder',
                user_id: req.user.id,
                mime_type: 'teledrive/folder',
                uploaded_at: new Date(),
                ...currentParentId ? { parent_id: currentParentId } : {}
              }
            })
            currentParentId = newFolder.id
          }
        }
      }

      model = await prisma.files.findFirst({
        where: {
          name: name,
          mime_type: mimetype,
          size: Number(size),
          user_id: req.user.id,
          type: type,
          parent_id: currentParentId || null,
        }
      })

      if (model) {
        await prisma.files.update({
          data: {
            message_id: null,
            uploaded_at: null,
            upload_progress: 0
          },
          where: { id: model.id }
        })
      } else {
        model = await prisma.files.create({
          data: {
            name: name,
            mime_type: mimetype,
            size: Number(size),
            user_id: req.user.id,
            type: type,
            parent_id: currentParentId || null,
            upload_progress: 0,
            file_id: bigInt.randBetween('-1e100', '1e100').toString(),
            forward_info: (req.user.settings as Prisma.JsonObject)?.saved_location as string || null,
          }
        })
      }
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
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await req.tg?.connect()
        uploadPartStatus = await uploadPart()
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await req.tg?.connect()
        uploadPartStatus = await uploadPart()
      }
    }

    // model.size = bigInt(model.size).add(file.buffer.length).toString()
    await prisma.files.update({
      where: { id: model.id },
      data: {
        upload_progress: (Number(part) + 1) / Number(totalPart)
      }
    })

    if (Number(part) < Number(totalPart) - 1) {
      return res.status(202).send({ accepted: true, file: { id: model.id }, uploadPartStatus })
    }

    // begin to send
    const sendData = async (forceDocument: boolean) => {
      let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
      if ((req.user.settings as Prisma.JsonObject)?.saved_location) {
        const [type, peerId, _, accessHash] = ((req.user.settings as Prisma.JsonObject).saved_location as string).split('/')
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
      return await req.tg.sendFile(peer || 'me', {
        file: new Api.InputFileBig({
          id: bigInt(model.file_id),
          parts: Number(totalPart),
          name: model.name
        }),
        forceDocument,
        caption: model.name,
        fileSize: Number(model.size),
        attributes: forceDocument ? [
          new Api.DocumentAttributeFilename({ fileName: model.name })
        ] : undefined,
        workers: 1
      })
    }

    let data: Api.Message
    try {
      data = await sendData(false)
    } catch (error) {
      data = await sendData(true)
    }

    let forwardInfo = null
    if ((req.user.settings as Prisma.JsonObject)?.saved_location) {
      const [type, peerId, _, accessHash] = ((req.user.settings as Prisma.JsonObject).saved_location as string).split('/')
      forwardInfo = `${type}/${peerId}/${data.id?.toString()}/${accessHash}`
    }

    await prisma.files.update({
      data: {
        message_id: data.id?.toString(),
        uploaded_at: data.date ? new Date(data.date * 1000) : null,
        upload_progress: null,
        ...forwardInfo ? { forward_info: forwardInfo } : {}
      },
      where: { id: model.id }
    })

    return res.status(202).send({ accepted: true, file: { id: model.id } })
  }

  @Endpoint.POST('/uploadBeta/:id?', { middlewares: [Auth] })
  public async uploadBeta(req: Request, res: Response): Promise<any> {
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

    let model: files
    if (req.params?.id) {
      model = await prisma.files.findUnique({
        where: { id: req.params.id }
      })
      if (!model) {
        throw { status: 404, body: { error: 'File not found' } }
      }
    }

    if (!message) {
      // if ((!req.user?.plan || req.user?.plan === 'free') && /\.part\d+$/gi.test(name)) {
      //   throw { status: 402, body: { error: 'Payment required' } }
      // }

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
            const findFolder = await prisma.files.findFirst({
              where: {
                AND: [
                  { type: 'folder' },
                  { name: path },
                  { user_id: req.user.id },
                  { parent_id: currentParentId || null }
                ]
              }
            })
            if (findFolder) {
              currentParentId = findFolder.id
            } else {
              const newFolder = await prisma.files.create({
                data: {
                  name: path,
                  type: 'folder',
                  user_id: req.user.id,
                  mime_type: 'teledrive/folder',
                  ...currentParentId ? { parent_id: currentParentId } : {}
                }
              })
              currentParentId = newFolder.id
            }
          }
        }

        model = await prisma.files.findFirst({
          where: {
            name: name,
            mime_type: mimetype,
            size: Number(size),
            user_id: req.user.id,
            type: type,
            parent_id: currentParentId || null,
          }
        })

        if (model) {
          await prisma.files.update({
            data: {
              message_id: null,
              uploaded_at: null,
              upload_progress: 0
            },
            where: { id: model.id }
          })
        } else {
          model = await prisma.files.create({
            data: {
              name: name,
              mime_type: mimetype,
              size: Number(size),
              user_id: req.user.id,
              type: type,
              parent_id: currentParentId || null,
              upload_progress: 0,
              file_id: bigInt.randBetween('-1e100', '1e100').toString(),
              forward_info: (req.user.settings as Prisma.JsonObject)?.saved_location as string || null,
            }
          })
        }
      }

      // model.size = bigInt(model.size).add(file.buffer.length).toString()
      await prisma.files.update({
        data: {
          upload_progress: (Number(part) + 1) / Number(totalPart)
        },
        where: { id: model.id }
      })

      // if (Number(part) < Number(totalPart) - 1) {
      if (!message) {
        return res.status(202).send({ accepted: true, file: { id: model.id, file_id: model.file_id, name: model.name, size: model.size, type: model.type } })
      }
    }

    let forwardInfo: string
    if ((req.user.settings as Prisma.JsonObject)?.saved_location) {
      const [type, peerId, _, accessHash] = ((req.user.settings as Prisma.JsonObject).saved_location as string).split('/')
      forwardInfo = `${type}/${peerId}/${message.id?.toString()}/${accessHash}`
    }

    await prisma.files.update({
      data: {
        message_id: message.id?.toString(),
        uploaded_at: message.date ? new Date(message.date * 1000) : null,
        upload_progress: null,
        ...forwardInfo ? { forward_info: forwardInfo } : {}
      },
      where: { id: model.id }
    })
    return res.status(202).send({ accepted: true, file: { id: model.id, file_id: model.file_id, name: model.name, size: model.size, type: model.type } })
  }

  @Endpoint.GET('/breadcrumbs/:id', { middlewares: [AuthMaybe] })
  public async breadcrumbs(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    let folder = await prisma.files.findUnique({ where: { id } })
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
      folder = await prisma.files.findUnique({ where: { id: folder.parent_id } })
      if (!req.user && folder.sharing_options?.includes('*') || folder.sharing_options?.includes(req.user?.username) || folder.user_id === req.user?.id) {
        breadcrumbs.push(folder)
      }
    }

    return res.send({ breadcrumbs: breadcrumbs.reverse() })
  }

  @Endpoint.POST('/sync', { middlewares: [Auth] })
  public async sync(req: Request, res: Response): Promise<any> {
    const { parent_id: parentId, limit } = req.query

    // if (req.user.plan === 'free' || !req.user.plan) {
    //   throw { status: 402, body: { error: 'Payment required' } }
    // }

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if ((req.user.settings as Prisma.JsonObject)?.saved_location) {
      const [type, peerId, _, accessHash] = ((req.user.settings as Prisma.JsonObject).saved_location as string).split('/')
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
      const existFiles = await prisma.files.findMany({
        where: {
          AND: [
            {
              message_id: {
                in: files.map(file => file.id.toString())
              }
            },
            { parent_id: parentId as string || null },
            { forward_info: null }
          ]
        }
      })
      const filesWantToSave = files.filter(file => !existFiles.find(e => e.message_id == file.id))
      if (filesWantToSave?.length) {
        await prisma.files.createMany({
          data: filesWantToSave.map(file => {
            const mimeType = file.media.photo ? 'image/jpeg' : file.media.document.mimeType || 'unknown'
            const name = file.media.photo ? `${file.media.photo.id}.jpg` : file.media.document.attributes?.find((atr: any) => atr.fileName)?.fileName || `${file.media?.document.id}.${mimeType.split('/').pop()}`

            const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size
            const size = file.media.photo ? getSizes(file.media.photo.sizes.pop()) : file.media.document?.size
            let type = file.media.photo
            if (file.media.document?.mimeType.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
              type = 'video'
            } else if (file.media.document?.mimeType.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
              type = 'document'
            } else if (file.media.document?.mimeType.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
              type = 'audio'
            } else if (file.media.document?.mimeType.match(/^image/gi) || name.match(/\.jpg$/gi) || name.match(/\.jpeg$/gi) || name.match(/\.png$/gi) || name.match(/\.gif$/gi)) {
              type = 'image'
            }
            return {
              name,
              message_id: file.id.toString(),
              mime_type: mimeType,
              size: size.value,
              user_id: req.user.id,
              uploaded_at: new Date(file.date * 1000),
              type,
              parent_id: parentId ? parentId.toString() : null
            }
          })
        })
      }
    }
    return res.send({ files })
  }

  @Endpoint.POST('/filesSync', { middlewares: [Auth] })
  public async filesSync(req: Request, res: Response): Promise<any> {
    const { files } = req.body
    for (const file of files) {
      const existFile = await prisma.files.findFirst({
        where: {
          AND: [
            { name: file.name },
            { type: file.type },
            { size: Number(file.size) || null },
            {
              parent_id: file.parent_id ? { not: null } : null
            }
          ]
        }
      })
      if (!existFile) {
        try {
          await prisma.files.create({
            data: {
              ...file,
              size: Number(file.size),
              user_id: req.user.id,
            }
          })
        } catch (error) {
          // ignore
        }
      }
    }
    return res.status(202).send({ accepted: true })
  }

  public static async download(req: Request, res: Response, files: files[], onlyHeaders?: boolean): Promise<any> {
    const { raw, dl, thumb, as_array: asArray } = req.query

    let usage = await prisma.usages.findFirst({
      where: {
        key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] as string || req.ip}`
      }
    })
    if (!usage) {
      usage = await prisma.usages.create({
        data: {
          key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] as string || req.ip}`,
          usage: 0,
          expire: moment().add(1, 'day').toDate()
        }
      })
    }

    if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {   // is expired
      usage = await prisma.usages.update({
        data: {
          expire: moment().add(1, 'day').toDate(),
          usage: 0
        },
        where: { key: usage.key }
      })
    }

    const totalFileSize = files.reduce((res, file) => res.add(file.size || 0), bigInt(0))

    if (!raw || Number(raw) === 0) {
      const { signed_key: _, ...result } = files[0]
      return res.send({ file: { ...result, password: result.password ? '[REDACTED]' : null } })
    }

    usage = await prisma.usages.update({
      data: {
        usage: bigInt(totalFileSize).add(bigInt(usage.usage)).toJSNumber()
      },
      where: { key: usage.key }
    })
    if (asArray === '1') {
      return res.send({ files })
    }

    console.log(req.headers.range)

    let cancel = false
    req.on('close', () => cancel = true)

    const ranges = req.headers.range ? req.headers.range.replace(/bytes\=/gi, '').split('-').map(Number) : null

    if (onlyHeaders) return res.status(200)

    const filename = (prefix: string = '') => `${CACHE_DIR}/${prefix}${totalFileSize.toString()}_${files[0].name}`
    try {
      mkdirSync(`${CACHE_DIR}`, { recursive: true })
    } catch (error) {
      // ignore
    }

    const cachedFiles = () => readdirSync(`${CACHE_DIR}`)
      .filter(filename =>
        statSync(`${CACHE_DIR}/${filename}`).isFile()
      ).sort((a, b) =>
        new Date(statSync(`${CACHE_DIR}/${a}`).birthtime).getTime()
          - new Date(statSync(`${CACHE_DIR}/${b}`).birthtime).getTime()
      )
    const getCachedFilesSize = () => cachedFiles().reduce((res, file) => res + statSync(`${CACHE_DIR}/${file}`).size, 0)

    if (existsSync(filename())) {
      if (ranges) {
        const start = ranges[0]
        const end = ranges[1] ? ranges[1] : totalFileSize.toJSNumber() - 1

        const readStream = createReadStream(filename(), { start, end })
        res.writeHead(200, {
          'Cache-Control': 'public, max-age=604800',
          'ETag': Buffer.from(`${files[0].id}:${files[0].message_id}`).toString('base64'),
          'Content-Range': `bytes ${start}-${end}/${totalFileSize}`,
          'Content-Disposition': contentDisposition(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }),
          'Content-Type': files[0].mime_type,
          'Content-Length': end - start + 1,
          'Accept-Ranges': 'bytes',
        })
        readStream.pipe(res)
      } else {
        res.writeHead(200, {
          'Cache-Control': 'public, max-age=604800',
          'ETag': Buffer.from(`${files[0].id}:${files[0].message_id}`).toString('base64'),
          'Content-Range': `bytes */${totalFileSize}`,
          'Content-Disposition': contentDisposition(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }),
          'Content-Type': files[0].mime_type,
          'Content-Length': totalFileSize.toString(),
          'Accept-Ranges': 'bytes',
        })
        const readStream = createReadStream(filename())
        readStream
          .on('open', () => readStream.pipe(res))
          .on('error', msg => res.end(msg))
      }
      return
    }

    // res.setHeader('Cache-Control', 'public, max-age=604800')
    // res.setHeader('ETag', Buffer.from(`${files[0].id}:${files[0].message_id}`).toString('base64'))
    res.setHeader('Content-Range', `bytes */${totalFileSize}`)
    res.setHeader('Content-Disposition', contentDisposition(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }))
    res.setHeader('Content-Type', files[0].mime_type)
    res.setHeader('Content-Length', totalFileSize.toString())
    res.setHeader('Accept-Ranges', 'bytes')

    let downloaded: number = 0

    // Sort the files based on their ".part" number
    files.sort((a, b) => {
      const aPart = Number(a.name.match(/\.part(\d+)$/i)?.[1] || 0)
      const bPart = Number(b.name.match(/\.part(\d+)$/i)?.[1] || 0)
      return aPart - bPart
    })
    try {
      writeFileSync(filename('process-'), '')
    } catch (error) {
      // ignore
    }

    let countFiles = 1
    for (const file of files) {
      let chat
      if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
        const [type, peerId, id, accessHash] = file.forward_info.split('/')
        let peer
        if (type === 'channel') {
          peer = new Api.InputPeerChannel({
            channelId: bigInt(peerId),
            accessHash: bigInt(accessHash as string)
          })
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
      const getData = async () => await req.tg.downloadMedia(chat['messages'][0].media, {
        ...thumb ? { thumb: 0 } : {},
        outputFile: {
          write: (buffer: Buffer) => {
            downloaded += buffer.length
            if (cancel) {
              throw { status: 422, body: { error: 'canceled' } }
            } else {
              console.log(`${chat['messages'][0].id} ${downloaded}/${chat['messages'][0].media.document.size.value} (${downloaded / Number(totalFileSize) * 100 + '%'})`)
              try {
                appendFileSync(filename('process-'), buffer)
              } catch (error) {
                // ignore
              }
              res.write(buffer)
            }
          },
          close: () => {
            console.log(`${chat['messages'][0].id} ${downloaded}/${chat['messages'][0].media.document.size.value} (${downloaded / Number(totalFileSize) * 100 + '%'})`, '-end-')
            if (countFiles++ >= files.length) {
              try {
                const { size } = statSync(filename('process-'))
                if (totalFileSize.gt(bigInt(size))) {
                  rmSync(filename('process-'))
                } else {
                  renameSync(filename('process-'), filename())
                }
              } catch (error) {
                // ignore
              }
              res.end()
            }
          }
        }
      })
      try {
        await getData()
      } catch (error) {
        console.log(error)
      }
    }
    usage = await prisma.usages.update({
      data: {
        usage: bigInt(totalFileSize).add(bigInt(usage.usage)).toJSNumber()
      },
      where: { key: usage.key }
    })

    while (CACHE_FILES_LIMIT < getCachedFilesSize()) {
      try {
        rmSync(`${CACHE_DIR}/${cachedFiles()[0]}`)
      } catch {
        // ignore
      }
    }

    // res.end()
  }

  public static async initiateSessionTG(req: Request, files?: files[]): Promise<any[]> {
    if (!files?.length) {
      throw { status: 404, body: { error: 'File not found' } }
    }

    let data: { file: { id: string }, session: string }
    try {
      data = JSON.parse(AES.decrypt(files[0].signed_key, FILES_JWT_SECRET).toString(enc.Utf8))
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