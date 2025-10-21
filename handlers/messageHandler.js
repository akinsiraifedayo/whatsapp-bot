const path = require('path')
const fs = require('fs')
const { mentionAll } = require('../lib/utils')
const { getMultiTag, setMultiTag } = require('../lib/settings')
const { send } = require('process')


/**
 * Main message handler for incoming WhatsApp messages.
 * Handles group and private commands, including multi-tag and message relay features.
 * @param {import('@whiskeysockets/baileys').WASocket} sock - WhatsApp socket instance
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg - Incoming message object
 */

const OWNER_JIDS = [] // <-- replace with your numbers (must end with @s.whatsapp.net) eg ["2348012345678@s.whatsapp.net","2348012345678@s.whatsapp.net"]
let OWNER_ONLY_MODE = false

module.exports = async function handleMessage(sock, msg) {
    
    const from = msg.key.remoteJid // Chat/group ID
    const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net' // Bot's own JID
    const isSelfChat = from === userJid // True if message is from bot's own chat

    // Ignore messages without content
    if (!msg.message) return
    // Ignore messages sent by the bot in other chats (except self-chat)
    if (msg.key.fromMe && !isSelfChat) return

    const isGroup = from.endsWith('@g.us') // True if message is from a group
    const sender = msg.key.participant || msg.key.remoteJid // Sender JID
    if (OWNER_ONLY_MODE && !OWNER_JIDS.includes(sender)) {
        console.log(`🚫 Ignored message from non-owner: ${sender}`)
        return
    }

    // Extract text from different message types
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    // Only process commands (messages starting with '!')
    if (!text.startsWith('!')) return

    // Simple ping command for health check
    if (text === '!ping') {
        return await sock.sendMessage(from, { text: '🏓 Pong!' })
    }

    // Help Menu Command
    if (text === '!help') {
        const helpText = `
            *🤖 WhatsApp Bot Command List*

            📌 _Group Commands (usable in groups):_
            • *!ping* – Test bot responsiveness
            • *!multitag on* – Enable silent tag-all for group
            • *!multitag off* – Disable silent tag-all
            • *!all* – Mention all visibly in group
            • *!say [message]* – Bot sends [message] with silent mentions

            📬 _Private Commands (send to bot in DM):_
            • *!send "Group Name" Message*  
            ↪ Send a message to a specific group

            • *!sendtoallgroups Message*  
            ↪ Send to all groups the bot is in

            • *!sendtogroups "Prefix" Message*  
            ↪ Send to all groups whose names start with Prefix

            🛠 _Examples:_
            • !send "Subfactory Team" Please confirm delivery.
            • !sendtoallgroups Maintenance update at 9PM.
            • !sendtogroups "Subfactory" Power restored!

            ✅ All private messages include silent mentions to everyone in target groups.
            🔒 Only bot owner can use private send commands.
    `.trim()

        return await sock.sendMessage(from, {
            text: helpText
        })
    }

    // Enable multi-tag feature in group
    if (text === '!multitag on' && isGroup) {
        setMultiTag(from, true)
        return await sock.sendMessage(from, { text: '✅ Multi-tag is now ON.' })
    }

    // Disable multi-tag feature in group
    if (text === '!multitag off' && isGroup) {
        setMultiTag(from, false)
        return await sock.sendMessage(from, { text: '🚫 Multi-tag is now OFF.' })
    }

    // Tag all group members visibly
    if (text === '!all' && isGroup) {
        return await mentionAll(sock, from)
    }

    // Group command: !say [message] — bot sends message tagging everyone
    if (text.startsWith('!say ') && isGroup) {
        const message = text.slice(5).trim()
        if (!message) return

        // Fetch group participants for mentions
        const groupMetadata = await sock.groupMetadata(from)
        const mentions = groupMetadata.participants.map(p => p.id)

        return await sock.sendMessage(from, {
            text: message,
            mentions
        })
    }

    // Private command: !sendtoallgroups [message] — send message to all groups from private chat
    if (!isGroup && text.startsWith('!sendtoallgroups ')) {
        const message = text.slice(18).trim()
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

                // Optional: Small delay to avoid being flagged as spam
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            return await sock.sendMessage(from, {
                text: `✅ Message sent to ${groupArray.length} group(s).`
            })
        } catch (err) {
            console.error(err)
            return await sock.sendMessage(from, {
                text: '❌ Failed to send to all groups. Check console for details.'
            })
        }
    }


    // Private command: !sendtogroups "GroupPrefix" Your message — send to all groups starting with the prefix
    if (!isGroup && text.startsWith('!sendtogroups ')) {
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

            return await sock.sendMessage(from, {
                text: `✅ Message sent to ${matchedGroups.length} group(s) starting with "${prefix}".`
            })
        } catch (err) {
            console.error(err)
            return await sock.sendMessage(from, {
                text: '❌ Failed to send messages. See console for details.'
            })
        }
    }



    // Private command: !send "Group Name" [message] — send message to group from private chat
    if (!isGroup && text.startsWith('!send ')) {
        // Parse command: !send "Group Name" message
        const match = text.match(/^!send\s+"([^"]+)"\s+([\s\S]+)/)

        if (!match) {
            // Inform user about correct usage
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
                // Group not found or bot not a member
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
            // Log error and inform user
            console.error(err)
            return await sock.sendMessage(from, { text: '❌ Failed to send message. Check console for details.' })
        }
    }

    // START CLEANED_MESSAGES SENDER TO GROUP
    if (!isGroup && text.startsWith('!sendcleanedmessages')) {
        try {
            const fs = require('fs')
            const path = require('path')
            const readline = require('readline')

            const inputPath = path.join(__dirname, '..', 'cleaned_messages.txt')
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
                    // remove numbering tags like [1], [2], etc.
                    // currentMessage = currentMessage.trim().replace(/^\[\d+\]\s*/, '')
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
    // END CLEANED_MESSAGES SENDER



    // START SEND CLEANED MESSAGES TO CHANNEL
    if (!isGroup && text.startsWith('!sendcleanedtochannel')) {
        try {
            const match = text.match(/^!sendcleanedtochannel\s+(\d+@newsletter)/)
            if (!match) {
                return await sock.sendMessage(from, {
                    text: '❗ Usage:\n!sendcleanedtochannel 120363021351234567@newsletter'
                })
            }

            const channelJid = match[1].trim()
            console.log(channelJid)

            const fs = require('fs')
            const path = require('path')
            const readline = require('readline')
            const { proto } = require('@whiskeysockets/baileys')

            const inputPath = path.join(__dirname, '..', 'cleaned_messages.txt')
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
    // END SEND CLEANED MESSAGES TO CHANNEL

}
