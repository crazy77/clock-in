import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "~/utils/api";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: user } = api.auth.getUser.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    if (user && !user.isAdmin) {
      router.push("/");
      return;
    }
  }, [session, status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || (user && !user.isAdmin)) {
    return null;
  }

  return <>{children}</>;
} 