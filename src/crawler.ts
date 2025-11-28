import type { F95ApiResponse } from './types'
import { parseArgs } from 'node:util'
import axios from 'axios'
import cliProgress from 'cli-progress'
import { sql } from 'drizzle-orm'
import { db } from './db'
import { games } from './db/schema'

const BASE_API_URL = 'https://f95zone.to/sam/latest_alpha/latest_data.php?cmd=list&cat=games&sort=date&_=1764201889014'

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'delay': {
      type: 'string',
      default: '1', // Default 1 second
    },
    'retry-delay': {
      type: 'string',
      default: '1800', // Default 30 minutes (1800 seconds)
    },
  },
})

const DELAY_MS = Number.parseInt(values.delay || '1', 10) * 1000
const RETRY_DELAY_MS = Number.parseInt(values['retry-delay'] || '1800', 10) * 1000

async function processPage(page: number): Promise<number> {
  const url = `${BASE_API_URL}&page=${page}`

  const response = await axios.get<F95ApiResponse>(url)

  if (response.data.status !== 'ok') {
    throw new Error(`API returned error status: ${JSON.stringify(response.data)}`)
  }

  const gamesData = response.data.msg.data

  for (const game of gamesData) {
    await db.insert(games).values({
      threadId: game.thread_id,
      title: game.title,
      creator: game.creator,
      version: game.version,
      views: game.views,
      likes: game.likes,
      prefixes: game.prefixes,
      tags: game.tags,
      rating: game.rating,
      cover: game.cover,
      screens: game.screens,
      timestamp: BigInt(game.ts),
      watched: game.watched,
      ignored: game.ignored,
      isNew: game.new,
    }).onConflictDoUpdate({
      target: games.threadId,
      set: {
        title: sql`excluded.title`,
        creator: sql`excluded.creator`,
        version: sql`excluded.version`,
        views: sql`excluded.views`,
        likes: sql`excluded.likes`,
        prefixes: sql`excluded.prefixes`,
        tags: sql`excluded.tags`,
        rating: sql`excluded.rating`,
        cover: sql`excluded.cover`,
        screens: sql`excluded.screens`,
        timestamp: sql`excluded.timestamp`,
        watched: sql`excluded.watched`,
        ignored: sql`excluded.ignored`,
        isNew: sql`excluded.is_new`,
        updatedAt: new Date(),
      },
    })
  }

  return response.data.msg.pagination.total
}

async function crawl() {
  const progressBar = new cliProgress.SingleBar({
    format: 'Crawling [{bar}] {percentage}% | {value}/{total} Pages | Error: {lastError}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  let lastError = 'None'

  try {
    console.log('Starting crawl...')
    console.log(`Delay between requests: ${DELAY_MS / 1000}s`)
    console.log(`Delay after 429 error: ${RETRY_DELAY_MS / 1000}s\n`)

    // Process page 1 to get total pages
    let totalPages = 0
    while (true) {
      try {
        totalPages = await processPage(1)
        break
      }
      catch (error: any) {
        if (error.response?.status === 429) {
          console.log(`\nRate limit hit on initial page check. Waiting ${RETRY_DELAY_MS / 1000}s...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        }
        else {
          console.error('\nError fetching initial page:', error.message)
          console.log('Retrying in 5 seconds...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
    }

    console.log(`Total pages to fetch: ${totalPages}\n`)
    progressBar.start(totalPages, 1, { lastError: 'None' })

    for (let page = 2; page <= totalPages; page++) {
      while (true) {
        try {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS))
          await processPage(page)
          lastError = 'None'
          progressBar.update(page, { lastError })
          break // Success, move to next page
        }
        catch (error: any) {
          if (error.response?.status === 429) {
            lastError = '429 Rate Limit'
            progressBar.update(page - 1, { lastError })
            // We can't easily log to console without breaking the bar, so we update the bar payload
            // But for a long wait, maybe we should stop the bar?
            // For now, let's just update the status and wait.
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          }
          else {
            lastError = error.message || 'Unknown Error'
            progressBar.update(page - 1, { lastError })
            // Short retry delay for other errors
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        }
      }
    }

    progressBar.stop()
    console.log('\n✅ Data saved successfully.')
  }
  catch (error: any) {
    progressBar.stop()
    console.error('\n❌ Fatal error:', error.message)
  }
  finally {
    process.exit(0)
  }
}

crawl()
