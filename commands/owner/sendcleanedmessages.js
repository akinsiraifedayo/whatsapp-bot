const fs = require('fs')
const path = require('path')
const readline = require('readline')

module.exports = {
    name: 'sendcleanedmessages',
    description: 'Send cleaned messages to a specific group',
    usage: '!sendcleanedmessages "Group Name"',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, from, isGroup, text }) {
        if (isGroup) return

        // Parse group name from command
        const match = text.match(/^!sendcleanedmessages\s+"([^"]+)"/)

        if (!match) {
            return await sock.sendMessage(from, {
                text: '❗ Usage:\n!sendcleanedmessages "Group Name"\n\nExample:\n!sendcleanedmessages "Tech Group"'
            })
        }

        const groupName = match[1].trim()

        try {
            const inputPath = path.join(__dirname, '..', '..', 'cleaned_messages.txt')
            if (!fs.existsSync(inputPath)) {
                return await sock.sendMessage(from, {
                    text: `❌ Extracted file not found. Make sure cleaned_messages.txt exists at ${inputPath}`
                })
            }

            // Fetch all participating groups
            const allGroups = await sock.groupFetchAllParticipating()
            const targetGroup = Object.values(allGroups).find(
                g => g.subject.toLowerCase() === groupName.toLowerCase()
            )

            if (!targetGroup) {
                return await sock.sendMessage(from, {
                    text: `❌ Group "${groupName}" not found. Make sure the bot is in that group.`
                })
            }

            await sock.sendMessage(from, {
                text: `⏳ Starting to send messages to "${targetGroup.subject}"...`
            })

            // Read file line-by-line efficiently
            const fileStream = fs.createReadStream(inputPath, { encoding: 'utf-8' })
            const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

            let currentMessage = ''
            let messageCount = 0

            for await (const line of rl) {
                const lineMatch = line.match(/^\[\d+\]/)

                // if new numbered message starts, send the previous one
                if (lineMatch && currentMessage.trim()) {
                    await sock.sendMessage(targetGroup.id, { text: currentMessage.trim() })
                    messageCount++
                    currentMessage = ''
                    await new Promise(res => setTimeout(res, 3000)) // delay between messages
                }

                currentMessage += line + '\n'
            }

            // send the last message if any
            if (currentMessage.trim()) {
                await sock.sendMessage(targetGroup.id, { text: currentMessage.trim() })
                messageCount++
            }

            await sock.sendMessage(from, {
                text: `✅ Done! Sent ${messageCount} message(s) to "${targetGroup.subject}".\n\nUse !sendpdf "Group Name" to send the PDF.`
            })

        } catch (err) {
            console.error(err)
            await sock.sendMessage(from, {
                text: '❌ Failed to process extracted messages. Error: ' + err.message
            })
        }
    }
}
