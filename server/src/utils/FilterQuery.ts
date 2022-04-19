import { unescape } from 'querystring'

export async function filterQuery<T = any>(base: Record<string, any>, query: Record<string, any>): Promise<T> {
  const { page, size, ...filters } = query

  for (const param of Object.keys(filters)) {
    const [column, op] = param.split(/(.+)\./).slice(1)
    if (param.match(/^sort\./gi)) {
      const col = param.replace(/^sort\./gi, '')
      base = base.order(col as keyof T, {
        ascending: filters[param].toLowerCase() === 'asc' || filters[param].toLowerCase() === 'ascending' })
    } else {
      base = base.filter(column as keyof T, op || 'eq' as any, filters[param])
    }
  }

  if (page && size) {
    base = base.range(Number(size) * Number(page),
      Number(size) * Number(page) + Number(size) - 1)
  }

  const result = await base
  if (result.error) {
    throw { status: result.status, body: { error: result.error.message, details: result } }
  }
  return result.data
}

export function buildWhereQuery(data: Record<string, any>, prefix: string = '',  join: 'and' | 'or' = 'and'): string {
  const res = Object.keys(data).reduce((res, key) => {
    let item = ''

    const [column, op] = key.split(/(.+)\./).filter(Boolean)
    let value = data[key]
    try {
      value = value ? unescape(value) : value
    } catch (error) {
      // ignore
    }
    if (!op) {
      item = `${prefix}${column} = '${value.trim()}'`
    } else if (op === 'lt') {
      item = `${prefix}${column} < '${value.trim()}'`
    } else if (op === 'lte') {
      item = `${prefix}${column} <= '${value.trim()}'`
    } else if (op === 'gt') {
      item = `${prefix}${column} > '${value.trim()}'`
    } else if (op === 'gte') {
      item = `${prefix}${column} >= '${value.trim()}'`
    } else if (op === 'between') {
      const [from, to] = value.trim().split('_')
      item = `${prefix}${column} between '${from.trim()}' and '${to.trim()}'`
    } else if (op === 'match') {
      item = `${prefix}${column} ~ '${value.trim()}'`
    } else if (op === 'notmatch') {
      item = `${prefix}${column} !~ '${value.trim()}'`
    } else if (op === 'like') {
      item = `${prefix}${column} like '${value.trim()}'`
    } else if (op === 'ilike') {
      item = `${prefix}${column} ilike '${value.trim()}'`
    } else {
      item = `${prefix}${column} ${op} ${value.trim()}`
    }
    return [...res, item]
  }, []).join(` ${join} `)
  return res
}

export function buildSort(sort?: string, prefix: string = ''): Record<string, any> {
  return sort?.split(',').reduce((res, data) => {
    const [column, order] = data.split(':')
    return { ...res, [`${prefix}${column}`]: order?.toLowerCase() || 'asc' }
  }, {}) || {}
}