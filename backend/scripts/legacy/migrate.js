#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs SQL migration files in order and tracks execution history
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { query, testConnection, closePool } = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// Calculate file checksum for integrity checking
function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Get all migration files sorted by filename
async function getMigrationFiles() {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Files should be named with numeric prefixes (001_, 002_, etc.)
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error.message);
    throw error;
  }
}

// Get applied migrations from database
async function getAppliedMigrations() {
  try {
    const result = await query(`
      SELECT filename, checksum, applied_at, success 
      FROM migration_history 
      ORDER BY applied_at
    `);
    return result.rows;
  } catch (error) {
    // If migration_history table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.log('📝 Migration history table not found, will be created');
      return [];
    }
    throw error;
  }
}

// Execute a single migration file
async function executeMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Executing migration: ${filename}`);
    
    // Read migration file
    const content = await fs.readFile(filePath, 'utf8');
    const checksum = calculateChecksum(content);
    
    // Execute migration SQL
    await query(content);
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Migration completed in ${executionTime}ms: ${filename}`);
    
    // Record successful migration
    await query(`
      INSERT INTO migration_history (filename, checksum, execution_time_ms, success)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (filename) DO UPDATE SET
        checksum = EXCLUDED.checksum,
        applied_at = CURRENT_TIMESTAMP,
        execution_time_ms = EXCLUDED.execution_time_ms,
        success = EXCLUDED.success,
        error_message = NULL
    `, [filename, checksum, executionTime, true]);
    
    return { success: true, executionTime };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Migration failed after ${executionTime}ms: ${filename}`);
    console.error('Error:', error.message);
    
    // Record failed migration
    try {
      await query(`
        INSERT INTO migration_history (filename, checksum, execution_time_ms, success, error_message)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (filename) DO UPDATE SET
          applied_at = CURRENT_TIMESTAMP,
          execution_time_ms = EXCLUDED.execution_time_ms,
          success = EXCLUDED.success,
          error_message = EXCLUDED.error_message
      `, [filename, '', executionTime, false, error.message]);
    } catch (recordError) {
      console.error('❌ Failed to record migration failure:', recordError.message);
    }
    
    return { success: false, error: error.message, executionTime };
  }
}

// Verify migration integrity
async function verifyMigrationIntegrity(filename, appliedMigration) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const currentChecksum = calculateChecksum(content);
    
    if (currentChecksum !== appliedMigration.checksum) {
      console.warn(`⚠️  Migration file has been modified: ${filename}`);
      console.warn(`   Applied checksum: ${appliedMigration.checksum}`);
      console.warn(`   Current checksum: ${currentChecksum}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error verifying migration: ${filename}`, error.message);
    return false;
  }
}

// Main migration function
async function runMigrations(options = {}) {
  const { force = false, verify = true } = options;
  
  console.log('🚀 Starting database migrations...');
  console.log('=====================================');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Get migration files and applied migrations
    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    console.log(`📊 ${appliedMigrations.length} migrations previously applied`);
    
    // Create a map of applied migrations for quick lookup
    const appliedMap = new Map();
    appliedMigrations.forEach(migration => {
      appliedMap.set(migration.filename, migration);
    });
    
    let executedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    // Process each migration file
    for (const filename of migrationFiles) {
      const appliedMigration = appliedMap.get(filename);
      
      if (appliedMigration && appliedMigration.success && !force) {
        // Verify integrity if requested
        if (verify) {
          const isValid = await verifyMigrationIntegrity(filename, appliedMigration);
          if (!isValid && !force) {
            console.error(`❌ Migration integrity check failed: ${filename}`);
            failedCount++;
            continue;
          }
        }
        
        console.log(`⏭️  Skipping already applied migration: ${filename}`);
        skippedCount++;
        continue;
      }
      
      if (appliedMigration && !appliedMigration.success && !force) {
        console.log(`⚠️  Skipping previously failed migration: ${filename}`);
        console.log(`   Use --force to retry failed migrations`);
        skippedCount++;
        continue;
      }
      
      // Execute migration
      const result = await executeMigration(filename);
      
      if (result.success) {
        executedCount++;
      } else {
        failedCount++;
        
        // Stop on first failure unless force mode
        if (!force) {
          console.error('❌ Stopping migrations due to failure');
          break;
        }
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('=====================================');
    console.log(`✅ Executed: ${executedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    
    if (failedCount === 0) {
      console.log('\n🎉 All migrations completed successfully!');
      return true;
    } else {
      console.log('\n⚠️  Some migrations failed. Check the logs above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    return false;
  }
}

// Show migration status
async function showMigrationStatus() {
  console.log('📊 Migration Status');
  console.log('==================');
  
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();
    
    const appliedMap = new Map();
    appliedMigrations.forEach(migration => {
      appliedMap.set(migration.filename, migration);
    });
    
    console.log(`\nTotal migration files: ${migrationFiles.length}`);
    console.log(`Applied migrations: ${appliedMigrations.length}\n`);
    
    migrationFiles.forEach(filename => {
      const applied = appliedMap.get(filename);
      
      if (applied) {
        const status = applied.success ? '✅' : '❌';
        const date = new Date(applied.applied_at).toLocaleString();
        console.log(`${status} ${filename} (${date})`);
        
        if (!applied.success && applied.error_message) {
          console.log(`   Error: ${applied.error_message}`);
        }
      } else {
        console.log(`⏳ ${filename} (pending)`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  const options = {
    force: args.includes('--force'),
    verify: !args.includes('--no-verify')
  };
  
  try {
    switch (command) {
      case 'run':
        const success = await runMigrations(options);
        process.exit(success ? 0 : 1);
        break;
        
      case 'status':
        await showMigrationStatus();
        break;
        
      case 'help':
        console.log(`
Database Migration Tool

Usage:
  npm run migrate [command] [options]

Commands:
  run      Run pending migrations (default)
  status   Show migration status
  help     Show this help message

Options:
  --force      Force re-run failed migrations
  --no-verify  Skip integrity verification

Examples:
  npm run migrate
  npm run migrate status
  npm run migrate run --force
        `);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Use "npm run migrate help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration tool error:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  showMigrationStatus,
  getMigrationFiles,
  getAppliedMigrations
};