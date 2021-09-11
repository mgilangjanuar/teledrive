import axios from 'axios'

export const req = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || ''}/api/v1`,
  withCredentials: true
})

export const fetcher = async (url: string, authorization?: string): Promise<any> => {
  try {
    const { data } = await req.get(url, {
      ...authorization ? { headers: { authorization: `Bearer ${authorization}` } } : {},
      withCredentials: true })
    return data
  } catch ({ response }) {
    return response
  }
}