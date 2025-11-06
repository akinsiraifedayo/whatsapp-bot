# 🤖 WhatsApp Bot - Quick Start Guide

## 📦 New Modular Command System

Your bot now uses a **production-ready modular command system** that makes it easy to add and manage commands!

---

## 🎯 Quick Overview

### What Changed?

**Before:** All commands were in one giant `messageHandler.js` file (400+ lines)

**Now:** Commands are organized into separate files by category:
- **Group commands** → `commands/group/`
- **Private commands** → `commands/private/`
- **Owner commands** → `commands/owner/`

---

## 📁 Project Structure

```
whatsapp-bot/
├── index.js                      # Main bot file (now clean & modular!)
├── handlers/
│   ├── messageHandler.js         # Smart command router (130 lines)
│   ├── connectionHandler.js      # Connection & QR code handling
│   ├── credentialsHandler.js     # Auth handling
│   └── debugHandler.js           # Debug logging
├── commands/                     # ✨ NEW! All commands here
│   ├── README.md                 # Full documentation
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
└── lib/
    ├── commandLoader.js          # Auto-loads all commands
    ├── settings.js               # Bot settings
    └── utils.js                  # Utility functions
```

---

## ✅ Available Commands

### Group Commands
- `!ping` - Test bot responsiveness
- `!help` - Show command list
- `!multitag on/off` - Enable/disable silent mentions
- `!all` - Mention all group members
- `!say [message]` - Send message with silent mentions

### Private Commands (DM only)
- `!send "Group Name" Message` - Send to specific group
- `!sendtoallgroups Message` - Broadcast to all groups
- `!sendtogroups "Prefix" Message` - Send to matching groups

### Owner Commands (You only)
- `!sendcleanedmessages` - Send cleaned_messages.txt to group
- `!sendcleanedtochannel [channel-id]` - Send to WhatsApp channel

---

## 🚀 Adding a New Command (Super Easy!)

### Option 1: Quick Method

1. Copy the template:
```bash
cp commands/COMMAND_TEMPLATE.js commands/group/mycommand.js
```

2. Edit the file:
```javascript
module.exports = {
    name: 'mycommand',
    description: 'Does something cool',
    category: 'group',

    async execute({ sock, from, args }) {
        await sock.sendMessage(from, {
            text: 'Hello from mycommand!'
        })
    }
}
```

3. Restart the bot - that's it! ✨

### Option 2: Examples

**Simple Command:**
```javascript
// commands/group/hello.js
module.exports = {
    name: 'hello',
    description: 'Greet the user',
    category: 'group',

    async execute({ sock, from }) {
        await sock.sendMessage(from, { text: '👋 Hello!' })
    }
}
```

**Command with Arguments:**
```javascript
// commands/group/echo.js
module.exports = {
    name: 'echo',
    description: 'Repeat your message',
    usage: '!echo [text]',
    category: 'group',

    async execute({ sock, from, args }) {
        if (!args) {
            return await sock.sendMessage(from, {
                text: '❗ Usage: !echo Your message'
            })
        }
        await sock.sendMessage(from, { text: args })
    }
}
```

**Owner-Only Command:**
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

## 🔧 Configuration

### Setting Owner JIDs

Edit `handlers/messageHandler.js` line 11:

```javascript
const OWNER_JIDS = [
    "2348012345678@s.whatsapp.net",
    "2348098765432@s.whatsapp.net"
]
```

### Bot Online Message

The bot now sends "🤖 Bot Online" to itself when it starts up!
See: `handlers/connectionHandler.js:45`

---

## 📖 Full Documentation

For detailed documentation on creating advanced commands, see:
**[commands/README.md](commands/README.md)**

Topics covered:
- Command structure reference
- Execute function context
- Using mentions and media
- Error handling
- Hot reloading
- Best practices

---

## 🎯 Benefits of the New System

✅ **Scalable** - Add unlimited commands without cluttering code
✅ **Organized** - Commands grouped by category
✅ **Reusable** - Each command is self-contained
✅ **Maintainable** - Easy to find, edit, and debug
✅ **Production-Ready** - Proper error handling and validation
✅ **Auto-Loading** - New commands are discovered automatically
✅ **Type-Safe** - Full JSDoc comments for IDE support

---

## 🐛 Troubleshooting

**Command not working?**
1. Check console logs on bot startup - it shows all loaded commands
2. Verify file is in correct folder (group/private/owner)
3. Ensure `name` and `execute` are defined
4. Restart the bot to reload commands

**Still having issues?**
- Check `commands/README.md` for detailed troubleshooting
- Review the `COMMAND_TEMPLATE.js` for proper structure
- Look at existing command files for examples

---

## 🎉 You're Ready for Production!

Your bot is now:
- ✅ Modular and organized
- ✅ Easy to extend with new commands
- ✅ Production-ready
- ✅ Well-documented

**Add new commands by simply creating new files in the `commands/` folder!**

Happy coding! 🚀
