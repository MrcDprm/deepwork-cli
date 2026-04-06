#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')) as { version: string };
import { runInit } from '../commands/init';
import { runAdd } from '../commands/add';
import { runRm } from '../commands/rm';
import { runDone } from '../commands/done';
import { runStart } from '../commands/start';
import { runList } from '../commands/list';
import { runEdit } from '../commands/edit';
import { runTag } from '../commands/tag';
import { runConfigSet, runConfigGet } from '../commands/config';
import { runStat } from '../commands/stat';

const program = new Command();

program
  .name('dw')
  .description('DeepWork CLI - Terminal tabanlı görev ve Pomodoro yöneticisi')
  .version(pkg.version);

program
  .command('init')
  .description('Veritabanını kur ve uygulamayı başlat')
  .action(() => runInit());

program
  .command('add <title>')
  .description('Yeni görev ekle')
  .option('-e, --energy <level>', 'Enerji seviyesi: low | medium | high')
  .option('-p, --project <name>', 'Proje adı')
  .option('-t, --tag <tag>', 'Etiket (birden fazla için tekrar kullan)', (val, prev: string[]) => [...prev, val], [] as string[])
  .action((title: string, options) => runAdd(title, options));

program
  .command('rm <id>')
  .description('Görevi sil')
  .option('-f, --force', 'Onay sormadan sil')
  .action((id: string, options) => runRm(id, options));

program
  .command('done <id>')
  .description('Görevi tamamlandı olarak işaretle')
  .action((id: string) => runDone(id));

program
  .command('start <id>')
  .description('Pomodoro zamanlayıcısını başlat')
  .action((id: string) => runStart(id));

program
  .command('list')
  .description('Aktif görevleri listele')
  .option('-t, --tag <tag>', 'Etiket filtresi (AND mantığıyla)', (val, prev: string[]) => [...prev, val], [] as string[])
  .action((options) => runList(options));

program
  .command('edit <id>')
  .description('Görevi interaktif olarak düzenle')
  .action((id: string) => runEdit(id));

program
  .command('tag <id> <tag_name>')
  .description('Göreve etiket ekle')
  .action((id: string, tagName: string) => runTag(id, tagName));

const configCmd = program
  .command('config')
  .description('Uygulama ayarlarını yönet');

configCmd
  .command('set <key> <value>')
  .description('Ayar değeri belirle')
  .action((key: string, value: string) => runConfigSet(key, value));

configCmd
  .command('get <key>')
  .description('Ayar değerini oku')
  .action((key: string) => runConfigGet(key));

program
  .command('stat')
  .description('Günlük özet ve 30 günlük odaklanma haritası')
  .action(() => runStat());

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
