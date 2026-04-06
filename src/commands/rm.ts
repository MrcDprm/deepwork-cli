import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { initDB } from '../db';
import { Repository } from '../db/repository';

interface RmOptions {
  force?: boolean;
}

export async function runRm(id: string, options: RmOptions): Promise<void> {
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

    if (!options.force) {
      const confirmed = await confirm({
        message: `"${task.title}" görevini silmek istiyor musun?`,
        default: false,
      });

      if (!confirmed) {
        console.log(chalk.dim('İptal edildi.'));
        return;
      }
    }

    repo.deleteTask(taskId);
    console.log(
      chalk.green(`✔ Görev silindi`) + chalk.dim(` [#${taskId}]`) + ` ${task.title}`
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).name === 'ExitPromptError') {
      console.log(chalk.dim('\nİptal edildi.'));
      return;
    }
    console.error(chalk.red('✖ Görev silinirken hata:'), err);
    process.exit(1);
  }
}
