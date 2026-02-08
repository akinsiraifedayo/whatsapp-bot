const fs = require('fs')
const path = require('path')
const { proto } = require('@whiskeysockets/baileys')
const { loadConfig } = require('./config')

const SENT_JOBS_PATH = path.join(__dirname, '..', 'sent_jobs.json')

/**
 * Load tracker: { sentIds: string[], lastFetchedAt: string|null }
 */
function loadTracker() {
    try {
        if (fs.existsSync(SENT_JOBS_PATH)) {
            const data = JSON.parse(fs.readFileSync(SENT_JOBS_PATH, 'utf-8'))
            // Handle both old format (plain array) and new format (object)
            if (Array.isArray(data)) {
                return { sentIds: new Set(data), lastFetchedAt: null }
            }
            return {
                sentIds: new Set(data.sentIds || []),
                lastFetchedAt: data.lastFetchedAt || null
            }
        }
    } catch (err) {
        console.error('Error loading sent_jobs.json:', err.message)
    }
    return { sentIds: new Set(), lastFetchedAt: null }
}

/**
 * Save tracker
 */
function saveTracker(sentIds, lastFetchedAt) {
    try {
        fs.writeFileSync(SENT_JOBS_PATH, JSON.stringify({
            sentIds: [...sentIds],
            lastFetchedAt
        }, null, 2))
    } catch (err) {
        console.error('Error saving sent_jobs.json:', err.message)
    }
}

// Keep old exports working for the !jobs reset command
function loadSentJobs() {
    return loadTracker().sentIds
}

function saveSentJobs(sentSet) {
    saveTracker(sentSet, null)
}

/**
 * Fetch jobs from the jobs-hub API published after `since` timestamp.
 * If no since is provided, uses the last fetched time from tracker.
 * On very first run (no tracker), defaults to last 72 hours.
 */
async function fetchNewJobs(sinceOverride) {
    const config = loadConfig()
    const apiUrl = config.jobsApiUrl
    const apiKey = config.jobsApiKey

    if (!apiUrl || !apiKey) {
        console.error('Jobs feed not configured. Set jobsApiUrl and jobsApiKey in config.json')
        return []
    }

    try {
        const tracker = loadTracker()

        // Determine the "since" cutoff:
        // 1. Explicit override (from command)
        // 2. Last successful fetch time from tracker
        // 3. First run fallback: 72 hours ago
        const since = sinceOverride
            || tracker.lastFetchedAt
            || new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

        const url = new URL('/api/jobs/feed', apiUrl)
        url.searchParams.set('limit', '50')
        url.searchParams.set('since', since)

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
 * Download an image and return it as a Buffer
 */
async function fetchThumbnail(imageUrl) {
    try {
        const response = await fetch(imageUrl)
        if (!response.ok) return null
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
    } catch (err) {
        console.error('Error fetching thumbnail:', err.message)
        return null
    }
}

/**
 * Send a job message to a WhatsApp newsletter channel with link preview
 */
async function sendToChannel(sock, channelJid, text, job) {
    let msg

    if (job && job.url) {
        const thumbnail = job.image ? await fetchThumbnail(job.image) : null

        msg = {
            extendedTextMessage: {
                text: text,
                matchedText: job.url,
                canonicalUrl: job.url,
                title: job.title || '',
                description: job.description || '',
                ...(thumbnail ? { jpegThumbnail: thumbnail } : {})
            }
        }
    } else {
        msg = { conversation: text }
    }

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
async function postNewJobs(sock, sinceOverride) {
    const config = loadConfig()
    const channelJid = config.jobsChannelJid

    if (!channelJid) {
        return { sent: 0, skipped: 0, error: 'jobsChannelJid not configured in config.json' }
    }

    const jobs = await fetchNewJobs(sinceOverride)
    if (jobs.length === 0) {
        // Don't update lastFetchedAt on empty results - new jobs may not exist yet
        return { sent: 0, skipped: 0, error: null }
    }

    const tracker = loadTracker()
    const newJobs = jobs.filter(job => !tracker.sentIds.has(job.id))

    if (newJobs.length === 0) {
        saveTracker(tracker.sentIds, new Date().toISOString())
        return { sent: 0, skipped: jobs.length, error: null }
    }

    let sentCount = 0
    for (const job of newJobs) {
        try {
            const message = formatJobMessage(job)
            await sendToChannel(sock, channelJid, message, job)
            tracker.sentIds.add(job.id)
            sentCount++

            // Delay between messages to avoid rate limiting
            if (sentCount < newJobs.length) {
                await new Promise(res => setTimeout(res, 3000))
            }
        } catch (err) {
            console.error(`Error posting job "${job.title}":`, err.message)
        }
    }

    saveTracker(tracker.sentIds, new Date().toISOString())

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
