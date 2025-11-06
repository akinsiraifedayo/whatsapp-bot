module.exports = {
    name: 'sendtogroups',
    description: 'Send message to all groups matching a name prefix',
    usage: '!sendtogroups "Group Prefix" Message',
    category: 'private',
    privateOnly: true,

    async execute({ sock, from, text, isGroup }) {
        if (isGroup) return

        const match = text.match(/^!sendtogroups\s+"([^"]+)"\s+([\s\S]+)/)

        if (!match) {
            return await sock.sendMessage(from, {
                text: '❗ Usage:\n!sendtogroups "Group Prefix" Your message'
            })
        }

        const prefix = match[1].toLowerCase()
        const message = match[2].trim()

        if (!prefix || !message) {
            return await sock.sendMessage(from, {
                text: '❗ Provide both group name prefix and message.'
            })
        }

        try {
            const allGroups = await sock.groupFetchAllParticipating()
            const matchedGroups = Object.values(allGroups).filter(g =>
                g.subject.toLowerCase().startsWith(prefix)
            )

            if (matchedGroups.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ No groups found starting with "${prefix}".`
                })
            }

            for (const group of matchedGroups) {
                const mentions = group.participants.map(p => p.id)

                await sock.sendMessage(group.id, {
                    text: message,
                    mentions
                })

                await new Promise(res => setTimeout(res, 3000)) // prevent spam flag
            }

            await sock.sendMessage(from, {
                text: `✅ Message sent to ${matchedGroups.length} group(s) starting with "${prefix}".`
            })
        } catch (err) {
            console.error(err)
            await sock.sendMessage(from, {
                text: '❌ Failed to send messages. See console for details.'
            })
        }
    }
}
