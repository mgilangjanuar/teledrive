const fs = require('fs')
const { execSync } = require('child_process')

const root = fs.readFileSync('./package.json', 'utf-8')
const rootObj = JSON.parse(root)
rootObj.version = process.argv[2]
fs.writeFileSync('./package.json', JSON.stringify(rootObj, null, 2))

const api = fs.readFileSync('./api/package.json', 'utf-8')
const apiObj = JSON.parse(api)
apiObj.version = process.argv[2]
fs.writeFileSync('./api/package.json', JSON.stringify(apiObj, null, 2))
// execSync('cd ./server && yarn install && cd ..')

const web = fs.readFileSync('./web/package.json', 'utf-8')
const webObj = JSON.parse(web)
webObj.version = process.argv[2]
fs.writeFileSync('./web/package.json', JSON.stringify(webObj, null, 2))
// execSync('cd ./web && yarn install && cd ..')

const webVersion = fs.readFileSync('./web/src/utils/Constant.ts', 'utf-8')
fs.writeFileSync('./web/src/utils/Constant.ts', webVersion.replace(/export const VERSION \= \'.*\'/, `export const VERSION = '${process.argv[2]}'`))

execSync('yarn install && yarn workspaces run build')
execSync(`git add . && git commit -m "${process.argv[2]}"`)