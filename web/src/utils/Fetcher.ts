import axios from 'axios'

export const apiUrl = `${process.env.REACT_APP_API_URL || ''}/api/v1`

export const req = axios.create({
  baseURL: apiUrl,
  withCredentials: true
})

export const fetcher = async (url: string, authorization?: string): Promise<any> => {
  try {
    const { data } = await req.get(url, {
      ...authorization ? { headers: { authorization: `Bearer ${authorization}` } } : {},
      withCredentials: true })
    return data
  } catch ({ response }) {
    throw response
  }
}