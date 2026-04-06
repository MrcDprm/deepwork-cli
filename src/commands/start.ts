import chalk from 'chalk';
import notifier from 'node-notifier';
import { initDB } from '../db';
import { Repository } from '../db/repository';
import type { WorkSession } from '../types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

export async function runStart(id: string): Promise<void> {
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
      console.error(chalk.yellow(`⚠ #${taskId} zaten tamamlanmış.`));
      process.exit(1);
    }

    const durationSetting = repo.getSetting('pomodoro_duration');
    const durationMinutes = parseInt(durationSetting ?? '25', 10);
    const totalSeconds = durationMinutes * 60;

    repo.updateTask(taskId, { status: 'IN_PROGRESS' });

    const session: WorkSession = repo.startSession(taskId);
    const startTime = Date.now();

    console.log('');
    console.log(
      chalk.cyan('🍅 Pomodoro başlatıldı!') +
        chalk.dim(` [#${taskId}] ${task.title}`)
    );
    console.log(
      chalk.dim(`   Süre: ${durationMinutes} dakika  |  Ctrl+C ile durdurabilirsin`)
    );
    console.log('');

    let interrupted = false;

    const cleanup = (wasInterrupted: boolean) => {
      const elapsedMs = Date.now() - startTime;
      const elapsedMinutes = Math.round(elapsedMs / 60000);
      repo.endSession(session.id, elapsedMinutes, wasInterrupted);

      clearLine();

      if (wasInterrupted) {
        console.log(chalk.yellow('\n⚠ Pomodoro kesildi!'));
        console.log(
          chalk.dim(
            `  Geçen süre: ${elapsedMinutes} dakika (kesinti olarak kaydedildi)`
          )
        );
      } else {
        repo.updateTask(taskId, { status: 'IN_PROGRESS' });
        console.log(chalk.green('\n✔ Pomodoro tamamlandı! 🎉'));
        console.log(chalk.dim(`  Odaklanma süresi: ${durationMinutes} dakika`));

        notifier.notify({
          title: 'DeepWork - Pomodoro Bitti!',
          message: `"${task.title}" için ${durationMinutes} dakikalık seans tamamlandı. Mola ver!`,
          sound: true,
          wait: false,
        });
      }
      console.log('');
    };

    process.on('SIGINT', () => {
      interrupted = true;
      cleanup(true);
      process.exit(0);
    });

    await new Promise<void>((resolve) => {
      let remaining = totalSeconds;

      const tick = setInterval(() => {
        if (interrupted) {
          clearInterval(tick);
          resolve();
          return;
        }

        clearLine();
        process.stdout.write(
          chalk.cyan('   ⏱ ') +
            chalk.bold(formatTime(remaining)) +
            chalk.dim(' kaldı')
        );

        remaining--;

        if (remaining < 0) {
          clearInterval(tick);
          cleanup(false);
          resolve();
        }
      }, 1000);
    });
  } catch (err) {
    console.error(chalk.red('✖ Pomodoro başlatılırken hata:'), err);
    process.exit(1);
  }
}
