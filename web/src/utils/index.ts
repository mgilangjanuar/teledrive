import axios from 'axios'

export const temporaryFetcher = (url: string): Promise<any> =>
  fetch(url).then((res) => res.json())

export function chunk<T>(arr: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) throw 'Invalid chunk size'

  const R = []

  for (let i = 0, len = arr.length; i < len; i += chunkSize) {
    R.push(arr.slice(i, i + chunkSize))
  }

  return R
}

export const req = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || ''}/api/v1`
})

export const fetcher = async (url: string, authorization?: string): Promise<any> => {
  try {
    const { data } = await req.get(url, authorization ? { headers: { authorization: `Bearer ${authorization}` } } : undefined)
    return data
  } catch ({ response }) {
    return response
  }
}