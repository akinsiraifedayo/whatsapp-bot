const commandLoader = require('../lib/commandLoader')
const { getMultiTag } = require('../lib/settings')
const { loadConfig } = require('../lib/config')

/**
 * Main message handler for incoming WhatsApp messages.
 * Handles group and private commands using a modular command system.
 * @param {import('@whiskeysockets/baileys').WASocket} sock - WhatsApp socket instance
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg - Incoming message object
 */

// Load configuration from config.json
const config = loadConfig()
const OWNER_JIDS = config.ownerJids || []
let OWNER_ONLY_MODE = config.ownerOnlyMode || false

// Load all commands on startup
const commands = commandLoader.loadCommands()

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

    // Owner-only mode check
    if (OWNER_ONLY_MODE && !OWNER_JIDS.includes(sender)) {
        console.log(`🚫 Ignored message from non-owner: ${sender}`)
        return
    }

    // Extract text from different message types
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    // Only process commands (messages starting with '!')
    if (!text.startsWith('!')) return

    // Parse command name and arguments
    const commandMatch = text.match(/^!(\w+)(?:\s+(.*))?/)
    if (!commandMatch) return

    const commandName = commandMatch[1].toLowerCase()
    const args = commandMatch[2] || ''

    // Get command from registry
    const command = commandLoader.getCommand(commandName)

    if (!command) {
        // Command not found - silently ignore or provide feedback
        return
    }

    // Check if command is group-only
    if (command.groupOnly && !isGroup) {
        return await sock.sendMessage(from, {
            text: '❌ This command can only be used in groups.'
        })
    }

    // Check if command is private-only
    if (command.privateOnly && isGroup) {
        return await sock.sendMessage(from, {
            text: '❌ This command can only be used in private chats.'
        })
    }

    // Check if command is owner-only
    if (command.ownerOnly && !OWNER_JIDS.includes(sender)) {
        return await sock.sendMessage(from, {
            text: '❌ This command is restricted to bot owners only.'
        })
    }

    // Execute command
    try {
        console.log(`📥 Executing command: ${commandName} (${command.category}) from ${isGroup ? 'group' : 'private'}`)

        await command.execute({
            sock,
            msg,
            text,
            args,
            from,
            sender,
            isGroup,
            ownerJids: OWNER_JIDS
        })

        console.log(`✅ Command executed successfully: ${commandName}`)
    } catch (error) {
        console.error(`❌ Error executing command ${commandName}:`, error)
        await sock.sendMessage(from, {
            text: '❌ An error occurred while executing the command. Please try again later.'
        })
    }

    // Handle multi-tag feature (if enabled for this group)
    if (isGroup && getMultiTag(from)) {
        try {
            const groupMetadata = await sock.groupMetadata(from)
            const mentions = groupMetadata.participants.map(p => p.id)

            await sock.sendMessage(from, {
                text: text,
                mentions
            })
        } catch (error) {
            console.error('Error in multi-tag feature:', error)
        }
    }
}

/**
 * Toggle owner-only mode
 * @param {boolean} enabled - Enable or disable owner-only mode
 */
function setOwnerOnlyMode(enabled) {
    OWNER_ONLY_MODE = enabled
    console.log(`🔒 Owner-only mode: ${enabled ? 'ENABLED' : 'DISABLED'}`)
}

/**
 * Set owner JIDs
 * @param {string[]} jids - Array of owner JIDs
 */
function setOwnerJids(jids) {
    OWNER_JIDS.length = 0
    OWNER_JIDS.push(...jids)
    console.log(`👤 Owner JIDs configured: ${OWNER_JIDS.length}`)
}

module.exports.setOwnerOnlyMode = setOwnerOnlyMode
module.exports.setOwnerJids = setOwnerJids
module.exports.reloadCommands = () => commandLoader.reloadCommands()
