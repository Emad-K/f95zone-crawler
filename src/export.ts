import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { games, prefixes, tags, threadDetails } from './db/schema'

async function exportData() {
  console.log('Starting export...')

  try {
    // Fetch all tags and prefixes
    const allTags = await db.select().from(tags)
    const allPrefixes = await db.select().from(prefixes)

    // Create maps for quick lookup
    const tagMap = new Map<number, string>()
    allTags.forEach(t => tagMap.set(t.id, t.name))

    const prefixMap = new Map<number, string>()
    allPrefixes.forEach(p => prefixMap.set(p.id, p.name))

    // Fetch all games
    const allGames = await db.select().from(games)
    console.log(`Found ${allGames.length} games.`)

    // Fetch all thread details (excluding originalHtml to save memory)
    const allThreadDetails = await db.select({
      threadId: threadDetails.threadId,
      overview: threadDetails.overview,
      hiddenOverview: threadDetails.hiddenOverview,
    }).from(threadDetails)
    const threadDetailsMap = new Map<number, { overview: string | null, hiddenOverview: string | null }>()
    allThreadDetails.forEach(td => threadDetailsMap.set(td.threadId, {
      overview: td.overview,
      hiddenOverview: td.hiddenOverview,
    }))

    // Transform data
    const exportedGames = allGames.map((game) => {
      const details = threadDetailsMap.get(game.threadId)
      return {
        ...game,
        tags: game.tags?.map(tagId => tagMap.get(tagId) || `Unknown Tag (${tagId})`) || [],
        prefixes: game.prefixes?.map(prefixId => prefixMap.get(prefixId) || `Unknown Prefix (${prefixId})`) || [],
        timestamp: game.timestamp?.toString(), // Convert BigInt to string for JSON serialization
        overview: details?.overview || null,
        hiddenOverview: details?.hiddenOverview || null,
      }
    })

    // Write to file
    const outputDir = path.join(process.cwd(), 'output')
    await fs.mkdir(outputDir, { recursive: true })

    const outputPath = path.join(outputDir, 'export.json')
    await fs.writeFile(outputPath, JSON.stringify(exportedGames, null, 2))

    console.log(`✅ Exported ${exportedGames.length} games to ${outputPath}`)
    console.log(`   ${allThreadDetails.length} games have overview data`)
  }
  catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  }
  finally {
    process.exit(0)
  }
}

exportData()
