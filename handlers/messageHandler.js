const { mentionAll } = require('../lib/utils')

module.exports = async function handleMessage(sock, msg) {
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    if (text.startsWith('!all') && isGroup) {
        await mentionAll(sock, from)
    }

    // Add more commands here
    else if (text === '!ping') {
        await sock.sendMessage(from, { text: '🏓 Pong!' })
    }
}
