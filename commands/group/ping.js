module.exports = {
    name: 'ping',
    description: 'Test bot responsiveness',
    usage: '!ping',
    category: 'group',

    async execute({ sock, from }) {
        await sock.sendMessage(from, { text: '🏓 Pong!' })
    }
}
