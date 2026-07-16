# Supabase schema

SQL in this folder is applied manually or via `supabase db push` / the Supabase MCP `apply_migration` tool. Run scripts in this order on a **new** project:

1. [`profiles.sql`](profiles.sql) — `profiles` table, RLS, signup trigger
2. [`listing_usage.sql`](listing_usage.sql) — `listings_used` column, `increment_listings_used` RPC
3. [`usage_period_reset.sql`](usage_period_reset.sql) — `usage_period_start`, `get_or_create_profile_with_reset` RPC
4. [`signup_abuse_prevention.sql`](signup_abuse_prevention.sql) — optional abuse detection
5. [`usage_events.sql`](usage_events.sql) — optional analytics

Tracked migrations live in [`migrations/`](migrations/). Before shipping app code that calls a new RPC, confirm the function exists in production:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'your_function_name';
```

After creating or replacing functions manually, reload PostgREST:

```sql
NOTIFY pgrst, 'reload schema';
```
