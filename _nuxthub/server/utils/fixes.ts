import type { H3Event } from 'h3'

// Coming from https://github.com/unjs/h3/issues/561#issuecomment-1918679793
export async function readFormDataFixed(event: H3Event) : Promise<FormData> {
  const request = new Request(getRequestURL(event), {
    // @ts-ignore Undici option
    duplex: 'half',
    method: event.method,
    headers: event.headers,
    body: await readRawBody(event),
  } as RequestInit)
  return await request.formData()
}