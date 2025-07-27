import { endOfMonth, format, startOfMonth } from "date-fns";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { calculateDistance } from "~/lib/location";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	attendanceRecords,
	holidays,
	userSettings,
	users,
	workplaces,
} from "~/server/db/schema";

export const attendanceRouter = createTRPCRouter({
	// 오늘 출퇴근 기록 조회
	getTodayRecord: protectedProcedure.query(async ({ ctx }) => {
		const today = new Date();
		const todayStr = format(today, "yyyy-MM-dd");

		const record = await ctx.db.query.attendanceRecords.findFirst({
			where: and(
				eq(attendanceRecords.userId, ctx.session.user.id),
				eq(attendanceRecords.date, todayStr),
			),
			with: {
				workplace: true,
			},
		});

		return record;
	}),

	// 출근 기록
	clockIn: protectedProcedure
		.input(
			z.object({
				workplaceId: z.number(),
				latitude: z.number(),
				longitude: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// 오늘 이미 출근했는지 확인
			const today = new Date();
			const todayStr = format(today, "yyyy-MM-dd");

			const existingRecord = await ctx.db.query.attendanceRecords.findFirst({
				where: and(
					eq(attendanceRecords.userId, ctx.session.user.id),
					eq(attendanceRecords.date, todayStr),
				),
			});

			if (existingRecord?.clockInTime) {
				throw new Error("Already clocked in today");
			}

			// 출퇴근 장소 정보 조회
			const workplace = await ctx.db.query.workplaces.findFirst({
				where: eq(workplaces.id, input.workplaceId),
			});

			if (!workplace) {
				throw new Error("Workplace not found");
			}

			// 위치 확인
			const distance = calculateDistance(
				input.latitude,
				input.longitude,
				Number(workplace.latitude),
				Number(workplace.longitude),
			);

			if (distance > workplace.radius) {
				throw new Error("Location out of range");
			}

			// 공휴일 확인
			const dayOfWeek = today.getDay(); // 0-6 (일요일-토요일)

			// 주간 공휴일 확인
			const weeklyHoliday = await ctx.db.query.holidays.findFirst({
				where: and(
					eq(holidays.type, "weekly"),
					eq(holidays.weeklyDay, dayOfWeek),
				),
			});

			// 특정 날짜 공휴일 확인
			const specificHoliday = await ctx.db.query.holidays.findFirst({
				where: and(
					eq(holidays.type, "specific_date"),
					eq(holidays.specificDate, todayStr),
				),
			});

			if (weeklyHoliday || specificHoliday) {
				throw new Error("Today is a holiday");
			}

			// 사용자 설정 조회
			const userSetting = await ctx.db.query.userSettings.findFirst({
				where: eq(userSettings.userId, ctx.session.user.id),
			});

			const now = new Date();
			const defaultClockInTime = userSetting?.defaultClockInTime || "09:00:00";
			const [hours, minutes] = defaultClockInTime.split(":").map(Number);
			const defaultTime = new Date();
			defaultTime.setHours(hours ?? 0, minutes ?? 0, 0, 0);

			// 지각 여부 확인
			const status = now > defaultTime ? "late" : "normal";

			// 기록 생성 또는 업데이트
			if (existingRecord) {
				await ctx.db
					.update(attendanceRecords)
					.set({
						clockInTime: now,
						clockInLocation: {
							latitude: input.latitude,
							longitude: input.longitude,
						},
						status,
						updatedAt: now,
					})
					.where(eq(attendanceRecords.id, existingRecord.id));
			} else {
				await ctx.db.insert(attendanceRecords).values({
					userId: ctx.session.user.id,
					workplaceId: input.workplaceId,
					date: todayStr,
					clockInTime: now,
					clockInLocation: {
						latitude: input.latitude,
						longitude: input.longitude,
					},
					status,
				});
			}

			return { success: true };
		}),

	// 퇴근 기록
	clockOut: protectedProcedure
		.input(
			z.object({
				workplaceId: z.number(),
				latitude: z.number(),
				longitude: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const today = new Date();
			const todayStr = format(today, "yyyy-MM-dd");

			const record = await ctx.db.query.attendanceRecords.findFirst({
				where: and(
					eq(attendanceRecords.userId, ctx.session.user.id),
					eq(attendanceRecords.date, todayStr),
				),
			});

			if (!record) {
				throw new Error("No clock in record found for today");
			}

			if (record.clockOutTime) {
				throw new Error("Already clocked out today");
			}

			// 출퇴근 장소 정보 조회
			const workplace = await ctx.db.query.workplaces.findFirst({
				where: eq(workplaces.id, input.workplaceId),
			});

			if (!workplace) {
				throw new Error("Workplace not found");
			}

			// 위치 확인
			const distance = calculateDistance(
				input.latitude,
				input.longitude,
				Number(workplace.latitude),
				Number(workplace.longitude),
			);

			if (distance > workplace.radius) {
				throw new Error("Location out of range");
			}

			// 사용자 설정 조회
			const userSetting = await ctx.db.query.userSettings.findFirst({
				where: eq(userSettings.userId, ctx.session.user.id),
			});

			const now = new Date();
			const defaultClockOutTime =
				userSetting?.defaultClockOutTime || "18:00:00";
			const [hours, minutes] = defaultClockOutTime.split(":").map(Number);
			const defaultTime = new Date();
			defaultTime.setHours(hours ?? 0, minutes ?? 0, 0, 0);

			// 조퇴 여부 확인
			let status = record.status;
			if (now < defaultTime) {
				status = "early_leave";
			}

			await ctx.db
				.update(attendanceRecords)
				.set({
					clockOutTime: now,
					clockOutLocation: {
						latitude: input.latitude,
						longitude: input.longitude,
					},
					status,
					updatedAt: now,
				})
				.where(eq(attendanceRecords.id, record.id));

			return { success: true };
		}),

	// 출퇴근 기록 목록 조회 (무한 스크롤)
	getRecords: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				cursor: z.number().nullish(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { limit, cursor } = input;

			const whereClause = cursor
				? and(
						eq(attendanceRecords.userId, ctx.session.user.id),
						sql`${attendanceRecords.id} < ${cursor}`,
					)
				: eq(attendanceRecords.userId, ctx.session.user.id);

			const items = await ctx.db.query.attendanceRecords.findMany({
				where: whereClause,
				limit: limit + 1,
				orderBy: [desc(attendanceRecords.date)],
				with: {
					workplace: true,
				},
			});

			let nextCursor: number | undefined = undefined;
			if (items.length > limit) {
				const nextItem = items.pop();
				if (nextItem) {
					nextCursor = nextItem.id;
				}
			}

			return {
				items,
				nextCursor,
			};
		}),

	// 관리자: 모든 사용자의 오늘 출퇴근 상황
	getTodayStatus: adminProcedure.query(async ({ ctx }) => {
		const today = new Date();
		const todayStr = format(today, "yyyy-MM-dd");

		const records = await ctx.db.query.attendanceRecords.findMany({
			where: eq(attendanceRecords.date, todayStr),
			with: {
				user: true,
				workplace: true,
			},
			orderBy: [desc(attendanceRecords.clockInTime)],
		});

		return records;
	}),

	// 개인: 이번 달 출퇴근 기록 (통계용)
	getPersonalMonthlyRecords: protectedProcedure
		.input(
			z.object({
				year: z.number(),
				month: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { year, month } = input;
			const startDate = startOfMonth(new Date(year, month - 1));
			const endDate = endOfMonth(new Date(year, month - 1));

			const whereClause = and(
				eq(attendanceRecords.userId, ctx.session.user.id),
				gte(attendanceRecords.date, format(startDate, "yyyy-MM-dd")),
				lte(attendanceRecords.date, format(endDate, "yyyy-MM-dd")),
			);

			const items = await ctx.db.query.attendanceRecords.findMany({
				where: whereClause,
				orderBy: [desc(attendanceRecords.date)],
				with: {
					workplace: true,
				},
			});

			return items;
		}),

	// 관리자: 이번 달 출퇴근 기록
	getMonthlyRecords: adminProcedure
		.input(
			z.object({
				filterLateEarly: z.boolean().default(true),
				limit: z.number().min(1).max(100).default(50),
				cursor: z.number().nullish(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { filterLateEarly, limit, cursor } = input;
			const startDate = startOfMonth(new Date());
			const endDate = endOfMonth(new Date());

			let baseWhereClause = and(
				gte(attendanceRecords.date, format(startDate, "yyyy-MM-dd")),
				lte(attendanceRecords.date, format(endDate, "yyyy-MM-dd")),
			);

			if (filterLateEarly) {
				baseWhereClause = and(
					baseWhereClause,
					sql`${attendanceRecords.status} IN ('late', 'early_leave')`,
				);
			}

			const whereClause = cursor
				? and(baseWhereClause, sql`${attendanceRecords.id} < ${cursor}`)
				: baseWhereClause;

			const items = await ctx.db.query.attendanceRecords.findMany({
				where: whereClause,
				limit: limit + 1,
				orderBy: [desc(attendanceRecords.date)],
				with: {
					user: true,
					workplace: true,
				},
			});

			let nextCursor: number | undefined = undefined;
			if (items.length > limit) {
				const nextItem = items.pop();
				if (nextItem) {
					nextCursor = nextItem.id;
				}
			}

			return {
				items,
				nextCursor,
			};
		}),

	// 출퇴근 장소 목록 조회
	getWorkplaces: protectedProcedure.query(async ({ ctx }) => {
		const workplaceList = await ctx.db.query.workplaces.findMany({
			orderBy: [workplaces.name],
		});

		// 기본 출퇴근 장소가 없으면 생성
		if (workplaceList.length === 0) {
			const defaultWorkplace = await ctx.db
				.insert(workplaces)
				.values({
					name: "기본 출퇴근 장소",
					latitude: "37.5665", // 서울 시청 좌표
					longitude: "126.9780",
					radius: 100,
				})
				.returning();

			return defaultWorkplace[0] ? [defaultWorkplace[0]] : [];
		}

		return workplaceList;
	}),

	// 출퇴근 장소 추가
	createWorkplace: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				latitude: z.string(),
				longitude: z.string(),
				radius: z.number().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const newWorkplace = await ctx.db
				.insert(workplaces)
				.values(input)
				.returning();
			return newWorkplace[0];
		}),

	// 출퇴근 장소 수정
	updateWorkplace: adminProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1),
				latitude: z.string(),
				longitude: z.string(),
				radius: z.number().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;
			const updatedWorkplace = await ctx.db
				.update(workplaces)
				.set(updateData)
				.where(eq(workplaces.id, id))
				.returning();
			return updatedWorkplace[0];
		}),

	// 출퇴근 장소 삭제
	deleteWorkplace: adminProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(workplaces).where(eq(workplaces.id, input.id));
			return { success: true };
		}),

	// 사용자별 기본 출퇴근 시간 조회
	getDefaultTimes: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.query.users.findMany({
			columns: {
				id: true,
				name: true,
				email: true,
			},
		});

		const defaultTimes = await Promise.all(
			users.map(async (user) => {
				const setting = await ctx.db.query.userSettings.findFirst({
					where: eq(userSettings.userId, user.id),
				});

				return {
					userId: user.id,
					name: user.name,
					email: user.email,
					defaultClockInTime: setting?.defaultClockInTime || "09:00",
					defaultClockOutTime: setting?.defaultClockOutTime || "18:00",
				};
			}),
		);

		return defaultTimes;
	}),

	// 사용자별 기본 출퇴근 시간 업데이트
	updateDefaultTimes: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				defaultClockInTime: z.string(),
				defaultClockOutTime: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingSetting = await ctx.db.query.userSettings.findFirst({
				where: eq(userSettings.userId, input.userId),
			});

			if (existingSetting) {
				await ctx.db
					.update(userSettings)
					.set({
						defaultClockInTime: input.defaultClockInTime,
						defaultClockOutTime: input.defaultClockOutTime,
						updatedAt: new Date(),
					})
					.where(eq(userSettings.userId, input.userId));
			} else {
				await ctx.db.insert(userSettings).values({
					userId: input.userId,
					defaultClockInTime: input.defaultClockInTime,
					defaultClockOutTime: input.defaultClockOutTime,
				});
			}

			return { success: true };
		}),

	// 공휴일 목록 조회
	getHolidays: adminProcedure.query(async ({ ctx }) => {
		const holidayList = await ctx.db.query.holidays.findMany({
			orderBy: [desc(holidays.createdAt)],
		});
		return holidayList;
	}),

	// 공휴일 추가
	createHoliday: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				type: z.enum(["weekly", "specific_date"]),
				weeklyDay: z.number().min(0).max(6).optional(),
				specificDate: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const newHoliday = await ctx.db
				.insert(holidays)
				.values(input)
				.returning();
			return newHoliday[0];
		}),

	// 공휴일 수정
	updateHoliday: adminProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1),
				type: z.enum(["weekly", "specific_date"]),
				weeklyDay: z.number().min(0).max(6).optional(),
				specificDate: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;
			const updatedHoliday = await ctx.db
				.update(holidays)
				.set(updateData)
				.where(eq(holidays.id, id))
				.returning();
			return updatedHoliday[0];
		}),

	// 공휴일 삭제
	deleteHoliday: adminProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(holidays).where(eq(holidays.id, input.id));
			return { success: true };
		}),

	// 특정 날짜가 공휴일인지 확인
	isHoliday: protectedProcedure
		.input(
			z.object({
				date: z.string(), // YYYY-MM-DD 형식
			}),
		)
		.query(async ({ ctx, input }) => {
			const targetDate = new Date(input.date);
			const dayOfWeek = targetDate.getDay(); // 0-6 (일요일-토요일)

			// 주간 공휴일 확인
			const weeklyHoliday = await ctx.db.query.holidays.findFirst({
				where: and(
					eq(holidays.type, "weekly"),
					eq(holidays.weeklyDay, dayOfWeek),
				),
			});

			// 특정 날짜 공휴일 확인
			const specificHoliday = await ctx.db.query.holidays.findFirst({
				where: and(
					eq(holidays.type, "specific_date"),
					eq(holidays.specificDate, input.date),
				),
			});

			return {
				isHoliday: !!(weeklyHoliday || specificHoliday),
				weeklyHoliday,
				specificHoliday,
			};
		}),
});
