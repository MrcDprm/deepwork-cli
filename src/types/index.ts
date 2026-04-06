export interface Project {
  id: number;
  name: string;
  sync_id: string | null;
  created_at: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  status: TaskStatus;
  energy_level: EnergyLevel | null;
  sync_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface TaskTag {
  task_id: number;
  tag_id: number;
}

export interface WorkSession {
  id: number;
  task_id: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  was_interrupted: number;
  sync_id: string | null;
}

export interface Setting {
  key: string;
  value: string;
}

export interface TaskWithTags extends Task {
  tags: string[];
  project_name: string | null;
}
