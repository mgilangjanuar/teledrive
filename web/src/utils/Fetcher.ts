import axios from 'axios'

export const apiUrl = `${process.env.REACT_APP_API_URL || ''}/api/v1`

export const req = axios.create({
  baseURL: apiUrl,
  withCredentials: true
})

export const fetcher = async (url: string, authorization?: string): Promise<any> => {
  const fetch = async () => {
    const { data } = await req.get(url, {
      ...authorization ? { headers: { authorization: `Bearer ${authorization}` } } : {},
      withCredentials: true })
    return data
  }

  const execute = async () => {
    try {
      return await fetch()
    } catch ({ response }) {
      if ((response as any)?.status === 401) {
        try {
          await req.post('/auth/refreshToken')
          return await fetch()
        } catch (error) {
          throw response
        }
      } else if ((response as any)?.status === 429) {
        await new Promise(res => setTimeout(res, (response as any).headers['retry-after']))
        // return await fetch()
        return await execute()
      }
      throw response
    }
  }
  return await execute()
}