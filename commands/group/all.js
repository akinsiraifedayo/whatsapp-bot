const { mentionAll } = require('../../lib/utils')

module.exports = {
    name: 'all',
    description: 'Mention all group members visibly',
    usage: '!all',
    category: 'group',
    groupOnly: true,

    async execute({ sock, from, isGroup }) {
        if (!isGroup) return
        await mentionAll(sock, from)
    }
}
