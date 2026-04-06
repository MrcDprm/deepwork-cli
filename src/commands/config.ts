import chalk from 'chalk';
import { initDB } from '../db';
import { Repository } from '../db/repository';

const VALID_KEYS: Record<string, string> = {
  pomodoro_duration: 'Pomodoro süresi (dakika)',
};

export function runConfigSet(key: string, value: string): void {
  try {
    initDB();

    if (!VALID_KEYS[key]) {
      console.error(chalk.red(`✖ Geçersiz ayar anahtarı: "${key}"`));
      console.log(chalk.dim('  Kullanılabilir anahtarlar:'));
      for (const [k, desc] of Object.entries(VALID_KEYS)) {
        console.log(chalk.dim(`    ${k}  — ${desc}`));
      }
      process.exit(1);
    }

    if (key === 'pomodoro_duration') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1 || num > 120) {
        console.error(
          chalk.red('✖ Pomodoro süresi 1-120 dakika arasında olmalıdır.')
        );
        process.exit(1);
      }
    }

    const repo = new Repository();
    const oldValue = repo.getSetting(key);
    repo.setSetting(key, value);

    console.log(
      chalk.green('✔ Ayar güncellendi:') +
        chalk.dim(` ${key}`) +
        chalk.dim(` ${oldValue} → `) +
        chalk.bold(value)
    );
  } catch (err) {
    console.error(chalk.red('✖ Ayar güncellenirken hata:'), err);
    process.exit(1);
  }
}

export function runConfigGet(key: string): void {
  try {
    initDB();
    const repo = new Repository();
    const value = repo.getSetting(key);
    if (value === null) {
      console.error(chalk.red(`✖ "${key}" anahtarı bulunamadı.`));
      process.exit(1);
    }
    console.log(`${chalk.dim(key + ':')} ${chalk.bold(value)}`);
  } catch (err) {
    console.error(chalk.red('✖ Ayar okunurken hata:'), err);
    process.exit(1);
  }
}
