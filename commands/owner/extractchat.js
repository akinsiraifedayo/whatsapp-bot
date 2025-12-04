const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { extractMessages } = require('../../lib/messageExtractor')

module.exports = {
    name: 'extractchat',
    description: 'Extract and clean WhatsApp chat export. Send a .txt or .zip file with this command as caption.',
    usage: '!extractchat (attach .txt or .zip file)',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, msg, from }) {
        try {
            // Check if message has a document attached
            const documentMessage = msg.message?.documentMessage ||
                msg.message?.documentWithCaptionMessage?.message?.documentMessage

            if (!documentMessage) {
                return await sock.sendMessage(from, {
                    text: '❗ Please send a WhatsApp chat export (.txt or .zip file) with the caption:\n!extractchat\n\nHow to export:\n1. Open WhatsApp chat\n2. Tap ⋮ > More > Export chat\n3. Choose "Without media"\n4. Send the file here with !extractchat as caption'
                })
            }

            // Validate file type
            const fileName = documentMessage.fileName || ''
            const mimeType = documentMessage.mimetype || ''
            const isZip = fileName.endsWith('.zip') || mimeType.includes('zip')
            const isTxt = fileName.endsWith('.txt') || mimeType.includes('text')

            if (!isZip && !isTxt) {
                return await sock.sendMessage(from, {
                    text: '❌ Please send a .txt or .zip file. The WhatsApp chat export should be a text file or zip archive.'
                })
            }

            await sock.sendMessage(from, {
                text: `⏳ Downloading and processing ${isZip ? 'zip' : 'text'} file...`
            })

            // Download the document
            const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            let inputContent

            if (isZip) {
                // Extract .txt file from zip
                const zip = new AdmZip(buffer)
                const zipEntries = zip.getEntries()

                // Find the .txt file (WhatsApp chat export)
                const txtEntry = zipEntries.find(entry =>
                    entry.entryName.endsWith('.txt') && !entry.entryName.startsWith('__MACOSX')
                )

                if (!txtEntry) {
                    return await sock.sendMessage(from, {
                        text: '❌ No .txt file found in the zip archive. Make sure this is a WhatsApp chat export.'
                    })
                }

                inputContent = txtEntry.getData().toString('utf-8')
            } else {
                inputContent = buffer.toString('utf-8')
            }

            // Check if content looks like a WhatsApp export
            const whatsappPattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2}/m
            if (!whatsappPattern.test(inputContent)) {
                return await sock.sendMessage(from, {
                    text: '❌ This doesn\'t look like a WhatsApp chat export.\n\nExpected format:\n1/2/24, 12:34 - Sender: Message\n\nMake sure you exported the chat correctly.'
                })
            }

            // Extract and clean messages
            const { output, messageCount } = await extractMessages(inputContent)

            if (messageCount === 0) {
                return await sock.sendMessage(from, {
                    text: '❌ No messages found in the file. Make sure it\'s a valid WhatsApp chat export.'
                })
            }

            // Save to cleaned_messages.txt
            const outputPath = path.join(__dirname, '..', '..', 'cleaned_messages.txt')
            fs.writeFileSync(outputPath, output, 'utf-8')

            // Also save the original for reference
            const inputPath = path.join(__dirname, '..', '..', 'whatsapp_chat.txt')
            fs.writeFileSync(inputPath, inputContent, 'utf-8')

            await sock.sendMessage(from, {
                text: `✅ Extraction complete!\n\n📊 Stats:\n• Messages extracted: ${messageCount}\n• Source: ${isZip ? 'zip archive' : 'text file'}\n• Output: cleaned_messages.txt\n\nUse !sendcleanedmessages "Group Name" to send to a group.`
            })

        } catch (err) {
            console.error('Extract chat error:', err)
            await sock.sendMessage(from, {
                text: '❌ Failed to process the chat file. Error: ' + err.message
            })
        }
    }
}
