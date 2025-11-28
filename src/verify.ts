import { sql } from 'drizzle-orm'
import { db } from './db/index'
import { games, prefixes, tags } from './db/schema'

async function verify() {
  console.log('Verifying data integrity...\n')

  // Check total counts
  const gamesCount = await db.select({ count: sql<number>`count(*)` }).from(games)
  const tagsCount = await db.select({ count: sql<number>`count(*)` }).from(tags)
  const prefixesCount = await db.select({ count: sql<number>`count(*)` }).from(prefixes)

  console.log(`📊 Database Statistics:`)
  console.log(`   Games: ${gamesCount[0].count}`)
  console.log(`   Tags: ${tagsCount[0].count}`)
  console.log(`   Prefixes: ${prefixesCount[0].count}\n`)

  // Sample a few games to check their prefixes and tags
  const sampleGames = await db.select().from(games).limit(5)

  console.log(`🎮 Sample Games (showing first 5):\n`)

  for (const game of sampleGames) {
    console.log(`Game: ${game.title}`)
    console.log(`  Thread ID: ${game.threadId}`)
    console.log(`  Created: ${game.createdAt}`)
    console.log(`  Updated: ${game.updatedAt}`)

    // Check if prefixes exist
    if (game.prefixes && game.prefixes.length > 0) {
      console.log(`  Prefixes (${game.prefixes.length}): ${game.prefixes.join(', ')}`)

      // Verify each prefix exists in prefixes table
      const validPrefixes = await db.select()
        .from(prefixes)
        .where(sql`${prefixes.id} = ANY(${game.prefixes}) AND ${prefixes.type} = 'games'`)

      if (validPrefixes.length !== game.prefixes.length) {
        console.log(`  ⚠️  Warning: Some prefix IDs don't exist in prefixes table`)
        console.log(`     Expected: ${game.prefixes.length}, Found: ${validPrefixes.length}`)
      }
      else {
        console.log(`  ✓ All prefixes valid: ${validPrefixes.map(p => p.name).join(', ')}`)
      }
    }

    // Check if tags exist
    if (game.tags && game.tags.length > 0) {
      console.log(`  Tags (${game.tags.length}): ${game.tags.join(', ')}`)

      // Verify each tag exists in tags table
      const validTags = await db.select()
        .from(tags)
        .where(sql`${tags.id} = ANY(${game.tags})`)

      if (validTags.length !== game.tags.length) {
        console.log(`  ⚠️  Warning: Some tag IDs don't exist in tags table`)
        console.log(`     Expected: ${game.tags.length}, Found: ${validTags.length}`)
      }
      else {
        console.log(`  ✓ All tags valid: ${validTags.map(t => t.name).join(', ')}`)
      }
    }

    console.log('')
  }

  // Check for orphaned references
  console.log(`🔍 Checking for data integrity issues...\n`)

  // Find games with invalid prefix IDs
  const gamesWithInvalidPrefixes = await db.execute(sql`
        SELECT g.thread_id, g.title, g.prefixes
        FROM games g
        WHERE EXISTS (
            SELECT 1 FROM unnest(g.prefixes) AS prefix_id
            WHERE NOT EXISTS (
                SELECT 1 FROM prefixes p 
                WHERE p.id = prefix_id AND p.type = 'games'
            )
        )
        LIMIT 10
    `)

  if (gamesWithInvalidPrefixes.rows.length > 0) {
    console.log(`⚠️  Found ${gamesWithInvalidPrefixes.rows.length} games with invalid prefix IDs`)
    gamesWithInvalidPrefixes.rows.forEach((row: any) => {
      console.log(`   - ${row.title} (Thread: ${row.thread_id})`)
    })
  }
  else {
    console.log(`✓ All game prefixes are valid`)
  }

  // Find games with invalid tag IDs
  const gamesWithInvalidTags = await db.execute(sql`
        SELECT g.thread_id, g.title, g.tags
        FROM games g
        WHERE EXISTS (
            SELECT 1 FROM unnest(g.tags) AS tag_id
            WHERE NOT EXISTS (
                SELECT 1 FROM tags t WHERE t.id = tag_id
            )
        )
        LIMIT 10
    `)

  if (gamesWithInvalidTags.rows.length > 0) {
    console.log(`\n⚠️  Found ${gamesWithInvalidTags.rows.length} games with invalid tag IDs`)
    gamesWithInvalidTags.rows.forEach((row: any) => {
      console.log(`   - ${row.title} (Thread: ${row.thread_id})`)
    })
  }
  else {
    console.log(`✓ All game tags are valid`)
  }

  console.log('\n✅ Verification complete!')
}

verify().catch(console.error).finally(() => process.exit(0))
