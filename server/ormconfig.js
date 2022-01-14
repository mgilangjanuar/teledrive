require('dotenv').config()
const { SnakeNamingStrategy } = require('typeorm-naming-strategies')

const readFileSync = require('fs').readFileSync

module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
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
  logging: true,
  entities: [`${__dirname}/entities/*.js`],
  subscribers: [`${__dirname}/subscriber/*.js`],
  migrations: [
    `${__dirname}/migrations/*.js`
  ],
  cli: {
    'migrationsDir': 'src/model/migrations'
  },
  namingStrategy: new SnakeNamingStrategy(),
  // ...process.env.REDIS_URI ? {
  //   cache: {
  //     type: 'redis',
  //     options: process.env.REDIS_URI
  //   }
  // } : {}
}