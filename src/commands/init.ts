import chalk from 'chalk';
import { initDB } from '../db';
import { getDbPath } from '../config';

export function runInit(): void {
  try {
    initDB();
    console.log(chalk.green('✔ Kurulum Başarılı!'));
    console.log(chalk.dim(`  Veritabanı: ${getDbPath()}`));
  } catch (err) {
    console.error(chalk.red('✖ Kurulum sırasında hata oluştu:'), err);
    process.exit(1);
  }
}
