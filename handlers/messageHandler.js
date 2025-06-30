const { mentionAll } = require('../lib/utils')

module.exports = async function handleMessage(sock, msg) {
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    // 🔹 Handle commands first
    if (text.startsWith('!all') && isGroup) {
        return await mentionAll(sock, from)
    }

    if (text === '!ping') {
        return await sock.sendMessage(from, { text: '🏓 Pong!' })
    }

    // 🔹 Silent tag for all group messages (non-command)
    if (isGroup) {
        const groupMetadata = await sock.groupMetadata(from)
        const mentions = groupMetadata.participants.map(p => p.id)

        return await sock.sendMessage(from, {
            text,
            mentions
        })
    }
}
