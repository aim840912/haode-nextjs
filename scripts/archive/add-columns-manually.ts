/**
 * Manually add required columns using Supabase SQL editor approach
 */

import { createServiceSupabaseClient } from '../src/lib/supabase-server'

async function addColumns() {
  try {
    const client = createServiceSupabaseClient()

    console.log('🔍 Checking current table structure...')

    // First, let's see if we can query the table at all
    const { data: existingData, error: selectError } = await client
      .from('inquiries')
      .select('id, status, customer_name')
      .limit(1)

    if (selectError) {
      console.log('❌ Cannot access inquiries table:', selectError.message)
      return
    }

    console.log(`✅ Can access inquiries table, found ${existingData?.length || 0} rows`)

    // Try to check if columns already exist by attempting to select them
    console.log('🔍 Checking if new columns exist...')
    const { data: columnCheck, error: columnError } = await client
      .from('inquiries')
      .select('inquiry_type, activity_title, visit_date, visitor_count')
      .limit(1)

    if (columnError) {
      console.log('❌ New columns do not exist yet:', columnError.message)
      console.log('')
      console.log('⚠️  MANUAL ACTION REQUIRED:')
      console.log('Please execute the following SQL statements in Supabase SQL Editor:')
      console.log('')
      console.log('-- Add inquiry_type column')
      console.log(
        "ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS inquiry_type VARCHAR(20) DEFAULT 'product' CHECK (inquiry_type IN ('product', 'farm_tour'));"
      )
      console.log('')
      console.log('-- Add farm tour specific columns')
      console.log('ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS activity_title VARCHAR(255);')
      console.log('ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS visit_date DATE;')
      console.log('ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS visitor_count VARCHAR(50);')
      console.log('')
      console.log('-- Create indexes')
      console.log(
        'CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON inquiries(inquiry_type);'
      )
      console.log('CREATE INDEX IF NOT EXISTS idx_inquiries_visit_date ON inquiries(visit_date);')
      console.log('')
      console.log('-- Update existing records')
      console.log("UPDATE inquiries SET inquiry_type = 'product' WHERE inquiry_type IS NULL;")
      console.log('')
      console.log('Go to: https://supabase.com/dashboard/project/bxlrtcagsuoijjolgdzs/sql/new')
    } else {
      console.log('✅ All new columns already exist!')
      console.log('Migration appears to be complete.')
    }
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

addColumns()
