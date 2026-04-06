import Database from 'better-sqlite3';
import { getDb } from './index';
import type {
  Project,
  Task,
  TaskStatus,
  EnergyLevel,
  Tag,
  WorkSession,
  Setting,
  TaskWithTags,
} from '../types';

export class Repository {
  private db: Database.Database;

  constructor() {
    this.db = getDb();
  }

  // ─── Projects ────────────────────────────────────────────────────────────

  findOrCreateProject(name: string): Project {
    const existing = this.db
      .prepare<[string], Project>('SELECT * FROM projects WHERE name = ?')
      .get(name);
    if (existing) return existing;

    const result = this.db
      .prepare('INSERT INTO projects (name) VALUES (?)')
      .run(name);
    return this.db
      .prepare<[number], Project>('SELECT * FROM projects WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  }

  getProjectByName(name: string): Project | undefined {
    return this.db
      .prepare<[string], Project>('SELECT * FROM projects WHERE name = ?')
      .get(name);
  }

  // ─── Tasks ───────────────────────────────────────────────────────────────

  createTask(params: {
    title: string;
    project_id?: number | null;
    energy_level?: EnergyLevel | null;
  }): Task {
    const result = this.db
      .prepare(
        `INSERT INTO tasks (title, project_id, energy_level)
         VALUES (@title, @project_id, @energy_level)`
      )
      .run({
        title: params.title,
        project_id: params.project_id ?? null,
        energy_level: params.energy_level ?? null,
      });
    return this.getTaskById(result.lastInsertRowid as number)!;
  }

  getTaskById(id: number): Task | undefined {
    return this.db
      .prepare<[number], Task>('SELECT * FROM tasks WHERE id = ?')
      .get(id);
  }

  deleteTask(id: number): void {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  updateTask(
    id: number,
    fields: Partial<Pick<Task, 'title' | 'status' | 'energy_level' | 'completed_at'>>
  ): void {
    const sets: string[] = [];
    const values: Record<string, unknown> = { id };

    if (fields.title !== undefined) {
      sets.push('title = @title');
      values.title = fields.title;
    }
    if (fields.status !== undefined) {
      sets.push('status = @status');
      values.status = fields.status;
    }
    if (fields.energy_level !== undefined) {
      sets.push('energy_level = @energy_level');
      values.energy_level = fields.energy_level;
    }
    if (fields.completed_at !== undefined) {
      sets.push('completed_at = @completed_at');
      values.completed_at = fields.completed_at;
    }

    sets.push("updated_at = datetime('now')");

    if (sets.length === 0) return;

    this.db
      .prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = @id`)
      .run(values);
  }

  markTaskDone(id: number): void {
    this.updateTask(id, {
      status: 'DONE',
      completed_at: new Date().toISOString(),
    });
  }

  listActiveTasks(tagFilters: string[] = []): TaskWithTags[] {
    if (tagFilters.length === 0) {
      const tasks = this.db
        .prepare<[], Task>(
          `SELECT t.*, p.name as project_name
           FROM tasks t
           LEFT JOIN projects p ON t.project_id = p.id
           WHERE t.status IN ('TODO','IN_PROGRESS')
           ORDER BY t.created_at ASC`
        )
        .all() as (Task & { project_name: string | null })[];

      return tasks.map((t) => ({
        ...t,
        tags: this.getTagsForTask(t.id),
      }));
    }

    const placeholders = tagFilters.map(() => '?').join(', ');
    const tasks = this.db
      .prepare<unknown[], Task>(
        `SELECT t.*, p.name as project_name
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.status IN ('TODO','IN_PROGRESS')
           AND t.id IN (
             SELECT tt.task_id
             FROM task_tags tt
             JOIN tags tg ON tt.tag_id = tg.id
             WHERE tg.name IN (${placeholders})
             GROUP BY tt.task_id
             HAVING COUNT(DISTINCT tg.name) = ?
           )
         ORDER BY t.created_at ASC`
      )
      .all([...tagFilters, tagFilters.length]) as (Task & { project_name: string | null })[];

    return tasks.map((t) => ({
      ...t,
      tags: this.getTagsForTask(t.id),
    }));
  }

  // ─── Tags ────────────────────────────────────────────────────────────────

  findOrCreateTag(name: string): Tag {
    const existing = this.db
      .prepare<[string], Tag>('SELECT * FROM tags WHERE name = ?')
      .get(name);
    if (existing) return existing;

    const result = this.db
      .prepare('INSERT INTO tags (name) VALUES (?)')
      .run(name);
    return this.db
      .prepare<[number], Tag>('SELECT * FROM tags WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  }

  attachTagToTask(taskId: number, tagName: string): void {
    const tag = this.findOrCreateTag(tagName);
    this.db
      .prepare(
        'INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)'
      )
      .run(taskId, tag.id);
  }

  getTagsForTask(taskId: number): string[] {
    const rows = this.db
      .prepare<[number], { name: string }>(
        `SELECT tg.name FROM tags tg
         JOIN task_tags tt ON tg.id = tt.tag_id
         WHERE tt.task_id = ?`
      )
      .all(taskId);
    return rows.map((r) => r.name);
  }

  // ─── Work Sessions ────────────────────────────────────────────────────────

  startSession(taskId: number): WorkSession {
    const result = this.db
      .prepare('INSERT INTO work_sessions (task_id) VALUES (?)')
      .run(taskId);
    return this.db
      .prepare<[number], WorkSession>(
        'SELECT * FROM work_sessions WHERE id = ?'
      )
      .get(result.lastInsertRowid as number)!;
  }

  endSession(
    sessionId: number,
    durationMinutes: number,
    wasInterrupted: boolean
  ): void {
    this.db
      .prepare(
        `UPDATE work_sessions
         SET ended_at = datetime('now'),
             duration_minutes = ?,
             was_interrupted = ?
         WHERE id = ?`
      )
      .run(durationMinutes, wasInterrupted ? 1 : 0, sessionId);
  }

  getTotalFocusMinutes(taskId: number): number {
    const row = this.db
      .prepare<[number], { total: number | null }>(
        `SELECT SUM(duration_minutes) as total
         FROM work_sessions
         WHERE task_id = ? AND was_interrupted = 0`
      )
      .get(taskId);
    return row?.total ?? 0;
  }

  getTodaySessions(): WorkSession[] {
    return this.db
      .prepare<[], WorkSession>(
        `SELECT * FROM work_sessions
         WHERE date(started_at) = date('now')`
      )
      .all();
  }

  getSessionsByDateRange(from: string, to: string): WorkSession[] {
    return this.db
      .prepare<[string, string], WorkSession>(
        `SELECT * FROM work_sessions
         WHERE date(started_at) BETWEEN ? AND ?`
      )
      .all(from, to);
  }

  getDailyFocusMinutes(from: string, to: string): { date: string; minutes: number }[] {
    return this.db
      .prepare<[string, string], { date: string; minutes: number }>(
        `SELECT date(started_at) as date,
                SUM(duration_minutes) as minutes
         FROM work_sessions
         WHERE date(started_at) BETWEEN ? AND ?
           AND was_interrupted = 0
         GROUP BY date(started_at)`
      )
      .all(from, to);
  }

  getTodayCompletedTasks(): Task[] {
    return this.db
      .prepare<[], Task>(
        `SELECT * FROM tasks
         WHERE status = 'DONE'
           AND date(completed_at) = date('now')`
      )
      .all();
  }

  getTodayInterruptedSessions(): number {
    const row = this.db
      .prepare<[], { count: number }>(
        `SELECT COUNT(*) as count
         FROM work_sessions
         WHERE date(started_at) = date('now')
           AND was_interrupted = 1`
      )
      .get();
    return row?.count ?? 0;
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  getSetting(key: string): string | null {
    const row = this.db
      .prepare<[string], Setting>('SELECT * FROM settings WHERE key = ?')
      .get(key);
    return row?.value ?? null;
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, value);
  }
}
