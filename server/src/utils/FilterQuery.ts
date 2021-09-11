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

export function buildWhereQuery(data: Record<string, any>): string {
  const res = Object.keys(data).reduce((res, key) => {
    let item = ''

    const [column, op] = key.split(/(.+)\./).filter(Boolean)
    if (!op) {
      item = `${column} = '${data[key].trim()}'`
    } else if (op === 'lt') {
      item = `${column} < '${data[key].trim()}'`
    } else if (op === 'lte') {
      item = `${column} <= '${data[key].trim()}'`
    } else if (op === 'gt') {
      item = `${column} > '${data[key].trim()}'`
    } else if (op === 'gte') {
      item = `${column} >= '${data[key].trim()}'`
    } else if (op === 'between') {
      const [from, to] = data[key].trim().split('_')
      item = `${column} between '${from.trim()}' and '${to.trim()}'`
    } else {
      item = `${column} ${op} ${data[key].trim()}`
    }
    return [...res, item]
  }, []).join(' and ')
  return res
}

export function buildSort(sort?: string): Record<string, any> {
  return sort?.split(',').reduce((res, data) => {
    const [column, order] = data.split(':')
    return { ...res, [column]: order?.toUpperCase() || 'ASC' }
  }, {}) || {}
}