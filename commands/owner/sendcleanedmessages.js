const fs = require('fs')
const path = require('path')
const readline = require('readline')

module.exports = {
    name: 'sendcleanedmessages',
    description: 'Send cleaned messages from file to "cleanedmessages" group',
    usage: '!sendcleanedmessages',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, from, isGroup }) {
        if (isGroup) return

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
                g => g.subject.toLowerCase() === 'cleanedmessages'
            )

            if (!targetGroup) {
                return await sock.sendMessage(from, {
                    text: '❌ Group "CLEANEDMESSAGES" not found. Make sure the bot is in that group.'
                })
            }

            // Read file line-by-line efficiently
            const fileStream = fs.createReadStream(inputPath, { encoding: 'utf-8' })
            const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

            let currentMessage = ''
            let messageCount = 0

            for await (const line of rl) {
                const match = line.match(/^\[\d+\]/)

                // if new numbered message starts, send the previous one
                if (match && currentMessage.trim()) {
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
                text: `✅ Sent ${messageCount} extracted message(s) to "${targetGroup.subject}".`
            })

        } catch (err) {
            console.error(err)
            await sock.sendMessage(from, {
                text: '❌ Failed to process extracted messages.'
            })
        }
    }
}
