const fs = require('fs')
const path = './group_settings.json'

let settings = {}
if (fs.existsSync(path)) {
    settings = JSON.parse(fs.readFileSync(path))
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
