const { setMultiTag } = require('../../lib/settings')

module.exports = {
    name: 'multitag',
    description: 'Enable or disable multi-tag feature in groups',
    usage: '!multitag [on|off]',
    category: 'group',
    groupOnly: true,

    async execute({ sock, from, args, isGroup }) {
        if (!isGroup) return

        const action = args.trim().toLowerCase()

        if (action === 'on') {
            setMultiTag(from, true)
            await sock.sendMessage(from, { text: '✅ Multi-tag is now ON.' })
        } else if (action === 'off') {
            setMultiTag(from, false)
            await sock.sendMessage(from, { text: '🚫 Multi-tag is now OFF.' })
        } else {
            await sock.sendMessage(from, {
                text: '❗ Usage: !multitag on OR !multitag off'
            })
        }
    }
}
