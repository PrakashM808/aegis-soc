const cron = require('node-cron');

class TaskScheduler {
  constructor() {
    this.tasks = [];
  }

  // Schedule a task
  scheduleTask(name, cronExpression, callback) {
    try {
      const task = cron.schedule(cronExpression, () => {
        console.log(`[SCHEDULED] Executing: ${name}`);
        callback();
      });

      this.tasks.push({ name, cronExpression, task });
      console.log(`✓ Scheduled task: ${name}`);
      return { success: true, message: `Task ${name} scheduled` };
    } catch (error) {
      console.error(`Failed to schedule task ${name}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Stop a task
  stopTask(name) {
    const index = this.tasks.findIndex(t => t.name === name);
    if (index !== -1) {
      this.tasks[index].task.stop();
      this.tasks.splice(index, 1);
      console.log(`✓ Stopped task: ${name}`);
      return { success: true };
    }
    return { success: false, message: 'Task not found' };
  }

  // Get all tasks
  getAllTasks() {
    return this.tasks.map(t => ({ name: t.name, cronExpression: t.cronExpression }));
  }
}

const scheduler = new TaskScheduler();

// Schedule default tasks
scheduler.scheduleTask('Daily Threat Scan', '0 2 * * *', () => {
  console.log('Running daily threat scan...');
});

scheduler.scheduleTask('Hourly Log Analysis', '0 * * * *', () => {
  console.log('Running hourly log analysis...');
});

scheduler.scheduleTask('Weekly Compliance Check', '0 3 * * 0', () => {
  console.log('Running weekly compliance check...');
});

module.exports = scheduler;
