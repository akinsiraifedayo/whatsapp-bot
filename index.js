const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const handleMessage = require('./handlers/messageHandler')
const setupConnectionHandler = require('./handlers/connectionHandler')
const setupCredentialsHandler = require('./handlers/credentialsHandler')
const setupDebugHandler = require('./handlers/debugHandler')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: 'silent' })
    })

    // Setup all event handlers
    setupCredentialsHandler(sock, saveCreds)
    setupConnectionHandler(sock, startBot)
    setupDebugHandler(sock)

    // Setup message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages || !messages[0]) return
        await handleMessage(sock, messages[0])
    })
}

startBot()


