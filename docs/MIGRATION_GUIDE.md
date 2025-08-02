# Database Migration Guide

This guide provides step-by-step instructions for setting up and running the CRM database migrations.

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project set up**
   - Create a new Supabase project at https://supabase.com
   - Note your project URL and anon key

3. **Local environment configured**
   ```bash
   # Initialize Supabase in your project
   supabase init
   
   # Link to your remote project
   supabase link --project-ref YOUR_PROJECT_ID
   ```

## Migration Order and Dependencies

The migrations must be applied in the correct order due to dependencies:

1. `20250801064727_cool_palace.sql` - Workspaces and basic structure
2. `20250801064742_quiet_sunset.sql` - Roles and permissions (adds FK constraints)
3. `20250801064758_lingering_unit.sql` - Leads management
4. `20250801064821_floating_dream.sql` - Plans and subscriptions
5. `20250801064838_long_coral.sql` - User profiles and invitations
6. `20250801064856_tender_forest.sql` - Activity tracking
7. `20250801064928_red_frost.sql` - Webhook system
8. `20250801064953_super_night.sql` - Analytics and reporting
9. `20250801065022_hidden_flame.sql` - Data validation and constraints
10. `20250802000000_database_integrity_fixes.sql` - Foreign key fixes and integrity

## Running Migrations

### Option 1: Apply All Migrations (Recommended)

```bash
# Reset database and apply all migrations
supabase db reset

# Or apply pending migrations only
supabase db push
```

### Option 2: Apply Migrations Individually (For Debugging)

```bash
# Apply specific migration
supabase db push --include-all=false --include-schemas=public

# Or use SQL directly
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/migrations/MIGRATION_FILE.sql
```

## Troubleshooting Common Issues

### Issue 1: "relation 'roles' does not exist"

**Cause**: First migration references roles table before it's created.

**Solution**: 
1. The migrations have been fixed to resolve dependencies
2. Apply migrations in order using `supabase db reset`

### Issue 2: Foreign Key Constraint Violations

**Cause**: Existing data doesn't match new constraints.

**Solution**:
```sql
-- Clean up orphaned records before applying constraints
DELETE FROM workspace_members 
WHERE role_id NOT IN (SELECT id FROM roles);

-- Set default values for missing references
UPDATE workspace_members 
SET role_id = (SELECT id FROM roles WHERE name = 'viewer' LIMIT 1)
WHERE role_id IS NULL;
```

### Issue 3: RLS Policy Errors

**Cause**: Policies reference tables that don't exist yet.

**Solution**: 
- Policies are now created after all tables exist
- Use `supabase db reset` to apply in correct order

### Issue 4: Permission Denied Errors

**Cause**: Database user lacks necessary permissions.

**Solution**:
```sql
-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

## Verification Steps

### 1. Run Test Script

```bash
# Execute the test script to verify database structure
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/test-migrations.sql
```

### 2. Check Key Tables

```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check foreign key constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

### 3. Verify Data Integrity

```sql
-- Run integrity check function
SELECT * FROM check_database_integrity();

-- Should return no issues
```

### 4. Test Basic Operations

```sql
-- Test workspace creation
INSERT INTO workspaces (name, slug) VALUES ('Test Workspace', 'test-workspace');

-- Test role assignment
INSERT INTO workspace_members (workspace_id, user_id, role_id) 
VALUES (
  (SELECT id FROM workspaces WHERE slug = 'test-workspace'),
  'test-user-id',
  (SELECT id FROM roles WHERE name = 'owner' AND is_system = true)
);
```

## Environment-Specific Setup

### Development Environment

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

### Staging Environment

```bash
# Link to staging project
supabase link --project-ref STAGING_PROJECT_ID

# Apply migrations
supabase db push

# Verify deployment
supabase db diff
```

### Production Environment

```bash
# Link to production project
supabase link --project-ref PRODUCTION_PROJECT_ID

# Create backup before migration
pg_dump -h YOUR_PROD_HOST -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
supabase db push

# Verify integrity
psql -h YOUR_PROD_HOST -U postgres -d postgres -f scripts/test-migrations.sql
```

## Rollback Procedures

### Rollback Single Migration

```sql
-- Manually reverse changes from specific migration
-- Example: Drop table created in migration
DROP TABLE IF EXISTS new_table_name CASCADE;

-- Remove from migration history
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = 'MIGRATION_VERSION';
```

### Full Database Rollback

```bash
# Restore from backup
pg_restore -h YOUR_DB_HOST -U postgres -d postgres backup_file.sql

# Or reset to clean state
supabase db reset
```

## Best Practices

### 1. Always Backup Before Migration

```bash
# Create backup
pg_dump -h YOUR_DB_HOST -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Migrations Locally First

```bash
# Test on local instance
supabase start
supabase db reset
# Verify everything works
```

### 3. Monitor Migration Progress

```bash
# Check migration status
supabase migration list

# View applied migrations
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

### 4. Validate After Migration

```bash
# Run integrity checks
psql -f scripts/test-migrations.sql

# Check application functionality
npm run test
```

## Common Migration Patterns

### Adding New Table

```sql
-- Create table
CREATE TABLE new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "workspace_isolation" ON new_table
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Add indexes
CREATE INDEX idx_new_table_workspace_id ON new_table(workspace_id);
```

### Adding Foreign Key to Existing Table

```sql
-- Add column
ALTER TABLE existing_table ADD COLUMN new_fk_id uuid;

-- Update existing records with default value
UPDATE existing_table SET new_fk_id = (SELECT id FROM reference_table LIMIT 1);

-- Add constraint
ALTER TABLE existing_table 
ADD CONSTRAINT existing_table_new_fk_id_fkey 
FOREIGN KEY (new_fk_id) REFERENCES reference_table(id);

-- Add index
CREATE INDEX idx_existing_table_new_fk_id ON existing_table(new_fk_id);
```

## Support and Troubleshooting

If you encounter issues:

1. Check the migration logs for specific error messages
2. Verify your database permissions
3. Ensure all prerequisites are met
4. Run the test script to identify specific problems
5. Check the troubleshooting section above for common solutions

For additional help, refer to:
- Supabase documentation: https://supabase.com/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Project-specific documentation in the `/docs` folder
