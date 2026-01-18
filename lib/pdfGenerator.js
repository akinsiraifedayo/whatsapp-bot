const PDFDocument = require('pdfkit')
const fs = require('fs')

/**
 * PDF Generation settings optimized for reading
 * - Font: Helvetica (clean, readable)
 * - Size: 11pt (comfortable reading size)
 * - Line height: 1.5x (good spacing)
 * - Margins: 50pt (comfortable margins)
 */
const PDF_CONFIG = {
    font: 'Helvetica',
    fontSize: 11,
    lineGap: 6,           // Extra space between lines (1.5x line height)
    paragraphGap: 16,     // Space between messages
    margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
    }
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
            // Save previous message
            if (currentMessage) {
                messages.push(currentMessage)
            }
            // Start new message
            currentMessage = {
                number: match[1],
                text: match[2] || ''
            }
        } else if (currentMessage && line.trim()) {
            // Continuation of current message
            currentMessage.text += '\n' + line
        }
    }

    // Don't forget the last message
    if (currentMessage) {
        messages.push(currentMessage)
    }

    return messages
}

/**
 * Generate PDF from cleaned messages
 * @param {string} inputPath - Path to cleaned_messages.txt
 * @param {string} outputPath - Path to output PDF
 * @returns {Promise<{pageCount: number, messageCount: number}>}
 */
async function generatePDF(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const content = fs.readFileSync(inputPath, 'utf-8')
            const messages = parseMessages(content)

            if (messages.length === 0) {
                return reject(new Error('No messages found in file'))
            }

            const doc = new PDFDocument({
                size: 'A4',
                margins: PDF_CONFIG.margins,
                bufferPages: true
            })

            const stream = fs.createWriteStream(outputPath)
            doc.pipe(stream)

            // Title
            doc.font('Helvetica-Bold')
                .fontSize(18)
                .text('Cleaned Messages', { align: 'center' })
                .moveDown(0.5)

            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('#666666')
                .text(`Total messages: ${messages.length}`, { align: 'center' })
                .moveDown(1.5)

            // Reset color for content
            doc.fillColor('#000000')

            // Write messages
            doc.font(PDF_CONFIG.font)
                .fontSize(PDF_CONFIG.fontSize)

            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i]

                // Message number header
                doc.font('Helvetica-Bold')
                    .fontSize(10)
                    .fillColor('#444444')
                    .text(`[${msg.number}]`, { continued: false })

                // Message content
                doc.font(PDF_CONFIG.font)
                    .fontSize(PDF_CONFIG.fontSize)
                    .fillColor('#000000')
                    .text(msg.text.trim(), {
                        lineGap: PDF_CONFIG.lineGap,
                        align: 'left'
                    })

                // Add spacing between messages (except after last)
                if (i < messages.length - 1) {
                    doc.moveDown(1.2)

                    // Add subtle separator line
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
                    messageCount: messages.length
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

module.exports = {
    generatePDF,
    getMessage,
    getMessageCount,
    parseMessages
}
