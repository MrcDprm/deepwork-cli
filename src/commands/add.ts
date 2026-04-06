import chalk from 'chalk';
import { initDB } from '../db';
import { Repository } from '../db/repository';
import type { EnergyLevel } from '../types';

interface AddOptions {
  energy?: string;
  project?: string;
  tag?: string[];
}

export function runAdd(title: string, options: AddOptions): void {
  try {
    initDB();
    const repo = new Repository();

    let projectId: number | null = null;
    if (options.project) {
      const project = repo.findOrCreateProject(options.project);
      projectId = project.id;
    }

    const energy = options.energy as EnergyLevel | undefined;
    const task = repo.createTask({
      title,
      project_id: projectId,
      energy_level: energy ?? null,
    });

    if (options.tag && options.tag.length > 0) {
      for (const tagName of options.tag) {
        repo.attachTagToTask(task.id, tagName.trim());
      }
    }

    console.log(
      chalk.green(`✔ Görev eklendi`) +
        chalk.dim(` [#${task.id}]`) +
        ` ${chalk.bold(title)}`
    );

    if (options.project) {
      console.log(chalk.dim(`  Proje: ${options.project}`));
    }
    if (options.energy) {
      console.log(chalk.dim(`  Enerji: ${options.energy}`));
    }
    if (options.tag && options.tag.length > 0) {
      console.log(chalk.dim(`  Etiketler: ${options.tag.join(', ')}`));
    }
  } catch (err) {
    console.error(chalk.red('✖ Görev eklenirken hata:'), err);
    process.exit(1);
  }
}
