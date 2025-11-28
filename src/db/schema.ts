import { bigint, boolean, index, integer, pgTable, primaryKey, real, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').unique().notNull(),
  title: text('title').notNull(),
  creator: text('creator'),
  version: text('version'),
  views: integer('views'),
  likes: integer('likes'),
  prefixes: integer('prefixes').array(),
  tags: integer('tags').array(),
  rating: real('rating'),
  cover: text('cover'),
  screens: text('screens').array(),
  timestamp: bigint('timestamp', { mode: 'bigint' }),
  watched: boolean('watched').default(false),
  ignored: boolean('ignored').default(false),
  isNew: boolean('is_new').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
  return {
    timestampIdx: index('timestamp_idx').on(table.timestamp),
  }
})

export const tags = pgTable('tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})

export const prefixes = pgTable('prefixes', {
  id: integer('id').notNull(),
  name: text('name').notNull(),
  class: text('class'),
  category: text('category').notNull(), // e.g., "Engine", "Status"
  type: text('type').notNull(), // e.g., "games", "comics"
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.id, table.type, table.category] }),
  }
})
