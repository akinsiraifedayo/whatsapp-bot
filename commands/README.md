# WhatsApp Bot Commands System

This bot uses a **modular command system** that makes it easy to add, modify, and maintain commands.

---

## 📁 Folder Structure

```
commands/
├── README.md                    # This file
├── COMMAND_TEMPLATE.js          # Template for creating new commands
├── group/                       # Commands that work in groups
│   ├── ping.js
│   ├── help.js
│   ├── multitag.js
│   ├── all.js
│   └── say.js
├── private/                     # Commands for private chats
│   ├── send.js
│   ├── sendtoallgroups.js
│   └── sendtogroups.js
└── owner/                       # Owner-only commands
    ├── sendcleanedmessages.js
    └── sendcleanedtochannel.js
```

---

## ✨ How Commands Work

1. **Command files** are automatically loaded from the `group/`, `private/`, and `owner/` folders
2. Each command is a **JavaScript module** that exports a configuration object
3. The **messageHandler** automatically routes commands to the correct handler
4. Commands are **validated** for permissions (group-only, private-only, owner-only)

---

## 🚀 Adding a New Command

### Step 1: Choose a Category

Decide which folder your command belongs in:
- **`group/`** - Commands that can be used in WhatsApp groups
- **`private/`** - Commands for private chats with the bot
- **`owner/`** - Commands restricted to bot owners only

### Step 2: Copy the Template

Copy `COMMAND_TEMPLATE.js` to your chosen folder and rename it:

```bash
cp commands/COMMAND_TEMPLATE.js commands/group/mycommand.js
```

### Step 3: Edit the Command

Open your new file and customize it:

```javascript
module.exports = {
    // Command name (without the ! prefix)
    name: 'mycommand',

    // Description shown in help menu
    description: 'Does something cool',

    // Usage example
    usage: '!mycommand [arguments]',

    // Category (must match folder: 'group', 'private', or 'owner')
    category: 'group',

    // Optional: Restrict to groups only
    groupOnly: false,

    // Optional: Restrict to private chats only
    privateOnly: false,

    // Optional: Restrict to bot owners only
    ownerOnly: false,

    // Optional: Alternative command names
    aliases: ['mc', 'mycmd'],

    // Main command logic
    async execute({ sock, msg, text, args, from, sender, isGroup, ownerJids }) {
        // Your code here
        await sock.sendMessage(from, {
            text: 'Hello from mycommand!'
        })
    }
}
```

### Step 4: Test Your Command

1. Restart the bot (it will auto-load your new command)
2. In WhatsApp, type `!mycommand`
3. Check the console logs for any errors

---

## 📝 Command Structure Reference

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Command name (without `!` prefix) |
| `description` | `string` | Brief description for help menu |
| `category` | `string` | Must be `'group'`, `'private'`, or `'owner'` |
| `execute` | `function` | Async function that runs when command is called |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `usage` | `string` | `''` | Usage example for help menu |
| `groupOnly` | `boolean` | `false` | Only works in groups |
| `privateOnly` | `boolean` | `false` | Only works in private chats |
| `ownerOnly` | `boolean` | `false` | Only bot owners can use it |
| `aliases` | `array` | `[]` | Alternative command names |

### Execute Function Context

The `execute` function receives a context object with:

```javascript
{
    sock,       // WhatsApp socket instance
    msg,        // Full message object from Baileys
    text,       // Complete message text
    args,       // Text after the command name
    from,       // Chat/group JID
    sender,     // Sender's JID
    isGroup,    // true if message is from a group
    ownerJids   // Array of owner JIDs
}
```

---

## 🔧 Examples

### Simple Command

```javascript
// commands/group/hello.js
module.exports = {
    name: 'hello',
    description: 'Say hello',
    category: 'group',

    async execute({ sock, from, sender }) {
        await sock.sendMessage(from, {
            text: `Hello! 👋`
        })
    }
}
```

### Command with Arguments

```javascript
// commands/group/echo.js
module.exports = {
    name: 'echo',
    description: 'Repeat your message',
    usage: '!echo [message]',
    category: 'group',

    async execute({ sock, from, args }) {
        if (!args.trim()) {
            return await sock.sendMessage(from, {
                text: '❗ Usage: !echo Your message here'
            })
        }

        await sock.sendMessage(from, {
            text: args
        })
    }
}
```

### Group-Only Command with Mentions

```javascript
// commands/group/tagadmins.js
module.exports = {
    name: 'tagadmins',
    description: 'Mention all group admins',
    category: 'group',
    groupOnly: true,

    async execute({ sock, from, isGroup }) {
        if (!isGroup) return

        const groupMeta = await sock.groupMetadata(from)
        const admins = groupMeta.participants
            .filter(p => p.admin)
            .map(p => p.id)

        await sock.sendMessage(from, {
            text: '📢 Calling all admins!',
            mentions: admins
        })
    }
}
```

### Owner-Only Command

```javascript
// commands/owner/broadcast.js
module.exports = {
    name: 'broadcast',
    description: 'Send message to all groups',
    category: 'owner',
    ownerOnly: true,
    privateOnly: true,

    async execute({ sock, from, args }) {
        const message = args.trim()
        if (!message) {
            return await sock.sendMessage(from, {
                text: '❗ Usage: !broadcast Your message'
            })
        }

        const groups = await sock.groupFetchAllParticipating()
        for (const group of Object.values(groups)) {
            await sock.sendMessage(group.id, { text: message })
            await new Promise(r => setTimeout(r, 2000)) // delay
        }

        await sock.sendMessage(from, {
            text: `✅ Broadcast sent to ${Object.keys(groups).length} groups`
        })
    }
}
```

---

## 🛠 Advanced Features

### Command Aliases

You can define multiple names for the same command:

```javascript
module.exports = {
    name: 'help',
    aliases: ['h', 'commands', 'menu'],
    // ... rest of config
}
```

Users can now use: `!help`, `!h`, `!commands`, or `!menu`

### Hot Reloading Commands (Development)

You can reload commands without restarting the bot by adding a reload command:

```javascript
// commands/owner/reload.js
module.exports = {
    name: 'reload',
    description: 'Reload all commands',
    category: 'owner',
    ownerOnly: true,

    async execute({ sock, from }) {
        const messageHandler = require('../../handlers/messageHandler')
        messageHandler.reloadCommands()
        await sock.sendMessage(from, {
            text: '✅ Commands reloaded successfully!'
        })
    }
}
```

---

## 🐛 Troubleshooting

### Command Not Working?

1. **Check the console** - The bot logs all loaded commands on startup
2. **Verify the file name** - Should end with `.js`
3. **Check the category** - Must match folder name
4. **Ensure `name` is set** - Required property
5. **Restart the bot** - Commands are loaded on startup

### Common Errors

**Error: Command missing required properties**
- Make sure you have `name` and `execute` defined

**Error: Cannot find module**
- Check your `require()` paths are correct relative to the command file

**Command executes but nothing happens**
- Check for errors in the console
- Add `console.log()` statements to debug
- Verify permissions (groupOnly, privateOnly, ownerOnly)

---

## 📚 Additional Resources

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Bot Handler](../handlers/messageHandler.js)
- [Command Loader](../lib/commandLoader.js)

---

## 🎯 Best Practices

1. **Keep commands simple** - One command should do one thing well
2. **Validate input** - Always check if required arguments are provided
3. **Handle errors gracefully** - Use try-catch blocks for external operations
4. **Add helpful usage messages** - Tell users how to use the command correctly
5. **Use descriptive names** - Command names should be clear and intuitive
6. **Add delays for bulk operations** - Prevent spam detection with `setTimeout`
7. **Document your commands** - Add comments explaining complex logic

---

Happy coding! 🎉
