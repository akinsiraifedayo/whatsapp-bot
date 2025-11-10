# 🤖 WhatsApp Bot - Modular Command System

A production-ready WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) featuring a powerful modular command system. Perfect for group management, broadcasting, and custom automation.

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

- 🎯 **Modular Command System** - Add new commands by simply creating files
- 👥 **Group Management** - Tag all members, broadcast messages, multi-tag mode
- 📢 **Broadcasting** - Send messages to specific groups or all groups at once
- 🔐 **Owner-Only Commands** - Restrict sensitive commands to bot owners
- 📁 **Auto-Loading** - Commands are automatically discovered and loaded
- 🛡️ **Secure Configuration** - JSON-based config excluded from git
- 🔄 **Connection Handling** - Auto-reconnect with QR code generation
- 📝 **Well Documented** - Clear examples and templates for creating commands

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/akinsiraifedayo/whatsapp-bot.git
cd whatsapp-bot
npm install
```

### 2. Configure Bot Owners

First run will auto-create `config.json`:

```bash
node index.js
```

Edit `config.json` with your WhatsApp number:

```json
{
  "ownerJids": [
    "2348012345678@s.whatsapp.net"
  ],
  "ownerOnlyMode": false
}
```

**Getting Your WhatsApp JID:**
- Format: `[country_code][number]@s.whatsapp.net`
- Example: `+234 801 234 5678` → `2348012345678@s.whatsapp.net`
- Start bot, scan QR, send `!ping` to see your JID in logs

### 3. Start the Bot

```bash
node index.js
```

Scan the QR code with WhatsApp → **Linked Devices**

**For Production (with PM2):**
```bash
npm install -g pm2
pm2 start index.js --name whatsapp-bot
pm2 save
```

---

## 📋 Available Commands

### Group Commands (Usable in Groups)

| Command | Description |
|---------|-------------|
| `!ping` | Test bot responsiveness |
| `!help` | Show all available commands |
| `!multitag on/off` | Enable/disable silent mentions |
| `!all` | Mention all group members visibly |
| `!say [message]` | Send message with silent mentions |

### Private Commands (DM Only)

| Command | Description |
|---------|-------------|
| `!send "Group Name" Message` | Send message to specific group |
| `!sendtoallgroups Message` | Broadcast to all groups |
| `!sendtogroups "Prefix" Message` | Send to groups matching prefix |

### Owner Commands (Restricted)

| Command | Description |
|---------|-------------|
| `!sendcleanedmessages "Group Name"` | Send cleaned_messages.txt to specific group |
| `!sendcleanedtochannel [jid]` | Send to WhatsApp channel |

---

## 🎯 Adding New Commands (Super Easy!)

### Step 1: Copy the Template

```bash
cp commands/COMMAND_TEMPLATE.js commands/group/mycommand.js
```

### Step 2: Edit Your Command

```javascript
module.exports = {
    name: 'hello',
    description: 'Greet the user',
    category: 'group',

    async execute({ sock, from, sender }) {
        await sock.sendMessage(from, {
            text: '👋 Hello from custom command!'
        })
    }
}
```

### Step 3: Restart the Bot

That's it! Your command is now available as `!hello`

---

## 📁 Project Structure

```
whatsapp-bot/
├── index.js                      # Main entry point
├── config.json                   # Your config (NOT committed)
├── config.example.json           # Template (safe to commit)
│
├── handlers/                     # Event handlers
│   ├── messageHandler.js         # Command router
│   ├── connectionHandler.js      # Connection & QR handling
│   ├── credentialsHandler.js     # Auth updates
│   └── debugHandler.js           # Debug logging
│
├── commands/                     # All commands (auto-loaded)
│   ├── COMMAND_TEMPLATE.js       # Template for new commands
│   ├── group/                    # Group commands
│   │   ├── ping.js
│   │   ├── help.js
│   │   ├── multitag.js
│   │   ├── all.js
│   │   └── say.js
│   ├── private/                  # Private chat commands
│   │   ├── send.js
│   │   ├── sendtoallgroups.js
│   │   └── sendtogroups.js
│   └── owner/                    # Owner-only commands
│       ├── sendcleanedmessages.js
│       └── sendcleanedtochannel.js
│
└── lib/                          # Core utilities
    ├── commandLoader.js          # Auto-loads commands
    ├── config.js                 # Config loader
    ├── settings.js               # Group settings
    └── utils.js                  # Helper functions
```

---

## ⚙️ Configuration

### config.json Structure

```json
{
  "ownerJids": [
    "2348012345678@s.whatsapp.net",
    "2348098765432@s.whatsapp.net"
  ],
  "ownerOnlyMode": false,
  "botName": "My Bot",
  "prefix": "!",
  "enableDebugLogs": false
}
```

**Options:**
- `ownerJids` - Array of owner WhatsApp numbers (for owner-only commands)
- `ownerOnlyMode` - If `true`, only owners can use ANY command
- `botName` - Name of your bot
- `prefix` - Command prefix (default: `!`)
- `enableDebugLogs` - Enable verbose logging

---

## 🔐 Security

**Files Safe to Commit:**
- ✅ All code files (`index.js`, `handlers/`, `commands/`, `lib/`)
- ✅ `config.example.json` - Template without real data
- ✅ Documentation files

**Never Commit These (already in .gitignore):**
- ❌ `config.json` - Contains your WhatsApp numbers
- ❌ `auth_info_baileys/` - Your WhatsApp session
- ❌ `group_settings.json` - Group-specific data
- ❌ `node_modules/` - Dependencies

---

## 🛠️ Advanced Examples

### Command with Arguments

```javascript
// commands/group/echo.js
module.exports = {
    name: 'echo',
    description: 'Repeat your message',
    usage: '!echo [text]',
    category: 'group',

    async execute({ sock, from, args }) {
        if (!args.trim()) {
            return await sock.sendMessage(from, {
                text: '❗ Usage: !echo Your message here'
            })
        }
        await sock.sendMessage(from, { text: args })
    }
}
```

### Group-Only Command with Mentions

```javascript
// commands/group/admins.js
module.exports = {
    name: 'admins',
    description: 'Mention all group admins',
    category: 'group',
    groupOnly: true,

    async execute({ sock, from }) {
        const meta = await sock.groupMetadata(from)
        const admins = meta.participants
            .filter(p => p.admin)
            .map(p => p.id)

        await sock.sendMessage(from, {
            text: '📢 Calling admins!',
            mentions: admins
        })
    }
}
```

### Owner-Only Command

```javascript
// commands/owner/restart.js
module.exports = {
    name: 'restart',
    description: 'Restart the bot',
    category: 'owner',
    ownerOnly: true,

    async execute({ sock, from }) {
        await sock.sendMessage(from, { text: '🔄 Restarting...' })
        process.exit(0)
    }
}
```

---

## 🐛 Troubleshooting

**"No owner JIDs configured"**
- Edit `config.json` and add your WhatsApp number
- Format: `[country_code][number]@s.whatsapp.net`

**Commands not working**
- Check console logs on startup - shows all loaded commands
- Verify file is in correct folder (`group/`, `private/`, or `owner/`)
- Ensure `name` and `execute` properties exist
- Restart the bot

**Cannot connect**
- Delete `auth_info_baileys/` folder
- Restart bot and scan new QR code
- Check your internet connection

**Owner commands not working**
- Verify your JID in `config.json` matches exactly
- Check console logs to see your actual JID when you send messages
- Make sure format includes `@s.whatsapp.net`

---

## 📚 Documentation

- **COMMAND_TEMPLATE.js** - Template for creating new commands
- **commands/** folder - Browse existing commands for examples
- **handlers/messageHandler.js** - See how commands are routed

---

## 🎯 Command Categories

Commands are automatically organized by folder:

- **`commands/group/`** - Commands that work in WhatsApp groups
- **`commands/private/`** - Commands for private/DM chats
- **`commands/owner/`** - Restricted to bot owners only

Drop a file in any folder and it's ready to use!

---

## 🚦 Requirements

- Node.js v16 or higher
- A WhatsApp account for the bot
- Internet connection

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add your command in the appropriate `commands/` folder
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📜 License

MIT License - feel free to use this bot for personal or commercial projects!

---

## 🙏 Credits

Built with [Baileys](https://github.com/WhiskeySockets/Baileys) - The best WhatsApp Web API library

---

## 💡 Feature Ideas

- [ ] Admin-only group commands
- [ ] Command usage statistics
- [ ] Scheduled messages
- [ ] AI integration (ChatGPT, etc.)
- [ ] Media handling (images, videos)
- [ ] Webhook support
- [ ] Multi-language support

---

**⭐ If you find this useful, please star the repo!**

For detailed documentation on creating advanced commands, explore the `commands/` folder examples.

Happy botting! 🤖
