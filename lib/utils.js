exports.mentionAll = async (sock, groupJid) => {
    const groupMetadata = await sock.groupMetadata(groupJid)
    const mentions = groupMetadata.participants.map(p => p.id)
    const tagMessage = '👋 ' + mentions.map(u => '@' + u.split('@')[0]).join(' ')
    await sock.sendMessage(groupJid, { text: tagMessage, mentions })
}
