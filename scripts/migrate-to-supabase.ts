/**
 * Migration script to transfer data from JSON files to Supabase
 * Run this script after setting up Supabase database
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from '../src/lib/supabase'

interface MigrationResult {
  table: string
  success: number
  errors: number
  details: string[]
}

async function migrateData(): Promise<void> {
  console.log('🚀 Starting migration to Supabase...')
  const results: MigrationResult[] = []

  try {
    // Migrate Products
    console.log('\n📦 Migrating products...')
    const productsResult = await migrateProducts()
    results.push(productsResult)

    // Migrate Locations 
    console.log('\n📍 Migrating locations...')
    const locationsResult = await migrateLocations()
    results.push(locationsResult)

    // Migrate News
    console.log('\n📰 Migrating news...')
    const newsResult = await migrateNews()
    results.push(newsResult)

    // Migrate Schedule
    console.log('\n📅 Migrating schedule...')
    const scheduleResult = await migrateSchedule()
    results.push(scheduleResult)

    // Migrate Culture
    console.log('\n🏛️ Migrating culture...')
    const cultureResult = await migrateCulture()
    results.push(cultureResult)

    // Migrate Farm Tour
    console.log('\n🚜 Migrating farm tour...')
    const farmTourResult = await migrateFarmTour()
    results.push(farmTourResult)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(50))

  let totalSuccess = 0
  let totalErrors = 0

  results.forEach(result => {
    console.log(`\n${result.table}:`)
    console.log(`  ✅ Success: ${result.success}`)
    console.log(`  ❌ Errors: ${result.errors}`)
    
    if (result.errors > 0) {
      console.log('  📝 Error details:')
      result.details.forEach(detail => {
        console.log(`    - ${detail}`)
      })
    }

    totalSuccess += result.success
    totalErrors += result.errors
  })

  console.log('\n' + '='.repeat(50))
  console.log(`📈 TOTAL: ${totalSuccess} success, ${totalErrors} errors`)
  console.log('='.repeat(50))

  if (totalErrors === 0) {
    console.log('🎉 Migration completed successfully!')
  } else {
    console.log('⚠️  Migration completed with some errors.')
  }
}

async function migrateProducts(): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Products', success: 0, errors: 0, details: [] }
  
  try {
    const productsJson = readFileSync(join(process.cwd(), 'src/data/products.json'), 'utf-8')
    const products = JSON.parse(productsJson)

    for (const product of products) {
      try {
        const { error } = await supabaseAdmin!
          .from('products')
          .insert({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            image_url: product.imageUrl,
            stock: product.stock,
            is_active: product.isActive
          })

        if (error) {
          result.errors++
          result.details.push(`Product "${product.name}": ${error.message}`)
        } else {
          result.success++
        }
      } catch (err) {
        result.errors++
        result.details.push(`Product "${product.name}": ${err}`)
      }
    }
  } catch (err) {
    result.errors++
    result.details.push(`Failed to read products.json: ${err}`)
  }

  return result
}

async function migrateLocations(): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Locations', success: 0, errors: 0, details: [] }
  
  try {
    const locationsJson = readFileSync(join(process.cwd(), 'src/data/locations.json'), 'utf-8')
    const locations = JSON.parse(locationsJson)

    for (const location of locations) {
      try {
        const { error } = await supabaseAdmin!
          .from('locations')
          .insert({
            name: location.name,
            title: location.title,
            address: location.address,
            landmark: location.landmark,
            phone: location.phone,
            line_id: location.lineId,
            hours: location.hours,
            closed_days: location.closedDays,
            parking: location.parking,
            public_transport: location.publicTransport,
            features: location.features,
            specialties: location.specialties,
            coordinates: location.coordinates,
            image: location.image,
            is_main: location.isMain
          })

        if (error) {
          result.errors++
          result.details.push(`Location "${location.name}": ${error.message}`)
        } else {
          result.success++
        }
      } catch (err) {
        result.errors++
        result.details.push(`Location "${location.name}": ${err}`)
      }
    }
  } catch (err) {
    result.errors++
    result.details.push(`Failed to read locations.json: ${err}`)
  }

  return result
}

async function migrateNews(): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'News', success: 0, errors: 0, details: [] }
  
  try {
    const newsJson = readFileSync(join(process.cwd(), 'src/data/news.json'), 'utf-8')
    const news = JSON.parse(newsJson)

    for (const item of news) {
      try {
        const { error } = await supabaseAdmin!
          .from('news')
          .insert({
            title: item.title,
            summary: item.summary,
            content: item.content,
            image_url: item.imageUrl,
            category: item.category,
            tags: item.tags,
            is_published: item.isPublished,
            publish_date: item.publishDate
          })

        if (error) {
          result.errors++
          result.details.push(`News "${item.title}": ${error.message}`)
        } else {
          result.success++
        }
      } catch (err) {
        result.errors++
        result.details.push(`News "${item.title}": ${err}`)
      }
    }
  } catch (err) {
    result.errors++
    result.details.push(`Failed to read news.json: ${err}`)
  }

  return result
}

async function migrateSchedule(): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Schedule', success: 0, errors: 0, details: [] }
  
  try {
    const scheduleJson = readFileSync(join(process.cwd(), 'src/data/schedule.json'), 'utf-8')
    const schedule = JSON.parse(scheduleJson)

    for (const item of schedule) {
      try {
        const { error } = await supabaseAdmin!
          .from('schedule')
          .insert({
            title: item.title,
            location: item.location,
            date: item.date,
            time: item.time,
            status: item.status,
            products: item.products,
            description: item.description,
            contact: item.contact,
            special_offer: item.specialOffer,
            weather_note: item.weatherNote
          })

        if (error) {
          result.errors++
          result.details.push(`Schedule "${item.title}": ${error.message}`)
        } else {
          result.success++
        }
      } catch (err) {
        result.errors++
        result.details.push(`Schedule "${item.title}": ${err}`)
      }
    }
  } catch (err) {
    result.errors++
    result.details.push(`Failed to read schedule.json: ${err}`)
  }

  return result
}

async function migrateCulture(): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Culture', success: 0, errors: 0, details: [] }
  
  try {
    const cultureJson = readFileSync(join(process.cwd(), 'src/data/culture.json'), 'utf-8')
    const culture = JSON.parse(cultureJson)

    for (const item of culture) {
      try {
        const { error } = await supabaseAdmin!
          .from('culture')
          .insert({
            title: item.title,
            description: item.description,
            content: item.content,
            images: item.images,
            category: item.category,
            year: item.year,
            is_featured: item.isFeatured
          })

        if (error) {
          result.errors++
          result.details.push(`Culture "${item.title}": ${error.message}`)
        } else {
          result.success++
        }
      } catch (err) {
        result.errors++
        result.details.push(`Culture "${item.title}": ${err}`)
      }
    }
  } catch (err) {
    result.errors++
    result.details.push(`Failed to read culture.json: ${err}`)
  }

  return result
}

async function migrateFarmTour(): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Farm Tour', success: 0, errors: 0, details: [] }
  
  try {
    const farmTourJson = readFileSync(join(process.cwd(), 'src/data/farm-tour.json'), 'utf-8')
    const farmTour = JSON.parse(farmTourJson)

    for (const item of farmTour) {
      try {
        const { error } = await supabaseAdmin!
          .from('farm_tour')
          .insert({
            title: item.title,
            season: item.season,
            months: item.months,
            price: item.price,
            duration: item.duration,
            activities: item.activities,
            includes: item.includes,
            highlight: item.highlight,
            note: item.note,
            image: item.image,
            available: item.available
          })

        if (error) {
          result.errors++
          result.details.push(`Farm Tour "${item.title}": ${error.message}`)
        } else {
          result.success++
        }
      } catch (err) {
        result.errors++
        result.details.push(`Farm Tour "${item.title}": ${err}`)
      }
    }
  } catch (err) {
    result.errors++
    result.details.push(`Failed to read farm-tour.json: ${err}`)
  }

  return result
}

// Run migration if called directly
if (require.main === module) {
  migrateData().catch(console.error)
}

export { migrateData }