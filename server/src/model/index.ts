
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import * as PostgressConnectionStringParser from 'pg-connection-string'
import {
  Connection,
  ConnectionOptions,
  createConnection,
  EntityTarget,
  getRepository as _getRepository,
  Repository
} from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { BaseModel } from './base/BaseModel'

type Connections = string
export const getRepository = <Entity>(
  entity: EntityTarget<Entity>, connection: Connections = 'default'): Repository<Entity> => _getRepository(entity, connection)

export class DB {
  private _connection: Connection

  public constructor(private _opts: ConnectionOptions, private _BaseModels?: { useConnection: (connection: Connection) => void }) {}

  public async build(): Promise<void> {
    this._connection = await createConnection(this._opts)
    this._BaseModels.useConnection(this._connection)
  }
}

export const runDB = async (): Promise<void> => {

  const creds = {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
  }

  if (process.env.DATABASE_URL) {
    const connectionOptions = PostgressConnectionStringParser.parse(process.env.DATABASE_URL)
    creds.host = connectionOptions.host
    creds.database = connectionOptions.database
    creds.password = connectionOptions.password
    creds.port = Number(connectionOptions.port) || 5432
    creds.username = connectionOptions.user
  }

  // init the default DB for each class that extends BaseModel
  await new DB({
    ...creds,
    type: 'postgres',
    ssl: process.env.DB_USE_SSL === 'true' ? {
      cert: readFileSync(`${__dirname}/../${process.env.DB_CERT || 'client-cert.pem'}`, 'utf-8'),
      key: readFileSync(`${__dirname}/../${process.env.DB_KEY || 'client-key.pem'}`, 'utf-8'),
      ca: readFileSync(`${__dirname}/../${process.env.DB_CA || 'server-ca.pem'}`, 'utf-8'),
      rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true'
    } : process.env.USE_PSQL_HEROKU ? {
      rejectUnauthorized: false
    } : false,
    schema: 'public',
    synchronize: false,
    logging: process.env.ENV !== 'production',
    entities: [`${__dirname}/entities/*.js`],
    subscribers: [`${__dirname}/subscriber/*.js`],
    migrations: [
      `${__dirname}/migrations/*.js`
    ],
    cli: {
      'migrationsDir': 'src/model/migrations'
    },
    namingStrategy: new SnakeNamingStrategy()
  }, BaseModel).build()
}

// hacky way for parse the value in int8 type columns
// types.setTypeParser(types.builtins.INT8, (value: string) => bigInt(value))

export const prisma = new PrismaClient()