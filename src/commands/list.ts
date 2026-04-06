import chalk from 'chalk';
import Table from 'cli-table3';
import { initDB } from '../db';
import { Repository } from '../db/repository';
import type { TaskWithTags } from '../types';

interface ListOptions {
  tag?: string[];
  project?: string;
}

const STATUS_COLOR: Record<string, (s: string) => string> = {
  TODO: (s) => chalk.white(s),
  IN_PROGRESS: (s) => chalk.yellow(s),
  DONE: (s) => chalk.green(s),
};

const ENERGY_COLOR: Record<string, (s: string) => string> = {
  low: (s) => chalk.blue(s),
  medium: (s) => chalk.yellow(s),
  high: (s) => chalk.red(s),
};

function colorStatus(status: string): string {
  return (STATUS_COLOR[status] ?? chalk.white)(status);
}

function colorEnergy(energy: string | null): string {
  if (!energy) return chalk.dim('-');
  return (ENERGY_COLOR[energy] ?? chalk.white)(energy);
}

export function runList(options: ListOptions): void {
  try {
    initDB();
    const repo = new Repository();

    const tags = options.tag ?? [];
    const tasks: TaskWithTags[] = repo.listActiveTasks(tags);

    if (tasks.length === 0) {
      if (tags.length > 0) {
        console.log(
          chalk.dim(`Etiket(ler) [${tags.join(', ')}] ile eşleşen aktif görev yok.`)
        );
      } else {
        console.log(chalk.dim('Aktif görev bulunamadı. Eklemek için: dw add <başlık>'));
      }
      return;
    }

    const table = new Table({
      head: [
        chalk.bold('#'),
        chalk.bold('Başlık'),
        chalk.bold('Durum'),
        chalk.bold('Enerji'),
        chalk.bold('Proje'),
        chalk.bold('Etiketler'),
      ],
      style: { head: [], border: ['dim'] },
      colWidths: [6, 40, 14, 10, 18, 22],
      wordWrap: true,
    });

    for (const task of tasks) {
      table.push([
        chalk.dim(String(task.id)),
        task.title,
        colorStatus(task.status),
        colorEnergy(task.energy_level),
        task.project_name ? chalk.cyan(task.project_name) : chalk.dim('-'),
        task.tags.length > 0
          ? task.tags.map((t) => chalk.magenta(t)).join(', ')
          : chalk.dim('-'),
      ]);
    }

    console.log('');
    if (tags.length > 0) {
      console.log(
        chalk.dim(`  Filtre: [${tags.map((t) => chalk.magenta(t)).join(' AND ')}]`)
      );
    }
    console.log(table.toString());
    console.log(chalk.dim(`  ${tasks.length} görev listelendi.\n`));
  } catch (err) {
    console.error(chalk.red('✖ Görevler listelenirken hata:'), err);
    process.exit(1);
  }
}
