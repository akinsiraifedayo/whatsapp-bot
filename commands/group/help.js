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
• *!help* – Show this command list
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

👑 _Owner Commands (bot owner only):_
• *!sendcleanedmessages "Group Name"*
↪ Send cleaned_messages.txt to specific group

• *!sendcleanedtochannel [channel-jid]*
↪ Send cleaned messages to WhatsApp channel

🛠 _Examples:_
• !send "Tech Group" Please confirm delivery.
• !sendtoallgroups Maintenance update at 9PM.
• !sendtogroups "Tech" Power restored!
• !sendcleanedmessages "Story Group"

✅ All broadcast messages include silent mentions.
🔒 Owner commands are restricted to configured owners.
        `.trim()

        await sock.sendMessage(from, { text: helpText })
    }
}
