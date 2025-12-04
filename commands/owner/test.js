module.exports = {
    name: 'test',
    description: 'Show your JID (for adding to owner config)',
    usage: '!test',
    category: 'owner',
    ownerOnly: false,

    async execute({ sock, from, sender, isGroup }) {
        const chatType = isGroup ? 'Group' : 'Private'
        await sock.sendMessage(from, {
            text: `📋 *Your JID Info*\n\nSender: ${sender}\nChat: ${from}\nType: ${chatType}\n\n_Copy the Sender JID to add to config.json ownerJids_`
        })
    }
}
