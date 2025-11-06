/**
 * Handles credentials updates for the WhatsApp bot
 * @param {Object} sock - The WhatsApp socket instance
 * @param {Function} saveCreds - Callback to save credentials
 */
function setupCredentialsHandler(sock, saveCreds) {
    sock.ev.on('creds.update', saveCreds)
}

module.exports = setupCredentialsHandler
