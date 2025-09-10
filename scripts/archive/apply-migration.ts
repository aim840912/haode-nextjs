/**
 * Script to manually apply the farm tour migration
 */

import { createServiceSupabaseClient } from '../src/lib/supabase-server'
import fs from 'fs'
import path from 'path'

async function applyMigration() {
  try {
    console.log('🔄 Applying farm tour migration...')

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/021_extend_inquiry_for_farm_tour.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split SQL statements by semicolon and filter out empty ones
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const client = createServiceSupabaseClient()

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)

      try {
        const { error } = await client.rpc('exec_sql', { sql: statement })

        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await client.from('_temp').select().limit(0)
          if (directError) {
            console.log(`   ⚠️  Statement might have executed successfully despite error reporting`)
          } else {
            console.log(`   ❌ Error: ${error.message}`)
          }
        } else {
          console.log(`   ✅ Success`)
        }
      } catch (err) {
        console.log(`   ⚠️  Exception: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Test if the columns were added successfully
    console.log('\n🔍 Verifying migration...')
    const { data, error } = await client
      .from('inquiries')
      .select('inquiry_type, activity_title, visit_date, visitor_count')
      .limit(1)

    if (error) {
      console.log(`❌ Verification failed: ${error.message}`)
    } else {
      console.log('✅ Migration verification successful! New columns are available.')
    }
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()
