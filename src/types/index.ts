export type ViewMode = "month" | "timeline" | "bars";

export type Status = "ok" | "bad";
export type StatusReason = "ok" | "sprint" | "month" | "total";

export interface Task {
  id: string;
  name: string;
  sprintNr: number;
  hours: number;
}

export interface SprintCap {
  nr: number;
  cap: number;
}

export interface CardInfo {
  plannedToday: boolean;
  restSprint: boolean;
  restMonth: boolean;
  restTotal: boolean;
  sprintAvg: boolean;
}

export interface SprintRange {
  nr: number;
  start: Date;
  end: Date;
}

export interface ParsedDates {
  start: Date;
  end: Date;
  sprintStart: Date;
}

export interface DailyRow {
  date: Date;
  planned: number;
  mk: string;
  sprintNr: number | null;
  capThisSprint: number | null;
  remainingMonth: number;
  remainingSprint: number;
  remainingTotal: number;
}

export interface CalendarCell {
  d: Date;
  planned: number;
  rM: number;
  rS: number;
  rT: number;
  monthCap: number;
  status: Status;
  inProject: boolean;
  inMonth?: boolean;
  sprintNr: number | null;
  capThisSprint: number | null;
  sprintStart: boolean;
  statusReason: StatusReason;
  statusLabel: string;
  sprintDay: number | null;
  sprintTotalDays: number | null;
  avg: number | undefined;
}

export interface TimelineWeek {
  week: CalendarCell[];
  monthLabel: string | null;
}

export interface SelectedDayInfo {
  selectedDate: Date;
  inProject: boolean;
  sprintNr?: number | null;
  remainingMonthBudget?: number;
  remainingProjectBudget?: number;
  remainingMonthEffort?: number;
  additionalMonthBudgetNeeded?: number;
  openTaskEffort?: number;
  neededBudget?: number;
  budgetGap?: number;
}

export interface BurnData {
  totalPlanned: number;
  dateBudgetBreak: Date | null;
  dateMonthBreak: Date | null;
  dateSprintBreak: Date | null;
  dateTotalBreak: Date | null;
}

export interface BarEntry {
  key: string;
  label: string;
  planned: number;
  cap: number;
}

export interface SprintBarEntry {
  nr: number;
  planned: number;
  cap: number;
}

export interface BarData {
  total: { planned: number; cap: number };
  months: BarEntry[];
  sprints: SprintBarEntry[];
}

export interface DayHoursResult {
  dayHours: Map<string, number>;
  sprints: SprintRange[];
}

export interface CalcDailyPlanInput {
  projectStart: Date;
  projectEnd: Date;
  sprintStart: Date;
  sprintWeeks: number;
  tasks: Task[];
}

export interface StatusInput {
  remainingMonth: number;
  remainingTotal: number;
  remainingSprint: number;
}
