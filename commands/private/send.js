module.exports = {
    name: 'send',
    description: 'Send message to a specific group from private chat',
    usage: '!send "Group Name" Message',
    category: 'private',
    privateOnly: true,

    async execute({ sock, from, text, isGroup }) {
        if (isGroup) return

        // Parse command: !send "Group Name" message
        const match = text.match(/^!send\s+"([^"]+)"\s+([\s\S]+)/)

        if (!match) {
            return await sock.sendMessage(from, {
                text: '❗ Correct usage:\n!send "Group Name" Your message here'
            })
        }

        const groupName = match[1].trim()
        const message = match[2].trim()

        try {
            // Fetch all groups the bot participates in
            const allGroups = await sock.groupFetchAllParticipating()
            // Find group by name (case-insensitive)
            const matchedGroup = Object.values(allGroups).find(g =>
                g.subject.toLowerCase() === groupName.toLowerCase()
            )

            if (!matchedGroup) {
                return await sock.sendMessage(from, {
                    text: `❌ Group "${groupName}" not found. Make sure the bot is in the group.`
                })
            }

            // Mention all group participants
            const mentions = matchedGroup.participants.map(p => p.id)

            // Send message to the group
            await sock.sendMessage(matchedGroup.id, {
                text: message,
                mentions
            })

            // Confirm to user that message was sent
            await sock.sendMessage(from, {
                text: `✅ Message sent to "${matchedGroup.subject}"`
            })
        } catch (err) {
            console.error(err)
            await sock.sendMessage(from, {
                text: '❌ Failed to send message. Check console for details.'
            })
        }
    }
}
