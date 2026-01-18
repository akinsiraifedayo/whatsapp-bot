const fs = require('fs')
const path = require('path')
const { generatePDF, getMessageCount } = require('../../lib/pdfGenerator')

module.exports = {
    name: 'sendpdf',
    description: 'Generate and send PDF of cleaned messages',
    usage: '!sendpdf OR !sendpdf "Group Name"',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, from, text }) {
        try {
            const inputPath = path.join(__dirname, '..', '..', 'cleaned_messages.txt')
            if (!fs.existsSync(inputPath)) {
                return await sock.sendMessage(from, {
                    text: '❌ cleaned_messages.txt not found. Use !extractchat first.'
                })
            }

            const messageCount = getMessageCount(inputPath)
            if (messageCount === 0) {
                return await sock.sendMessage(from, {
                    text: '❌ No messages found in cleaned_messages.txt.'
                })
            }

            // Check if group name is provided
            const groupMatch = text.match(/^!sendpdf\s+"([^"]+)"/)
            let targetChat = from
            let targetName = 'you'

            if (groupMatch) {
                const groupName = groupMatch[1].trim()
                const allGroups = await sock.groupFetchAllParticipating()
                const targetGroup = Object.values(allGroups).find(
                    g => g.subject.toLowerCase() === groupName.toLowerCase()
                )

                if (!targetGroup) {
                    return await sock.sendMessage(from, {
                        text: `❌ Group "${groupName}" not found.`
                    })
                }

                targetChat = targetGroup.id
                targetName = targetGroup.subject
            }

            await sock.sendMessage(from, {
                text: `⏳ Generating PDF (${messageCount} messages)...`
            })

            const pdfPath = path.join(__dirname, '..', '..', 'cleaned_messages.pdf')
            const { pageCount } = await generatePDF(inputPath, pdfPath)

            // Send PDF
            await sock.sendMessage(targetChat, {
                document: fs.readFileSync(pdfPath),
                fileName: 'cleaned_messages.pdf',
                mimetype: 'application/pdf',
                caption: `📚 Complete story (${messageCount} parts, ${pageCount} pages)`
            })

            // Clean up PDF file
            fs.unlinkSync(pdfPath)

            if (targetChat !== from) {
                await sock.sendMessage(from, {
                    text: `✅ PDF sent to "${targetName}" (${messageCount} messages, ${pageCount} pages).`
                })
            }

        } catch (err) {
            console.error(err)
            await sock.sendMessage(from, {
                text: '❌ Failed to generate PDF. Error: ' + err.message
            })
        }
    }
}
