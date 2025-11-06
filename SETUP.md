# 🚀 WhatsApp Bot - Setup Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A WhatsApp account (will be used for the bot)

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd whatsapp-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Bot

**IMPORTANT:** The bot needs to know your WhatsApp number to give you owner permissions.

#### Option A: Automatic Setup (Recommended)

When you first run the bot, it will automatically create `config.json` from the template:

```bash
npm start
```

The bot will create `config.json` and pause. Edit it with your details:

```bash
nano config.json  # or use your preferred editor
```

#### Option B: Manual Setup

Copy the example configuration:

```bash
cp config.example.json config.json
```

Edit `config.json` with your settings:

```json
{
  "ownerJids": [
    "2348012345678@s.whatsapp.net"
  ],
  "ownerOnlyMode": false,
  "botName": "WhatsApp Bot",
  "prefix": "!",
  "enableDebugLogs": false
}
```

### 4. Get Your WhatsApp JID

You need your WhatsApp number in the correct format: `[country_code][number]@s.whatsapp.net`

**Examples:**
- US: `+1 234 567 8900` → `12345678900@s.whatsapp.net`
- UK: `+44 7700 900000` → `447700900000@s.whatsapp.net`
- Nigeria: `+234 801 234 5678` → `2348012345678@s.whatsapp.net`
- India: `+91 98765 43210` → `919876543210@s.whatsapp.net`

**How to get it:**
1. Start the bot (it will show QR code)
2. Scan QR code with your WhatsApp
3. Send `!ping` to yourself
4. Check console logs - it will show your JID
5. Add it to `config.json`

### 5. Run the Bot

```bash
npm start
```

Or use a process manager for production:

```bash
npm install -g pm2
pm2 start index.js --name whatsapp-bot
pm2 save
pm2 startup
```

---

## 🔐 Security & Configuration

### config.json (Sensitive - Not Committed to Git)

This file contains your owner WhatsApp numbers and bot settings. It is **automatically excluded** from git commits.

**Configuration Options:**

| Option | Type | Description |
|--------|------|-------------|
| `ownerJids` | `array` | Your WhatsApp numbers (owner permissions) |
| `ownerOnlyMode` | `boolean` | If `true`, only owners can use the bot |
| `botName` | `string` | Name of your bot (for future features) |
| `prefix` | `string` | Command prefix (default: `!`) |
| `enableDebugLogs` | `boolean` | Enable verbose logging |

**Example config.json:**

```json
{
  "ownerJids": [
    "2348012345678@s.whatsapp.net",
    "2348098765432@s.whatsapp.net"
  ],
  "ownerOnlyMode": false,
  "botName": "My Awesome Bot",
  "prefix": "!",
  "enableDebugLogs": false
}
```

### config.example.json (Safe - Committed to Git)

This is a template file that **should be committed** to git. It shows the structure but contains no real data.

---

## 📁 Files That Are Safe to Commit

✅ **Safe to push to GitHub:**
- `config.example.json` - Template configuration
- `index.js` - Main bot file
- `handlers/` - All handler files
- `commands/` - All command files
- `lib/` - Utility files
- `README.md`, `SETUP.md` - Documentation

❌ **Never commit these (already in .gitignore):**
- `config.json` - Contains your WhatsApp numbers
- `auth_info_baileys/` - Your WhatsApp session
- `node_modules/` - Dependencies
- `group_settings.json` - Group-specific settings

---

## 🔄 First Run Checklist

1. ✅ Run `npm install`
2. ✅ Create `config.json` (auto-created or copy from example)
3. ✅ Add your WhatsApp JID to `config.json`
4. ✅ Run `npm start`
5. ✅ Scan QR code with WhatsApp
6. ✅ Test with `!ping` command
7. ✅ Verify owner commands work with `!help`

---

## 🐛 Troubleshooting

### "No owner JIDs configured"
- Edit `config.json` and add your WhatsApp number in the correct format
- Format: `[country_code][number]@s.whatsapp.net`

### "config.json not found"
- The bot should auto-create it on first run
- If not, copy `config.example.json` to `config.json`

### "Owner commands not working"
- Make sure your JID in `config.json` matches exactly
- Check console logs to see your actual JID
- Format must include `@s.whatsapp.net` at the end

### "Cannot parse config.json"
- Make sure the JSON syntax is valid
- Use a JSON validator: https://jsonlint.com/
- Common issues: missing commas, trailing commas, unmatched brackets

---

## 🎯 Adding More Owners

Simply add more WhatsApp JIDs to the `ownerJids` array:

```json
{
  "ownerJids": [
    "2348012345678@s.whatsapp.net",
    "2348098765432@s.whatsapp.net",
    "919876543210@s.whatsapp.net"
  ]
}
```

Restart the bot to apply changes.

---

## 🔒 Owner-Only Mode

Enable this to restrict **ALL** bot commands to owners only:

```json
{
  "ownerOnlyMode": true
}
```

When enabled:
- Only JIDs in `ownerJids` can use the bot
- All other users are silently ignored
- Useful for private/personal bots

---

## 📚 Next Steps

- Read [COMMANDS_GUIDE.md](COMMANDS_GUIDE.md) to learn about the command system
- Read [commands/README.md](commands/README.md) to create custom commands
- Check [index.js](index.js) to understand the bot structure

---

## 🆘 Getting Help

1. Check the console logs for error messages
2. Verify `config.json` is valid JSON
3. Make sure your WhatsApp JID is correct
4. Ensure the bot is connected (you should see "✅ Bot is online!")

Happy botting! 🤖
