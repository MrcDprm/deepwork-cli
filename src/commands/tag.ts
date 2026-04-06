import chalk from 'chalk';
import { initDB } from '../db';
import { Repository } from '../db/repository';

export function runTag(id: string, tagName: string): void {
  try {
    initDB();
    const repo = new Repository();
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      console.error(chalk.red('✖ Geçersiz görev ID\'si.'));
      process.exit(1);
    }

    const task = repo.getTaskById(taskId);
    if (!task) {
      console.error(chalk.red(`✖ #${taskId} numaralı görev bulunamadı.`));
      process.exit(1);
    }

    repo.attachTagToTask(taskId, tagName.trim());
    console.log(
      chalk.green('✔ Etiket eklendi:') +
        chalk.dim(` [#${taskId}] `) +
        chalk.magenta(tagName)
    );
  } catch (err) {
    console.error(chalk.red('✖ Etiket eklenirken hata:'), err);
    process.exit(1);
  }
}
