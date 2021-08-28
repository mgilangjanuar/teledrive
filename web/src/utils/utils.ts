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
