/**
 * Command Template
 * Copy this file to create new commands
 */

module.exports = {
    // Command name (without the ! prefix)
    name: 'commandname',

    // Command description for help menu
    description: 'Brief description of what this command does',

    // Usage example
    usage: '!commandname [arguments]',

    // Command category: 'group', 'private', or 'owner'
    category: 'group',

    // Is this command only for groups?
    groupOnly: false,

    // Is this command only for private chats?
    privateOnly: false,

    // Is this command only for bot owners?
    ownerOnly: false,

    // Aliases for the command (optional)
    aliases: [],

    /**
     * Execute the command
     * @param {Object} context - Command context
     * @param {import('@whiskeysockets/baileys').WASocket} context.sock - WhatsApp socket
     * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} context.msg - Message object
     * @param {string} context.text - Full message text
     * @param {string} context.args - Command arguments (text after command name)
     * @param {string} context.from - Chat/group ID
     * @param {string} context.sender - Sender JID
     * @param {boolean} context.isGroup - Whether message is from a group
     * @param {string[]} context.ownerJids - Array of owner JIDs
     */
    async execute({ sock, msg, text, args, from, sender, isGroup, ownerJids }) {
        // Your command logic here
        await sock.sendMessage(from, {
            text: 'Command executed!'
        })
    }
}
