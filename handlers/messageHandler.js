const { mentionAll } = require('../lib/utils')

// In-memory store to track multi-tag state per group
const { getMultiTag, setMultiTag } = require('../lib/settings')

module.exports = async function handleMessage(sock, msg) {
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = msg.key.participant || msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    // 🔘 Multi-tag toggle command
    if (text === '!multitag on' && isGroup) {
        multiTagStatus.set(from, true)
        return await sock.sendMessage(from, { text: '✅ Multi-tag is now ON (everyone will be silently tagged).' })
    }

    if (text === '!multitag off' && isGroup) {
        multiTagStatus.set(from, false)
        return await sock.sendMessage(from, { text: '🚫 Multi-tag is now OFF.' })
    }

    // 🧠 Mention everyone visibly
    if (text.startsWith('!all') && isGroup) {
        return await mentionAll(sock, from)
    }

    // 📶 Ping command
    if (text === '!ping') {
        return await sock.sendMessage(from, { text: '🏓 Pong!' })
    }

    // 💬 Echo with invisible mention if multi-tag is enabled
    if (isGroup && getMultiTag(from)) {
        const groupMetadata = await sock.groupMetadata(from)
        const mentions = groupMetadata.participants.map(p => p.id)
        return await sock.sendMessage(from, { text, mentions })
    }
}
