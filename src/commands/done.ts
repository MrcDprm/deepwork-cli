import chalk from 'chalk';
import { initDB } from '../db';
import { Repository } from '../db/repository';

export function runDone(id: string): void {
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

    if (task.status === 'DONE') {
      console.log(chalk.yellow(`⚠ #${taskId} zaten tamamlanmış.`));
      return;
    }

    repo.markTaskDone(taskId);

    const totalMinutes = repo.getTotalFocusMinutes(taskId);

    console.log('');
    console.log(chalk.green('🎉 Tebrikler! Görev tamamlandı.'));
    console.log(chalk.bold(`   "${task.title}"`));
    console.log('');

    if (totalMinutes > 0) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      let timeStr = '';
      if (hours > 0) timeStr += `${hours} saat `;
      timeStr += `${mins} dakika`;
      console.log(chalk.cyan(`   Toplam odaklanma süresi: ${chalk.bold(timeStr)}`));
    } else {
      console.log(chalk.dim('   (Kayıtlı pomodoro seansı bulunamadı)'));
    }
    console.log('');
  } catch (err) {
    console.error(chalk.red('✖ Görev tamamlanırken hata:'), err);
    process.exit(1);
  }
}
