const fs = require('fs')
const path = './group_settings.json'

let settings = {}
if (fs.existsSync(path)) {
    try {
        const content = fs.readFileSync(path, 'utf-8').trim()
        if (content) {
            settings = JSON.parse(content)
        }
    } catch {
        // Invalid JSON, start fresh
        settings = {}
    }
}

function save() {
    fs.writeFileSync(path, JSON.stringify(settings, null, 2))
}

function setMultiTag(groupId, status) {
    settings[groupId] = { multiTag: status }
    save()
}

function getMultiTag(groupId) {
    return settings[groupId]?.multiTag || false
}

module.exports = { setMultiTag, getMultiTag }
