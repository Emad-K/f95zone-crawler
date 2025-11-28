# F95Zone Crawler

A crawler for F95Zone games, built with TypeScript, Drizzle ORM, and PostgreSQL.

## Features

- Crawls game data from F95Zone.
- Supports resuming and incremental updates.
- Handles rate limiting (429 errors) with automatic retries.
- Displays a progress bar during crawling.
- Exports data to JSON with resolved tag and prefix names.

## Prerequisites

- Node.js (v18+ recommended)
- pnpm
- PostgreSQL database

## Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Set up your environment variables in `.env`:
    ```env
    DATABASE_URL=postgres://user:password@localhost:5432/f95zone
    ```
4.  Push the database schema:
    ```bash
    pnpm db:push
    ```
5.  Seed the database with tags and prefixes (if not already done):
    ```bash
    pnpm db:seed
    ```

## Usage

### Crawling

To start the crawler:

```bash
pnpm crawl
```

#### Options

- `--delay <seconds>`: Delay between requests in seconds (default: 1).
- `--retry-delay <seconds>`: Delay after a 429 error in seconds (default: 1800 / 30 minutes).

Example:

```bash
pnpm crawl --delay 2 --retry-delay 60
```

### Exporting Data

To export all crawled games to a JSON file (`output/export.json`):

```bash
pnpm export
```

This will generate `export.json` in the `output` directory. The `tags` and `prefixes` fields in the exported JSON will contain arrays of strings (names) instead of IDs.

## Development

- `pnpm dev`: Run the crawler in development mode (using `tsx`).
- `pnpm build`: Build the project.
- `pnpm start`: Run the built project.
