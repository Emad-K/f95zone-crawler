import { input, select } from '@inquirer/prompts'
import { crawl } from './crawler'
import { crawlMissingThreads, crawlThread } from './thread-crawler'

async function main() {
  while (true) {
    const answer = await select({
      message: 'Select an action:',
      choices: [
        {
          name: 'Crawl Games List',
          value: 'crawl-list',
          description: 'Crawl the latest games list from F95Zone',
        },
        {
          name: 'Crawl Thread Details',
          value: 'crawl-thread',
          description: 'Crawl details for a specific thread ID',
        },
        {
          name: 'Crawl Missing Threads',
          value: 'crawl-missing',
          description: 'Crawl details for all threads missing from the database',
        },
        {
          name: 'Exit',
          value: 'exit',
          description: 'Exit the application',
        },
      ],
    })

    if (answer === 'crawl-list') {
      await crawl()
    }
    else if (answer === 'crawl-thread') {
      const threadIdStr = await input({
        message: 'Enter Thread ID:',
        validate: (value) => {
          const num = Number.parseInt(value, 10)
          return !Number.isNaN(num) && num > 0 ? true : 'Please enter a valid positive number'
        },
      })
      await crawlThread(Number.parseInt(threadIdStr, 10))
    }
    else if (answer === 'crawl-missing') {
      const delayStr = await input({
        message: 'Enter delay between requests (ms):',
        default: '1000',
        validate: (value) => {
          const num = Number.parseInt(value, 10)
          return !Number.isNaN(num) && num >= 0 ? true : 'Please enter a valid non-negative number'
        },
      })
      const retryDelayStr = await input({
        message: 'Enter delay on 429 error (ms):',
        default: '30000',
        validate: (value) => {
          const num = Number.parseInt(value, 10)
          return !Number.isNaN(num) && num >= 0 ? true : 'Please enter a valid non-negative number'
        },
      })

      await crawlMissingThreads(
        Number.parseInt(delayStr, 10),
        Number.parseInt(retryDelayStr, 10),
      )
    }
    else if (answer === 'exit') {
      console.log('Goodbye!')
      process.exit(0)
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
