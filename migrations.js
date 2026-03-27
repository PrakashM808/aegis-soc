/**
 * Database Migrations
 * Sequelize-based schema versioning
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Initialize Sequelize
const sequelize = require('../config/database');

/**
 * Migration Runner
 */
class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.sequelize = sequelize;
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    console.log('🔄 Running migrations...\n');

    try {
      // Ensure migrations table exists
      await this.sequelize.authenticate();
      console.log('✓ Database connected\n');

      // Create SequelizeMeta table if doesn't exist
      const metadata = this.sequelize.define('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
      }, {
        timestamps: false,
        tableName: 'SequelizeMeta',
      });

      await metadata.sync();

      // Get executed migrations
      const executed = await metadata.findAll();
      const executedNames = executed.map(m => m.name);

      // Get available migrations
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(f => f.endsWith('.js'))
        .sort();

      let executed_count = 0;

      // Run each migration
      for (const file of migrationFiles) {
        if (executedNames.includes(file)) {
          console.log(`⊘ Skipped: ${file} (already executed)`);
          continue;
        }

        try {
          const migration = require(path.join(this.migrationsDir, file));
          console.log(`⏳ Running: ${file}`);

          await migration.up(this.sequelize.getQueryInterface(), Sequelize);

          await metadata.create({ name: file });
          console.log(`✓ Completed: ${file}\n`);
          executed_count++;
        } catch (error) {
          console.error(`✗ Failed: ${file}`);
          console.error(error.message);
          throw error;
        }
      }

      if (executed_count === 0) {
        console.log('✓ All migrations already executed');
      } else {
        console.log(`\n✓ ${executed_count} migrations executed successfully`);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackMigration() {
    console.log('🔄 Rolling back last migration...\n');

    try {
      await this.sequelize.authenticate();

      const metadata = this.sequelize.define('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
      }, {
        timestamps: false,
        tableName: 'SequelizeMeta',
      });

      await metadata.sync();

      // Get last migration
      const lastMigration = await metadata.findOne({
        order: [['name', 'DESC']],
      });

      if (!lastMigration) {
        console.log('✓ No migrations to rollback');
        return;
      }

      const file = lastMigration.name;
      const migration = require(path.join(this.migrationsDir, file));

      console.log(`⏳ Rolling back: ${file}`);
      await migration.down(this.sequelize.getQueryInterface(), Sequelize);
      await metadata.destroy({ where: { name: file } });
      console.log(`✓ Rolled back: ${file}`);
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    }
  }

  /**
   * Reset database (drop all tables)
   */
  async resetDatabase() {
    console.log('⚠️  WARNING: This will delete all data!\n');
    console.log('Continue? (yes/no)');
    
    // For automated testing, add --force flag
    if (!process.argv.includes('--force')) {
      return;
    }

    try {
      await this.sequelize.drop();
      console.log('✓ Database reset');
    } catch (error) {
      console.error('❌ Reset failed:', error);
      process.exit(1);
    }
  }
}

// Export for CLI
module.exports = MigrationRunner;

// Run CLI
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  switch (command) {
    case 'up':
      runner.runMigrations();
      break;
    case 'down':
      runner.rollbackMigration();
      break;
    case 'reset':
      runner.resetDatabase();
      break;
    default:
      console.log('Usage: node migrations.js [up|down|reset]');
  }
}
