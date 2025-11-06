const fs = require('fs')
const path = require('path')

/**
 * Command loader that dynamically loads all commands from the commands directory
 */
class CommandLoader {
    constructor() {
        this.commands = new Map()
        this.commandsDir = path.join(__dirname, '..', 'commands')
    }

    /**
     * Load all commands from the commands directory
     */
    loadCommands() {
        const categories = ['group', 'private', 'owner']

        for (const category of categories) {
            const categoryPath = path.join(this.commandsDir, category)

            if (!fs.existsSync(categoryPath)) continue

            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))

            for (const file of files) {
                try {
                    const commandModule = require(path.join(categoryPath, file))

                    // Validate command structure
                    if (!commandModule.name || !commandModule.execute) {
                        console.warn(`⚠️  Command ${file} is missing required properties (name or execute)`)
                        continue
                    }

                    // Store command with metadata
                    this.commands.set(commandModule.name, {
                        ...commandModule,
                        category,
                        filename: file
                    })

                    console.log(`✅ Loaded command: ${commandModule.name} (${category})`)
                } catch (error) {
                    console.error(`❌ Failed to load command ${file}:`, error.message)
                }
            }
        }

        console.log(`📦 Total commands loaded: ${this.commands.size}`)
        return this.commands
    }

    /**
     * Get a command by name
     */
    getCommand(name) {
        return this.commands.get(name)
    }

    /**
     * Get all commands
     */
    getAllCommands() {
        return this.commands
    }

    /**
     * Get commands by category
     */
    getCommandsByCategory(category) {
        return Array.from(this.commands.values()).filter(cmd => cmd.category === category)
    }

    /**
     * Reload all commands (useful for development)
     */
    reloadCommands() {
        // Clear require cache for commands
        for (const [name, command] of this.commands) {
            const modulePath = path.join(this.commandsDir, command.category, command.filename)
            delete require.cache[require.resolve(modulePath)]
        }

        this.commands.clear()
        return this.loadCommands()
    }
}

module.exports = new CommandLoader()
