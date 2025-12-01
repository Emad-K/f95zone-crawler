import axios from 'axios'
import * as cheerio from 'cheerio'
import cliProgress from 'cli-progress'
import { db } from './db'
import { games, threadDetails } from './db/schema'

const BASE_THREAD_URL = 'https://f95zone.to/threads/'
const USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

export async function crawlThread(threadId: number) {
  const url = `${BASE_THREAD_URL}${threadId}/`
  // console.log(`Fetching thread: ${url}`)

  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  })
  const html = response.data
  const $ = cheerio.load(html)

  // The main content of the first post usually contains the game overview
  const firstPost = $('.message-inner').first()
  const messageContent = firstPost.find('.message-content .bbWrapper')

  // Extract overview (text content)
  let overview = messageContent.text().trim()

  // Remove "Overview:" prefix if present (case-insensitive)
  overview = overview.replace(/^overview:\s*/i, '')

  // Extract hidden overview (spoilers)
  const hiddenOverview = messageContent.find('.bbCodeSpoiler-content').text().trim()

  // Save to database
  await db.insert(threadDetails).values({
    threadId,
    overview,
    hiddenOverview: hiddenOverview || null,
    originalHtml: html,
  }).onConflictDoUpdate({
    target: threadDetails.threadId,
    set: {
      overview,
      hiddenOverview: hiddenOverview || null,
      originalHtml: html,
      updatedAt: new Date(),
    },
  })

  // console.log(`✅ Thread ${threadId} details saved.`)
}

export async function crawlMissingThreads(delay: number, retryDelay: number) {
  console.log('Checking for missing threads...')

  // Get all thread IDs from games table
  const allGames = await db.select({ threadId: games.threadId }).from(games)
  const allThreadIds = allGames.map(g => g.threadId)

  // Get all thread IDs from threadDetails table
  const existingDetails = await db.select({ threadId: threadDetails.threadId }).from(threadDetails)
  const existingThreadIds = new Set(existingDetails.map(d => d.threadId))

  // Find missing threads
  const missingThreadIds = allThreadIds.filter(id => !existingThreadIds.has(id))

  console.log(`Found ${missingThreadIds.length} missing threads.`)

  if (missingThreadIds.length === 0) {
    return
  }

  const progressBar = new cliProgress.SingleBar({
    format: 'Crawling [{bar}] {percentage}% | {value}/{total} Threads | Error: {lastError}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  progressBar.start(missingThreadIds.length, 0, { lastError: 'None' })

  for (let i = 0; i < missingThreadIds.length; i++) {
    const threadId = missingThreadIds[i]

    while (true) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay))
        await crawlThread(threadId)
        progressBar.update(i + 1, { lastError: 'None' })
        break
      }
      catch (error: any) {
        if (error.response?.status === 429) {
          progressBar.update(i, { lastError: '429 Rate Limit' })
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
        else {
          progressBar.update(i, { lastError: error.message || 'Error' })
          // For other errors, we might want to skip or retry a few times
          // For now, let's skip to avoid infinite loop on broken threads
          break
        }
      }
    }
  }

  progressBar.stop()
  console.log('\n✅ Missing threads processing complete.')
}
