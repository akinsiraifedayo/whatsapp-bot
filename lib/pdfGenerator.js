const PDFDocument = require('pdfkit')
const fs = require('fs')

// Path to Noto font (supports emojis and most Unicode)
const NOTO_FONT_PATH = '/usr/share/fonts/noto/NotoSans-Regular.ttf'
const NOTO_BOLD_PATH = '/usr/share/fonts/noto/NotoSans-Bold.ttf'

/**
 * PDF Generation settings optimized for reading
 * - Font: Noto Sans (supports emojis and Unicode)
 * - Size: 11pt (comfortable reading size)
 * - Line height: 1.5x (good spacing)
 * - Margins: 50pt (comfortable margins)
 */
const PDF_CONFIG = {
    fontSize: 11,
    lineGap: 6,
    margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
    }
}

/**
 * Check if Noto fonts are available
 */
function hasNotoFonts() {
    return fs.existsSync(NOTO_FONT_PATH) && fs.existsSync(NOTO_BOLD_PATH)
}

/**
 * Parse cleaned_messages.txt into individual messages
 * @param {string} content - Raw content of cleaned_messages.txt
 * @returns {Array<{number: string, text: string}>}
 */
function parseMessages(content) {
    const messages = []
    const lines = content.split('\n')
    let currentMessage = null

    for (const line of lines) {
        const match = line.match(/^\[(\d+)\]\s*(.*)/)

        if (match) {
            if (currentMessage) {
                messages.push(currentMessage)
            }
            currentMessage = {
                number: match[1],
                text: match[2] || ''
            }
        } else if (currentMessage) {
            currentMessage.text += '\n' + line
        }
    }

    if (currentMessage) {
        messages.push(currentMessage)
    }

    return messages
}

/**
 * Generate PDF from cleaned messages
 * @param {string} inputPath - Path to cleaned_messages.txt
 * @param {string} outputPath - Path to output PDF
 * @returns {Promise<{pageCount: number, messageCount: number, title: string}>}
 */
async function generatePDF(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const content = fs.readFileSync(inputPath, 'utf-8')
            const messages = parseMessages(content)

            if (messages.length === 0) {
                return reject(new Error('No messages found in file'))
            }

            // Get title from last message (novel name)
            const lastMessage = messages[messages.length - 1]
            const title = lastMessage.text.trim().split('\n')[0].substring(0, 100) || 'Novel'

            const doc = new PDFDocument({
                size: 'A4',
                margins: PDF_CONFIG.margins,
                bufferPages: true
            })

            const stream = fs.createWriteStream(outputPath)
            doc.pipe(stream)

            // Register Noto fonts if available (supports emojis)
            const useNoto = hasNotoFonts()
            if (useNoto) {
                doc.registerFont('NotoSans', NOTO_FONT_PATH)
                doc.registerFont('NotoSans-Bold', NOTO_BOLD_PATH)
            }

            const regularFont = useNoto ? 'NotoSans' : 'Helvetica'
            const boldFont = useNoto ? 'NotoSans-Bold' : 'Helvetica-Bold'

            // Title (from last message - the novel name)
            doc.font(boldFont)
                .fontSize(20)
                .text(title, { align: 'center' })
                .moveDown(2)

            // Reset for content
            doc.fillColor('#000000')

            // Write messages (excluding the last one which is the title)
            const contentMessages = messages.slice(0, -1)

            for (let i = 0; i < contentMessages.length; i++) {
                const msg = contentMessages[i]

                // Message number header
                doc.font(boldFont)
                    .fontSize(10)
                    .fillColor('#444444')
                    .text(`[${msg.number}]`, { continued: false })

                // Message content
                doc.font(regularFont)
                    .fontSize(PDF_CONFIG.fontSize)
                    .fillColor('#000000')
                    .text(msg.text.trim(), {
                        lineGap: PDF_CONFIG.lineGap,
                        align: 'left'
                    })

                // Add spacing between messages (except after last)
                if (i < contentMessages.length - 1) {
                    doc.moveDown(1.2)

                    const y = doc.y
                    doc.strokeColor('#DDDDDD')
                        .lineWidth(0.5)
                        .moveTo(PDF_CONFIG.margins.left, y)
                        .lineTo(doc.page.width - PDF_CONFIG.margins.right, y)
                        .stroke()

                    doc.moveDown(0.8)
                }
            }

            doc.end()

            stream.on('finish', () => {
                const pageCount = doc.bufferedPageRange().count
                resolve({
                    pageCount,
                    messageCount: messages.length,
                    title
                })
            })

            stream.on('error', reject)

        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Get a specific message by number
 * @param {string} inputPath - Path to cleaned_messages.txt
 * @param {number} messageNumber - Message number to retrieve (1-based)
 * @returns {string|null}
 */
function getMessage(inputPath, messageNumber) {
    const content = fs.readFileSync(inputPath, 'utf-8')
    const messages = parseMessages(content)

    const msg = messages.find(m => parseInt(m.number) === messageNumber)
    return msg ? `[${msg.number}] ${msg.text.trim()}` : null
}

/**
 * Get total message count
 * @param {string} inputPath - Path to cleaned_messages.txt
 * @returns {number}
 */
function getMessageCount(inputPath) {
    const content = fs.readFileSync(inputPath, 'utf-8')
    return parseMessages(content).length
}

/**
 * Get the title (last message) from cleaned messages
 * @param {string} inputPath - Path to cleaned_messages.txt
 * @returns {string}
 */
function getTitle(inputPath) {
    const content = fs.readFileSync(inputPath, 'utf-8')
    const messages = parseMessages(content)
    if (messages.length === 0) return 'Novel'
    const lastMessage = messages[messages.length - 1]
    return lastMessage.text.trim().split('\n')[0].substring(0, 100) || 'Novel'
}

module.exports = {
    generatePDF,
    getMessage,
    getMessageCount,
    getTitle,
    parseMessages
}
