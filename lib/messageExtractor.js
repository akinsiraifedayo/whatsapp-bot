const fs = require('fs')
const path = require('path')
const readline = require('readline')

const UNIQUE_DELIMITER = "[NEW_MESSAGE_HERE] "
const MAX_MESSAGE_LENGTH = 19000

const GROUP_MESSAGE = `
For more Novels like this join us on Novels Republic Whatsapp Group

https://chat.whatsapp.com/I39TCVBn32u5rfa04bg7Vv?mode=hqrt3
`

const REPLACEMENTS = [
    { pattern: /coolval/gi, replacement: "Novels Republic" },
    { pattern: /kwaku/gi, replacement: "Novels Republic" },
    { pattern: /zero eight zero three six nine five six four seven one/gi, replacement: "+2348055889183" },
    { pattern: /hi phoenix/gi, replacement: "hi NovelsRepublic" },
]

const PHONE_REGEX = /(\+?(234|233)|0)?[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/gi
const LINK_REGEX = /https?:\/\/\S+|www\.\S+/gi

// WhatsApp message format: "1/2/24, 12:34 - Sender: Message"
const MESSAGE_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*-\s*(.*?):\s*(.*)/

/**
 * Clean message content and randomly insert GROUP_MESSAGE (40% chance)
 */
function cleanAndRandomInsert(message) {
    // Replace phone numbers
    message = message.replace(PHONE_REGEX, "2348055889183")

    // Replace links
    message = message.replace(LINK_REGEX, "https://chat.whatsapp.com/I39TCVBn32u5rfa04bg7Vv?mode=hqrt3")

    // Apply text replacements
    for (const { pattern, replacement } of REPLACEMENTS) {
        message = message.replace(pattern, replacement)
    }

    // 40% chance to insert promotional message
    if (Math.random() < 0.4) {
        const lines = message.split("\n")
        if (lines.length > 0) {
            const insertPos = Math.floor(Math.random() * (lines.length + 1))
            lines.splice(insertPos, 0, GROUP_MESSAGE)
            message = lines.join("\n")
        }
    }

    return message
}

/**
 * Split messages >19k chars on newline boundaries
 */
function splitLongMessage(message) {
    if (message.length <= MAX_MESSAGE_LENGTH) {
        return [message]
    }

    const parts = []
    const lines = message.split("\n")
    let currentChunk = ""

    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
            parts.push(currentChunk.trimEnd())
            currentChunk = line + "\n"
        } else {
            currentChunk += line + "\n"
        }
    }

    if (currentChunk.trim()) {
        parts.push(currentChunk.trimEnd())
    }

    return parts
}

/**
 * Extract and clean WhatsApp messages from exported chat file
 * @param {string} inputContent - Raw content of the WhatsApp chat export
 * @returns {Promise<{output: string, messageCount: number}>}
 */
async function extractMessages(inputContent) {
    const lines = inputContent.split('\n')
    let messageCounter = 0
    let currentMessage = []
    let hasMessageStarted = false
    let output = ''

    for (let line of lines) {
        line = line.trimEnd()

        const match = line.match(MESSAGE_PATTERN)

        if (match) {
            // New message found - process the previous one
            if (hasMessageStarted && currentMessage.length > 0) {
                let fullMessage = currentMessage.join("\n")
                fullMessage = cleanAndRandomInsert(fullMessage)

                for (const part of splitLongMessage(fullMessage)) {
                    messageCounter++
                    output += `[${messageCounter}] ${part}\n\n`
                }

                currentMessage = []
            }

            hasMessageStarted = true
            const messageContent = match[2].replace(/"/g, "'")
            currentMessage.push(messageContent)
        } else {
            // Continuation of previous message
            if (hasMessageStarted) {
                currentMessage.push(line.replace(/"/g, "'"))
            }
        }
    }

    // Process the last message
    if (hasMessageStarted && currentMessage.length > 0) {
        let fullMessage = currentMessage.join("\n")
        fullMessage = cleanAndRandomInsert(fullMessage)

        for (const part of splitLongMessage(fullMessage)) {
            messageCounter++
            output += `[${messageCounter}] ${part}\n\n`
        }
    }

    return { output, messageCount: messageCounter }
}

/**
 * Extract messages from input file and save to output file
 * @param {string} inputPath - Path to WhatsApp chat export
 * @param {string} outputPath - Path to save cleaned messages
 * @returns {Promise<number>} - Number of messages extracted
 */
async function extractFromFile(inputPath, outputPath) {
    const inputContent = fs.readFileSync(inputPath, 'utf-8')
    const { output, messageCount } = await extractMessages(inputContent)
    fs.writeFileSync(outputPath, output, 'utf-8')
    return messageCount
}

module.exports = {
    extractMessages,
    extractFromFile,
    cleanAndRandomInsert,
    splitLongMessage
}
