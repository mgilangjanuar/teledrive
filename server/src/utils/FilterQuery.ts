export async function filterQuery<T = any>(base: Record<string, any>, query: Record<string, any>): Promise<T> {
  const { page, size, sort, ...filters } = query

  for (const param of Object.keys(filters)) {
    const [column, op] = param.split('.')
    base = base.filter(column as keyof T, op || 'eq' as any, filters[param])
  }

  if (page && size) {
    base = base.range(Number(size) * Number(page),
      Number(size) * Number(page) + Number(size) - 1)
  }

  if (sort) {
    const [column, type] = sort.toString().split('.')
    base = base.order(column as keyof T, { ascending: !type || type.toLowerCase() === 'asc' || type.toLowerCase() === 'ascending' })
  }

  const { data } = await base
  return data
}