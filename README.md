# 🤖 WhatsApp Multi-Tag Bot

A lightweight WhatsApp bot built using [Baileys](https://github.com/WhiskeySockets/Baileys) that lets you:

- Silently tag all group members in messages
- Toggle tagging on/off with commands
- Run custom commands like `!ping`, `!all`, etc.

---

## 📦 Features

- ✅ Invisible tagging of all group members (no `@234...` shown)
- ✅ Toggle `multi-tag` mode per group
- ✅ Command system with easy extensibility
- ✅ Automatically saves group settings to a JSON file
- ✅ Fast and runs on any Node.js environment (v20+)

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/whatsapp-multitag-bot.git
cd whatsapp-multitag-bot
```

### 2. Install Dependencies

> Requires **Node.js v20+**

```bash
npm install
```

### 3. Start the Bot

```bash
node index.js
```

You’ll see a QR code.  
Open WhatsApp → **Linked Devices** → Scan the QR to connect.

---

## 📚 File Structure

```
.
├── auth_info_baileys/        # WhatsApp session data (auto-created)
├── lib/
│   ├── settings.js           # Manages per-group multi-tag state
│   └── utils.js              # Utility functions like silent tag
├── handlers/
│   └── messageHandler.js     # All bot logic & commands
├── group_settings.json       # Persistent group config (auto-created)
├── index.js                  # Entry point
└── .gitignore                # Keeps auth/settings secure
```

---

## ✨ Available Commands

| Command          | Description                                 |
|------------------|---------------------------------------------|
| `!ping`          | Bot replies with `🏓 Pong!`                 |
| `!all`           | Tags all members visibly with @             |
| `!multitag on`   | Turns on **invisible tagging** for group    |
| `!multitag off`  | Turns off invisible tagging for group       |

> When `multi-tag` is on, any group message will be re-sent by the bot and silently tag everyone.

---

## 👨‍💻 Customizing the Bot

Add your own commands in `handlers/messageHandler.js`:

```js
if (text === '!yourcommand') {
    return await sock.sendMessage(from, { text: 'Your response here' })
}
```

---

## 🔐 Security Notes

- **Never share** the `auth_info_baileys/` folder — it contains your WhatsApp session!
- Use the included `.gitignore` to prevent committing sensitive data.

---

## 📁 .gitignore Sample

```gitignore
node_modules/
auth_info_baileys/
group_settings.json
.env
*.log
```

---

## 🧠 Future Ideas

- Restrict commands to admins only
- Store command usage stats
- Add inline chatbot with OpenAI
- Auto-reply based on keywords

---

## 🤝 Credits

Built with ❤️ using [Baileys](https://github.com/WhiskeySockets/Baileys)

---

## 📜 License

MIT License
