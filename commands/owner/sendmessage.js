const fs = require('fs')
const path = require('path')
const { getMessage, getMessageCount } = require('../../lib/pdfGenerator')

module.exports = {
    name: 'sendmessage',
    description: 'Send specific message(s) from cleaned_messages.txt',
    usage: '!sendmessage <num> OR !sendmessage <start>-<end> "Group Name"',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, from, text }) {
        const inputPath = path.join(__dirname, '..', '..', 'cleaned_messages.txt')

        if (!fs.existsSync(inputPath)) {
            return await sock.sendMessage(from, {
                text: '❌ cleaned_messages.txt not found. Use !extractchat first.'
            })
        }

        const totalMessages = getMessageCount(inputPath)

        // Pattern 1: !sendmessage 5 (single message to self)
        // Pattern 2: !sendmessage 5-10 "Group" (range to group)
        // Pattern 3: !sendmessage 5-end "Group" (from 5 to end to group)

        // Check for range + group pattern first
        const rangeGroupMatch = text.match(/^!sendmessage\s+(\d+)-(\d+|end)\s+"([^"]+)"/)
        if (rangeGroupMatch) {
            const start = parseInt(rangeGroupMatch[1])
            const end = rangeGroupMatch[2] === 'end' ? totalMessages : parseInt(rangeGroupMatch[2])
            const groupName = rangeGroupMatch[3].trim()

            if (start < 1 || start > totalMessages || end < start || end > totalMessages) {
                return await sock.sendMessage(from, {
                    text: `❌ Invalid range. File has ${totalMessages} messages (1-${totalMessages}).`
                })
            }

            // Find group
            const allGroups = await sock.groupFetchAllParticipating()
            const targetGroup = Object.values(allGroups).find(
                g => g.subject.toLowerCase() === groupName.toLowerCase()
            )

            if (!targetGroup) {
                return await sock.sendMessage(from, {
                    text: `❌ Group "${groupName}" not found.`
                })
            }

            await sock.sendMessage(from, {
                text: `⏳ Sending messages ${start}-${end} to "${targetGroup.subject}"...`
            })

            // Send range of messages
            for (let i = start; i <= end; i++) {
                const messageText = getMessage(inputPath, i)
                if (messageText) {
                    await sock.sendMessage(targetGroup.id, { text: messageText })
                    if (i < end) {
                        await new Promise(res => setTimeout(res, 3000)) // delay between messages
                    }
                }
            }

            return await sock.sendMessage(from, {
                text: `✅ Sent messages ${start}-${end} (${end - start + 1} messages) to "${targetGroup.subject}".`
            })
        }

        // Check for single message pattern (to self)
        const singleMatch = text.match(/^!sendmessage\s+(\d+|first)$/)
        if (singleMatch) {
            const messageNum = singleMatch[1].toLowerCase() === 'first' ? 1 : parseInt(singleMatch[1])

            if (messageNum < 1 || messageNum > totalMessages) {
                return await sock.sendMessage(from, {
                    text: `❌ Invalid message number. File has ${totalMessages} messages (1-${totalMessages}).`
                })
            }

            const messageText = getMessage(inputPath, messageNum)
            if (!messageText) {
                return await sock.sendMessage(from, {
                    text: `❌ Could not find message #${messageNum}.`
                })
            }

            // Send to the person who requested
            await sock.sendMessage(from, { text: messageText })
            return
        }

        // No pattern matched - show usage
        return await sock.sendMessage(from, {
            text: `❗ Usage:

*Send to yourself:*
!sendmessage 1
!sendmessage first

*Send range to group:*
!sendmessage 5-10 "Group Name"
!sendmessage 5-end "Group Name"

📊 File has ${totalMessages} messages (1-${totalMessages}).`
        })
    }
}
