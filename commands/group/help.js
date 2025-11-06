module.exports = {
    name: 'help',
    description: 'Display all available commands',
    usage: '!help',
    category: 'group',

    async execute({ sock, from }) {
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

        await sock.sendMessage(from, { text: helpText })
    }
}
