module.exports = {
    name: 'sendtoallgroups',
    description: 'Send message to all groups from private chat',
    usage: '!sendtoallgroups Message',
    category: 'private',
    privateOnly: true,

    async execute({ sock, from, args, isGroup }) {
        if (isGroup) return

        const message = args.trim()
        if (!message) {
            return await sock.sendMessage(from, {
                text: '❗ Usage:\n!sendtoallgroups Your message here'
            })
        }

        try {
            const allGroups = await sock.groupFetchAllParticipating()
            const groupArray = Object.values(allGroups)

            for (const group of groupArray) {
                const mentions = group.participants.map(p => p.id)

                await sock.sendMessage(group.id, {
                    text: message,
                    mentions
                })

                // Small delay to avoid being flagged as spam
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            await sock.sendMessage(from, {
                text: `✅ Message sent to ${groupArray.length} group(s).`
            })
        } catch (err) {
            console.error(err)
            await sock.sendMessage(from, {
                text: '❌ Failed to send to all groups. Check console for details.'
            })
        }
    }
}
