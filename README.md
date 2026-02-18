# Login

Centralized authentication service for mklv.tech apps using Supabase Auth.

## Development

### Prerequisites

- [Deno](https://deno.com/) (version in `.deno-version`)
- [Atlas CLI](https://atlasgo.io/getting-started) for database schema management
- Docker (for Atlas dev container)

### Atlas Installation

```bash
# macOS
brew install ariga/tap/atlas

# Or via curl
curl -sSf https://atlasgo.sh | sh
```

### Database Schema

The database schema is defined in `db/schema.hcl`. To view or apply changes:

```bash
# View what would change
DATABASE_URL="postgres://..." deno task db:diff

# Apply schema changes
DATABASE_URL="postgres://..." deno task db:apply
```

The tasks use `--schema login` to limit Atlas to the app's schema, avoiding conflicts with Supabase system tables.

### Running Locally

```bash
# Fetch secrets (requires gcloud auth)
eval $(deno task secrets)

# Run with hot reload
deno task dev
```

### Testing

```bash
deno task test       # Unit tests
deno task test:all   # All tests
```
