const { DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

/**
 * Handles connection updates for the WhatsApp bot
 * @param {Object} sock - The WhatsApp socket instance
 * @param {Function} restartBot - Callback to restart the bot
 */
function setupConnectionHandler(sock, restartBot) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        // Handle QR code display
        if (qr) {
            console.log('📷 Scan this QR code below:')
            qrcode.generate(qr, { small: true })
        }

        // Handle connection closure
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting:', shouldReconnect)
            if (shouldReconnect) {
                restartBot()
            }
        }
        // Handle successful connection
        else if (connection === 'open') {
            console.log('✅ Bot is online!')

            // Send "Bot Online" status message to yourself
            try {
                const botJid = sock.user.id
                await sock.sendMessage(botJid, { text: '🤖 Bot Online' })
            } catch (error) {
                console.error('Failed to send bot online message:', error)
            }
        }
    })
}

module.exports = setupConnectionHandler
