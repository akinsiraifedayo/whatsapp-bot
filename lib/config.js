const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, '..', 'config.json')
const EXAMPLE_CONFIG_PATH = path.join(__dirname, '..', 'config.example.json')

/**
 * Load configuration from config.json
 * If config.json doesn't exist, create it from config.example.json
 */
function loadConfig() {
    try {
        // Check if config.json exists
        if (!fs.existsSync(CONFIG_PATH)) {
            console.warn('⚠️  config.json not found!')

            // Check if example config exists
            if (fs.existsSync(EXAMPLE_CONFIG_PATH)) {
                console.log('📋 Creating config.json from config.example.json...')
                fs.copyFileSync(EXAMPLE_CONFIG_PATH, CONFIG_PATH)
                console.log('✅ config.json created! Please edit it with your settings.')
                console.log('⚠️  WARNING: Add your owner JIDs in config.json before running the bot!')
            } else {
                // Create a minimal config if example doesn't exist
                const defaultConfig = {
                    ownerJids: [],
                    ownerOnlyMode: false,
                    botName: 'WhatsApp Bot',
                    prefix: '!',
                    enableDebugLogs: false
                }
                fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2))
                console.log('✅ config.json created with defaults!')
                console.log('⚠️  WARNING: Add your owner JIDs in config.json before running the bot!')
            }
        }

        // Read and parse config
        const configData = fs.readFileSync(CONFIG_PATH, 'utf-8')
        const config = JSON.parse(configData)

        // Validate required fields
        if (!config.ownerJids || !Array.isArray(config.ownerJids)) {
            console.warn('⚠️  ownerJids is missing or invalid in config.json')
            config.ownerJids = []
        }

        if (config.ownerJids.length === 0) {
            console.warn('⚠️  WARNING: No owner JIDs configured in config.json!')
            console.warn('⚠️  Owner-only commands will not work until you add your WhatsApp number.')
        }

        console.log('✅ Configuration loaded successfully!')
        console.log(`👤 Owners configured: ${config.ownerJids.length}`)
        console.log(`🔒 Owner-only mode: ${config.ownerOnlyMode ? 'ENABLED' : 'DISABLED'}`)

        return config
    } catch (error) {
        console.error('❌ Error loading config.json:', error.message)
        console.error('Using default configuration...')

        return {
            ownerJids: [],
            ownerOnlyMode: false,
            botName: 'WhatsApp Bot',
            prefix: '!',
            enableDebugLogs: false
        }
    }
}

/**
 * Save configuration to config.json
 */
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
        console.log('✅ Configuration saved successfully!')
        return true
    } catch (error) {
        console.error('❌ Error saving config.json:', error.message)
        return false
    }
}

/**
 * Get a specific config value
 */
function getConfigValue(key, defaultValue = null) {
    const config = loadConfig()
    return config[key] !== undefined ? config[key] : defaultValue
}

/**
 * Update a specific config value
 */
function setConfigValue(key, value) {
    const config = loadConfig()
    config[key] = value
    return saveConfig(config)
}

module.exports = {
    loadConfig,
    saveConfig,
    getConfigValue,
    setConfigValue,
    CONFIG_PATH
}
