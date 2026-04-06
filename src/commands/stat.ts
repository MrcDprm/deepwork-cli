import chalk from 'chalk';
import { initDB } from '../db';
import { Repository } from '../db/repository';

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0 dakika';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} saat ${m} dakika`;
  if (h > 0) return `${h} saat`;
  return `${m} dakika`;
}

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildContributionGraph(
  dailyData: { date: string; minutes: number }[]
): string {
  const today = new Date();
  const days = 30;

  const dateMap = new Map<string, number>();
  for (const row of dailyData) {
    dateMap.set(row.date, row.minutes);
  }

  const allDates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    allDates.push(getDateStr(i));
  }

  const maxMinutes = Math.max(...Array.from(dateMap.values()), 1);

  const blocks: string[] = allDates.map((date) => {
    const mins = dateMap.get(date) ?? 0;
    const ratio = mins / maxMinutes;

    let block: string;
    if (mins === 0) {
      block = chalk.dim('■');
    } else if (ratio < 0.25) {
      block = chalk.hex('#0e4429')('■');
    } else if (ratio < 0.5) {
      block = chalk.hex('#006d32')('■');
    } else if (ratio < 0.75) {
      block = chalk.hex('#26a641')('■');
    } else {
      block = chalk.hex('#39d353')('■');
    }

    return block;
  });

  const COLS = 10;
  const rows: string[] = [];
  for (let i = 0; i < blocks.length; i += COLS) {
    rows.push('  ' + blocks.slice(i, i + COLS).join(' '));
  }

  const legendLine =
    '  ' +
    chalk.dim('Az ') +
    chalk.dim('■ ') +
    chalk.hex('#0e4429')('■ ') +
    chalk.hex('#006d32')('■ ') +
    chalk.hex('#26a641')('■ ') +
    chalk.hex('#39d353')('■') +
    chalk.dim(' Çok');

  rows.push('');
  rows.push(legendLine);

  const fromDate = allDates[0];
  const toDate = allDates[allDates.length - 1];
  rows.push(chalk.dim(`  ${fromDate} → ${toDate}`));

  return rows.join('\n');
}

export function runStat(): void {
  try {
    initDB();
    const repo = new Repository();

    const todaySessions = repo.getTodaySessions();
    const totalTodayMinutes = todaySessions
      .filter((s) => !s.was_interrupted && s.duration_minutes != null)
      .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

    const completedToday = repo.getTodayCompletedTasks();
    const interruptedCount = repo.getTodayInterruptedSessions();
    const sessionCount = todaySessions.filter((s) => !s.was_interrupted).length;

    const toDate = getDateStr(0);
    const fromDate = getDateStr(29);
    const dailyData = repo.getDailyFocusMinutes(fromDate, toDate);

    console.log('');
    console.log(chalk.bold.cyan('  ═══ DeepWork İstatistikleri ═══'));
    console.log('');

    console.log(chalk.bold('  📅 Bugünün Özeti'));
    console.log(chalk.dim('  ─────────────────────────────'));
    console.log(
      `  ${chalk.cyan('⏱')}  Toplam odaklanma  : ${chalk.bold(formatMinutes(totalTodayMinutes))}`
    );
    console.log(
      `  ${chalk.green('✔')}  Biten görev       : ${chalk.bold(String(completedToday.length))}`
    );
    console.log(
      `  ${chalk.yellow('🍅')} Tamamlanan seans  : ${chalk.bold(String(sessionCount))}`
    );
    console.log(
      `  ${chalk.red('⚡')} Kesilen seans     : ${chalk.bold(String(interruptedCount))}`
    );
    console.log('');

    console.log(chalk.bold('  📊 Son 30 Günlük Odaklanma Haritası'));
    console.log(chalk.dim('  ─────────────────────────────'));
    console.log('');
    console.log(buildContributionGraph(dailyData));
    console.log('');
  } catch (err) {
    console.error(chalk.red('✖ İstatistikler alınırken hata:'), err);
    process.exit(1);
  }
}
