const { postNewJobs } = require('../lib/jobsFetcher')
const { loadConfig } = require('../lib/config')

const THIRTY_MINUTES = 30 * 60 * 1000

let schedulerInterval = null

/**
 * Setup the automatic jobs posting scheduler.
 * Starts posting every 30 minutes once the bot connects.
 */
function setupJobsScheduler(sock) {
    // Clear any existing interval (in case of reconnect)
    if (schedulerInterval) {
        clearInterval(schedulerInterval)
        schedulerInterval = null
    }

    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            const config = loadConfig()

            if (!config.jobsApiUrl || !config.jobsApiKey || !config.jobsChannelJid) {
                console.log('⏭️  Jobs scheduler skipped - not configured (set jobsApiUrl, jobsApiKey, jobsChannelJid)')
                return
            }

            if (config.jobsAutoPost === false) {
                console.log('⏭️  Jobs auto-posting disabled in config')
                return
            }

            console.log('⏰ Jobs scheduler started - posting every 30 minutes')

            // Run once on startup after a short delay
            setTimeout(async () => {
                try {
                    const result = await postNewJobs(sock)
                    if (result.sent > 0) {
                        console.log(`📬 Auto-posted ${result.sent} new job(s)`)
                    } else {
                        console.log('📭 No new jobs to post')
                    }
                    if (result.error) {
                        console.error('Jobs scheduler error:', result.error)
                    }
                } catch (err) {
                    console.error('Jobs scheduler error:', err.message)
                }
            }, 10000) // 10 second delay after connect

            // Then repeat every 30 minutes
            schedulerInterval = setInterval(async () => {
                try {
                    const result = await postNewJobs(sock)
                    if (result.sent > 0) {
                        console.log(`📬 Auto-posted ${result.sent} new job(s)`)
                    }
                    if (result.error) {
                        console.error('Jobs scheduler error:', result.error)
                    }
                } catch (err) {
                    console.error('Jobs scheduler error:', err.message)
                }
            }, THIRTY_MINUTES)
        }

        // Clear interval if connection closes
        if (update.connection === 'close') {
            if (schedulerInterval) {
                clearInterval(schedulerInterval)
                schedulerInterval = null
                console.log('⏰ Jobs scheduler stopped')
            }
        }
    })
}

module.exports = { setupJobsScheduler }
