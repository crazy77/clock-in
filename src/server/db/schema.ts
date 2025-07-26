import { relations, sql } from "drizzle-orm";
import {
	decimal,
	index,
	pgEnum,
	pgTableCreator,
	primaryKey,
	time,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `clock-in_${name}`);

export const posts = createTable(
	"post",
	(d) => ({
		id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
		name: d.varchar({ length: 256 }),
		createdById: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("created_by_idx").on(t.createdById),
		index("name_idx").on(t.name),
	],
);

// Enum 정의
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
	"normal",
	"late",
	"early_leave",
	"absent",
]);
export const languageEnum = pgEnum("language", ["ko", "en"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);
export const holidayTypeEnum = pgEnum("holiday_type", [
	"weekly",
	"specific_date",
]);

export const users = createTable("user", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.varchar({ length: 255 }),
	email: d.varchar({ length: 255 }),
	emailVerified: d
		.timestamp({
			mode: "date",
			withTimezone: true,
		})
		.default(sql`CURRENT_TIMESTAMP`),
	image: d.varchar({ length: 255 }),
	role: userRoleEnum("user").default("user").notNull(),
	isAdmin: d.boolean().default(false).notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	attendanceRecords: many(attendanceRecords),
	userSettings: many(userSettings),
}));

export const accounts = createTable(
	"account",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
		provider: d.varchar({ length: 255 }).notNull(),
		providerAccountId: d.varchar({ length: 255 }).notNull(),
		refresh_token: d.text(),
		access_token: d.text(),
		expires_at: d.integer(),
		token_type: d.varchar({ length: 255 }),
		scope: d.varchar({ length: 255 }),
		id_token: d.text(),
		session_state: d.varchar({ length: 255 }),
	}),
	(t) => [
		primaryKey({ columns: [t.provider, t.providerAccountId] }),
		index("account_user_id_idx").on(t.userId),
	],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
	"session",
	(d) => ({
		sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// 출퇴근 앱 관련 테이블들
export const workplaces = createTable("workplace", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	name: d.varchar({ length: 255 }).notNull(),
	latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
	longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
	radius: d.integer().notNull().default(100), // 미터 단위
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const attendanceRecords = createTable("attendance_record", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	userId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id),
	workplaceId: d
		.integer()
		.notNull()
		.references(() => workplaces.id),
	date: d.date().notNull(),
	clockInTime: d.timestamp({ withTimezone: true }),
	clockOutTime: d.timestamp({ withTimezone: true }),
	clockInLocation: d.json(), // { latitude, longitude }
	clockOutLocation: d.json(), // { latitude, longitude }
	status: attendanceStatusEnum("status").default("normal").notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const attendanceRecordsRelations = relations(
	attendanceRecords,
	({ one }) => ({
		user: one(users, {
			fields: [attendanceRecords.userId],
			references: [users.id],
		}),
		workplace: one(workplaces, {
			fields: [attendanceRecords.workplaceId],
			references: [workplaces.id],
		}),
	}),
);

export const userSettings = createTable("user_setting", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	userId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id),
	defaultClockInTime: d.time().notNull().default(sql`'09:00:00'`),
	defaultClockOutTime: d.time().notNull().default(sql`'18:00:00'`),
	language: languageEnum("language").default("ko").notNull(),
	theme: themeEnum("theme").default("system").notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

// 공휴일 테이블
export const holidays = createTable("holiday", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	name: d.varchar({ length: 255 }).notNull(),
	type: holidayTypeEnum("type").notNull(), // weekly 또는 specific_date
	weeklyDay: d.integer(), // 0-6 (일요일-토요일), type이 weekly일 때만 사용
	specificDate: d.date(), // type이 specific_date일 때만 사용
	description: d.text(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));
