/**
 * Handles debug message logging (temporary snippet for channel JID)
 * @param {Object} sock - The WhatsApp socket instance
 */
function setupDebugHandler(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages || !messages[0]) return
        const m = messages[0]
        console.log('DEBUG MESSAGE JID:', m.key.remoteJid)
    })
}

module.exports = setupDebugHandler
