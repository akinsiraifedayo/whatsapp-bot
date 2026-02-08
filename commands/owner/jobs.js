const { postNewJobs, fetchNewJobs, formatJobMessage, loadSentJobs, saveSentJobs } = require('../../lib/jobsFetcher')
const { loadConfig } = require('../../lib/config')

module.exports = {
    name: 'jobs',
    description: 'Fetch and post new jobs to the WhatsApp channel. Use !jobs preview to see without posting.',
    usage: '!jobs [preview|reset]',
    category: 'owner',
    privateOnly: true,
    ownerOnly: true,

    async execute({ sock, from, args }) {
        const subcommand = args ? args.trim().toLowerCase() : ''

        // Preview mode - show what would be posted without actually posting
        if (subcommand === 'preview') {
            await sock.sendMessage(from, { text: '🔍 Fetching jobs for preview...' })

            const jobs = await fetchNewJobs()
            if (jobs.length === 0) {
                return await sock.sendMessage(from, { text: '📭 No jobs found from the API.' })
            }

            const sentJobs = loadSentJobs()
            const newJobs = jobs.filter(job => !sentJobs.has(job.id))

            if (newJobs.length === 0) {
                return await sock.sendMessage(from, {
                    text: `✅ All ${jobs.length} jobs have already been sent. No new jobs to post.`
                })
            }

            // Show first 3 as preview
            const previewCount = Math.min(3, newJobs.length)
            let preview = `📋 *${newJobs.length} new jobs found* (showing ${previewCount}):\n\n`

            for (let i = 0; i < previewCount; i++) {
                preview += formatJobMessage(newJobs[i]) + '\n\n---\n\n'
            }

            if (newJobs.length > previewCount) {
                preview += `... and ${newJobs.length - previewCount} more.\n\nUse *!jobs* to post them all.`
            }

            return await sock.sendMessage(from, { text: preview })
        }

        // Reset - clear sent jobs tracker
        if (subcommand === 'reset') {
            saveSentJobs(new Set())
            return await sock.sendMessage(from, {
                text: '🔄 Sent jobs tracker has been reset. All jobs will be treated as new.'
            })
        }

        // Post new jobs
        const config = loadConfig()
        if (!config.jobsApiUrl || !config.jobsApiKey || !config.jobsChannelJid) {
            return await sock.sendMessage(from, {
                text: '❌ Jobs feed not configured. Add jobsApiUrl, jobsApiKey, and jobsChannelJid to config.json'
            })
        }

        await sock.sendMessage(from, { text: '📡 Fetching and posting new jobs...' })

        const result = await postNewJobs(sock)

        if (result.error) {
            return await sock.sendMessage(from, { text: `❌ ${result.error}` })
        }

        let statusMsg = ''
        if (result.sent === 0 && result.skipped === 0) {
            statusMsg = '📭 No jobs found from the API.'
        } else if (result.sent === 0) {
            statusMsg = `✅ All ${result.skipped} jobs have already been posted. Nothing new.`
        } else {
            statusMsg = `✅ Posted ${result.sent} new job(s) to the channel.`
            if (result.skipped > 0) {
                statusMsg += ` (${result.skipped} already sent)`
            }
        }

        await sock.sendMessage(from, { text: statusMsg })
    }
}
