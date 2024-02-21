import { eventHandler, sendNoContent } from 'h3'

export default eventHandler((event) => sendNoContent(event))
