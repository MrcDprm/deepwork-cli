import chalk from 'chalk';
import { input, select } from '@inquirer/prompts';
import { initDB } from '../db';
import { Repository } from '../db/repository';
import type { TaskStatus, EnergyLevel } from '../types';

export async function runEdit(id: string): Promise<void> {
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

    console.log('');
    console.log(
      chalk.cyan(`✎ Görev Düzenleniyor`) + chalk.dim(` [#${taskId}]`)
    );
    console.log(chalk.dim('  (Değiştirmek istemediğin alanlarda Enter\'a bas)\n'));

    const newTitle = await input({
      message: 'Başlık:',
      default: task.title,
    });

    const newEnergy = await select<EnergyLevel | 'none'>({
      message: 'Enerji Seviyesi:',
      choices: [
        { name: chalk.dim('Değiştirilmesin'), value: 'none' },
        { name: chalk.blue('Düşük'), value: 'low' },
        { name: chalk.yellow('Orta'), value: 'medium' },
        { name: chalk.red('Yüksek'), value: 'high' },
      ],
      default: task.energy_level ?? 'none',
    });

    const newStatus = await select<TaskStatus>({
      message: 'Durum:',
      choices: [
        { name: chalk.white('TODO'), value: 'TODO' },
        { name: chalk.yellow('IN_PROGRESS'), value: 'IN_PROGRESS' },
        { name: chalk.green('DONE'), value: 'DONE' },
      ],
      default: task.status,
    });

    const updates: Parameters<typeof repo.updateTask>[1] = {};

    if (newTitle !== task.title) updates.title = newTitle;
    if (newEnergy !== 'none' && newEnergy !== task.energy_level) {
      updates.energy_level = newEnergy;
    }
    if (newStatus !== task.status) {
      updates.status = newStatus;
      if (newStatus === 'DONE') {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      console.log(chalk.dim('\nDeğişiklik yapılmadı.'));
      return;
    }

    repo.updateTask(taskId, updates);
    console.log(chalk.green(`\n✔ Görev güncellendi [#${taskId}]`));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).name === 'ExitPromptError') {
      console.log(chalk.dim('\nİptal edildi.'));
      return;
    }
    console.error(chalk.red('✖ Görev düzenlenirken hata:'), err);
    process.exit(1);
  }
}
