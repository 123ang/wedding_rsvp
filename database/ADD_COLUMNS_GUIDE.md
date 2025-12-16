# Adding Relationship and Remark Columns

## New Columns Added

1. **relationship** - VARCHAR(100) NULL
   - Stores the relationship of the guest to the couple
   - Position: After `organization` column

2. **remark** - TEXT NULL
   - Stores any additional remarks or notes
   - Position: After `seat_table` column

## Migration Steps

### Option 1: If database already exists

Run the migration script:
```bash
mysql -u root wedding_rsvp < database/migration_add_relationship_remark.sql
```

### Option 2: If creating fresh database

The updated `schema.sql` and `create_tables.sql` already include these columns, so no migration needed.

## Updated Files

1. ✅ `database/schema.sql` - Updated table definition
2. ✅ `database/create_tables.sql` - Updated table definition
3. ✅ `database/migration_add_relationship_remark.sql` - Migration script
4. ✅ `api/routes/rsvp.js` - Updated to accept relationship and remark
5. ✅ `api/routes/admin.js` - Updated to return relationship and remark

## API Changes

### RSVP Endpoints

Both `/api/bride-rsvp` and `/api/groom-rsvp` now accept:
- `relationship` (optional) - String
- `remark` (optional) - String

**Example Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "attending": true,
  "number_of_guests": 2,
  "relationship": "Friend",
  "remark": "Will arrive early"
}
```

### Admin Endpoints

`GET /api/admin/rsvps` now returns:
- `relationship` - Relationship to couple
- `remark` - Additional remarks

## Frontend Integration

To use these fields in the frontend:

1. Add input fields to RSVP forms
2. Include `relationship` and `remark` in form submission
3. Display these fields in admin dashboard (optional)

## Verification

After running migration, verify:
```sql
USE wedding_rsvp;
DESCRIBE rsvps;
```

You should see:
- `relationship` column (VARCHAR(100))
- `remark` column (TEXT)

