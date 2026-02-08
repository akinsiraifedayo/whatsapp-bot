const fs = require('fs')
const path = require('path')
const { proto } = require('@whiskeysockets/baileys')
const { loadConfig } = require('./config')

const SENT_JOBS_PATH = path.join(__dirname, '..', 'sent_jobs.json')

/**
 * Load the set of already-sent job IDs
 */
function loadSentJobs() {
    try {
        if (fs.existsSync(SENT_JOBS_PATH)) {
            const data = fs.readFileSync(SENT_JOBS_PATH, 'utf-8')
            return new Set(JSON.parse(data))
        }
    } catch (err) {
        console.error('Error loading sent_jobs.json:', err.message)
    }
    return new Set()
}

/**
 * Save the set of sent job IDs
 */
function saveSentJobs(sentSet) {
    try {
        fs.writeFileSync(SENT_JOBS_PATH, JSON.stringify([...sentSet], null, 2))
    } catch (err) {
        console.error('Error saving sent_jobs.json:', err.message)
    }
}

/**
 * Fetch new jobs from the jobs-hub API
 */
async function fetchNewJobs() {
    const config = loadConfig()
    const apiUrl = config.jobsApiUrl
    const apiKey = config.jobsApiKey

    if (!apiUrl || !apiKey) {
        console.error('Jobs feed not configured. Set jobsApiUrl and jobsApiKey in config.json')
        return []
    }

    try {
        const url = new URL('/api/jobs/feed', apiUrl)
        url.searchParams.set('limit', '50')

        const response = await fetch(url.toString(), {
            headers: { 'x-api-key': apiKey }
        })

        if (!response.ok) {
            console.error(`Jobs API returned ${response.status}: ${response.statusText}`)
            return []
        }

        const data = await response.json()
        return data.jobs || []
    } catch (err) {
        console.error('Error fetching jobs:', err.message)
        return []
    }
}

/**
 * Format a job into a WhatsApp message
 */
function formatJobMessage(job) {
    let msg = ''

    msg += `*${job.title}*\n`

    const details = []
    if (job.company) details.push(`🏢 ${job.company}`)
    if (job.location) details.push(`📍 ${job.location}`)
    if (job.jobType) details.push(`💼 ${job.jobType}`)
    if (job.salary) details.push(`💰 ${job.salary}`)

    if (details.length > 0) {
        msg += details.join(' | ') + '\n'
    }

    if (job.categories && job.categories.length > 0) {
        msg += `🏷️ ${job.categories.join(', ')}\n`
    }

    msg += '\n'

    if (job.description) {
        msg += `${job.description}\n\n`
    }

    msg += `🔗 ${job.url}`

    return msg
}

/**
 * Send a message to a WhatsApp newsletter channel
 */
async function sendToChannel(sock, channelJid, text) {
    const msg = { conversation: text }
    const plaintext = proto.Message.encode(msg).finish()

    const plaintextNode = {
        tag: 'plaintext',
        attrs: {},
        content: plaintext
    }

    const node = {
        tag: 'message',
        attrs: { to: channelJid, type: 'text' },
        content: [plaintextNode]
    }

    await sock.query(node)
}

/**
 * Fetch new jobs and post unsent ones to the WhatsApp channel
 * Returns { sent: number, skipped: number, error: string|null }
 */
async function postNewJobs(sock) {
    const config = loadConfig()
    const channelJid = config.jobsChannelJid

    if (!channelJid) {
        return { sent: 0, skipped: 0, error: 'jobsChannelJid not configured in config.json' }
    }

    const jobs = await fetchNewJobs()
    if (jobs.length === 0) {
        return { sent: 0, skipped: 0, error: null }
    }

    const sentJobs = loadSentJobs()
    const newJobs = jobs.filter(job => !sentJobs.has(job.id))

    if (newJobs.length === 0) {
        return { sent: 0, skipped: jobs.length, error: null }
    }

    let sentCount = 0
    for (const job of newJobs) {
        try {
            const message = formatJobMessage(job)
            await sendToChannel(sock, channelJid, message)
            sentJobs.add(job.id)
            sentCount++

            // Delay between messages to avoid rate limiting
            if (sentCount < newJobs.length) {
                await new Promise(res => setTimeout(res, 3000))
            }
        } catch (err) {
            console.error(`Error posting job "${job.title}":`, err.message)
        }
    }

    saveSentJobs(sentJobs)

    return {
        sent: sentCount,
        skipped: jobs.length - newJobs.length,
        error: null
    }
}

module.exports = {
    fetchNewJobs,
    formatJobMessage,
    sendToChannel,
    postNewJobs,
    loadSentJobs,
    saveSentJobs
}
