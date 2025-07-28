import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
	getUser: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.query.users.findFirst({
			where: eq(users.id, ctx.session.user.id),
		});

		return user;
	}),
});
