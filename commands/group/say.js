module.exports = {
    name: 'say',
    description: 'Bot sends message with silent mentions to all group members',
    usage: '!say [message]',
    category: 'group',
    groupOnly: true,

    async execute({ sock, from, args, isGroup }) {
        if (!isGroup) return

        const message = args.trim()
        if (!message) {
            return await sock.sendMessage(from, {
                text: '❗ Usage: !say Your message here'
            })
        }

        // Fetch group participants for mentions
        const groupMetadata = await sock.groupMetadata(from)
        const mentions = groupMetadata.participants.map(p => p.id)

        await sock.sendMessage(from, {
            text: message,
            mentions
        })
    }
}
