const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { proto } = require('@whiskeysockets/baileys')

module.exports = {
    name: 'sendcleanedtochannel',
    description: 'Send cleaned messages to a WhatsApp channel',
    usage: '!sendcleanedtochannel 120363021351234567@newsletter',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, from, text, isGroup }) {
        if (isGroup) return

        const match = text.match(/^!sendcleanedtochannel\s+(\d+@newsletter)/)
        if (!match) {
            return await sock.sendMessage(from, {
                text: '❗ Usage:\n!sendcleanedtochannel 120363021351234567@newsletter'
            })
        }

        const channelJid = match[1].trim()
        console.log(channelJid)

        try {
            const inputPath = path.join(__dirname, '..', '..', 'cleaned_messages.txt')
            if (!fs.existsSync(inputPath)) {
                return await sock.sendMessage(from, {
                    text: `❌ Extracted file not found. Make sure cleaned_messages.txt exists at ${inputPath}`
                })
            }

            // Read file line-by-line
            const fileStream = fs.createReadStream(inputPath, { encoding: 'utf-8' })
            const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

            let currentMessage = ''
            let messageCount = 0

            for await (const line of rl) {
                const matchNum = line.match(/^\[\d+\]/)

                // When a new numbered message starts, send the previous one
                if (matchNum && currentMessage.trim()) {
                    const msg = { conversation: currentMessage.trim() }
                    const plaintext = proto.Message.encode(msg).finish()

                    const plaintextNode = {
                        tag: 'plaintext',
                        attrs: {},
                        content: plaintext
                    }

                    const node = {
                        tag: 'message',
                        attrs: { to: channelJid, type: 'text' },
                        content: [plaintextNode]
                    }

                    await sock.query(node)
                    messageCount++
                    currentMessage = ''
                    await new Promise(res => setTimeout(res, 3000)) // delay between messages
                }

                currentMessage += line + '\n'
            }

            // Send the last message if any
            if (currentMessage.trim()) {
                const msg = { conversation: currentMessage.trim() }
                const plaintext = proto.Message.encode(msg).finish()

                const plaintextNode = {
                    tag: 'plaintext',
                    attrs: {},
                    content: plaintext
                }

                const node = {
                    tag: 'message',
                    attrs: { to: channelJid, type: 'text' },
                    content: [plaintextNode]
                }

                await sock.query(node)
                messageCount++
            }

            await sock.sendMessage(from, {
                text: `✅ Sent ${messageCount} cleaned message(s) to channel: ${channelJid}`
            })
        } catch (err) {
            console.error('❌ Error sending cleaned messages to channel:', err)
            await sock.sendMessage(from, {
                text: '❌ Failed to send cleaned messages to channel. Check console for details.'
            })
        }
    }
}
