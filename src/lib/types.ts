export type TaskStatus = 'TODO' | 'DONE';

export type ObjectiveStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';

export type RecurrenceType = 'INTERVAL' | 'FIXED_DAYS';
export type IntervalSubtype = 'FIXED' | 'AFTER_DONE';
export type FixedDaysSubtype = 'WEEKDAYS' | 'MONTHDAYS' | 'YEARDAYS';

export interface DurationLike {
	years?: number;
	months?: number;
	weeks?: number;
	days?: number;
}

export interface IntervalFixedRecurrence {
	type: 'INTERVAL';
	subtype: 'FIXED';
	interval: DurationLike;
	startDate: string;
}

export interface IntervalAfterDoneRecurrence {
	type: 'INTERVAL';
	subtype: 'AFTER_DONE';
	interval: DurationLike;
	startDate: string;
}

export interface WeekdaysRecurrence {
	type: 'FIXED_DAYS';
	subtype: 'WEEKDAYS';
	daysOfWeek: number[];
	startDate: string;
}

export interface MonthdaysRecurrence {
	type: 'FIXED_DAYS';
	subtype: 'MONTHDAYS';
	daysOfMonth: number[];
	startDate: string;
}

export interface YeardaysRecurrence {
	type: 'FIXED_DAYS';
	subtype: 'YEARDAYS';
	dates: { month: number; day: number }[];
	startDate: string;
}

export type Recurrence =
	| IntervalFixedRecurrence
	| IntervalAfterDoneRecurrence
	| WeekdaysRecurrence
	| MonthdaysRecurrence
	| YeardaysRecurrence;

export interface InboxItemDoc {
	_id: string;
	_rev?: string;
	type: 'InboxItem';
	title: string;
	isProcessed: boolean;
	createdAt: string;
}

export interface TaskDoc {
	_id: string;
	_rev?: string;
	type: 'Task';
	title: string;
	doAt: string;
	status: TaskStatus;
	objectiveId?: string;
	originInboxItemId?: string;
	careId?: string;
	taskPlanId?: string;
	completedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ObjectiveDoc {
	_id: string;
	_rev?: string;
	type: 'Objective';
	title: string;
	status: ObjectiveStatus;
	originInboxItemId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TaskPlan {
	_id: string;
	title: string;
	recurrence: Recurrence;
	lastDoAtDate?: string;
	lastDoneDate?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CareDoc {
	_id: string;
	_rev?: string;
	type: 'Care';
	title: string;
	taskPlans: TaskPlan[];
	originInboxItemId?: string;
	createdAt: string;
	updatedAt: string;
}

export type FazDoc = InboxItemDoc | TaskDoc | ObjectiveDoc | CareDoc;
