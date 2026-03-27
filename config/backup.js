const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
require('dotenv').config();

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Create backup
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);

    return new Promise((resolve, reject) => {
      const cmd = `PGPASSWORD="${process.env.DB_PASSWORD}" pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ${process.env.DB_NAME} > "${backupFile}"`;

      exec(cmd, (error) => {
        if (error) {
          console.error('Backup failed:', error);
          reject(error);
        } else {
          console.log(`✓ Backup created: ${backupFile}`);
          resolve({ success: true, file: backupFile, timestamp });
        }
      });
    });
  }

  // Restore backup
  restoreBackup(backupFile) {
    return new Promise((resolve, reject) => {
      const cmd = `PGPASSWORD="${process.env.DB_PASSWORD}" psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ${process.env.DB_NAME} < "${backupFile}"`;

      exec(cmd, (error) => {
        if (error) {
          console.error('Restore failed:', error);
          reject(error);
        } else {
          console.log(`✓ Backup restored from: ${backupFile}`);
          resolve({ success: true, message: 'Backup restored' });
        }
      });
    });
  }

  // List backups
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .map(f => ({
          filename: f,
          path: path.join(this.backupDir, f),
          size: fs.statSync(path.join(this.backupDir, f)).size,
          created: fs.statSync(path.join(this.backupDir, f)).birthtime
        }));
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  // Delete old backups (keep last 7)
  cleanupOldBackups() {
    const backups = this.listBackups().sort((a, b) => b.created - a.created);
    const toDelete = backups.slice(7);

    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path);
      console.log(`✓ Deleted old backup: ${backup.filename}`);
    });
  }
}

const backupManager = new BackupManager();

// Schedule daily backups
if (process.env.BACKUP_ENABLED === 'true') {
  cron.schedule('0 2 * * *', async () => {
    try {
      await backupManager.createBackup();
      backupManager.cleanupOldBackups();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });
  console.log('✓ Backup scheduler initialized');
}

module.exports = backupManager;
