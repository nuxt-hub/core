import { randomUUID } from 'node:crypto'

export default defineWebSocketHandler({
  async upgrade(request) {
    await requireUserSession(request)
  },
  async open(peer) {
    const { user } = await requireUserSession(peer)

    peer.send({ id: randomUUID(), username: 'server', content: `Welcome ${user.username}!` })
    peer.publish('chat', { id: randomUUID(), username: 'server', content: `${user.username} joined the chat!` })
    peer.subscribe('chat')
  },
  message(peer, message) {
    // heartbeat
    if (message.text().includes('ping')) {
      peer.send('pong')
      return
    }
    const msg = message.json()
    msg.id = randomUUID()
    // Chat message
    peer.send(msg) // echo
    peer.publish('chat', msg)
  },
  async close(peer) {
    const { user } = await getUserSession(peer)
    peer.publish('chat', { id: randomUUID(), username: 'server', content: `${user.username || peer} left!` })
  },
  error(peer, error) {
    console.error('error on WS', peer, error)
  }
})
