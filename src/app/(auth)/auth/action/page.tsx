import type { Metadata } from "next";

import { AuthActionHandler } from "@/modules/auth/components/auth-action-handler";

export const metadata: Metadata = {
  title: "Account action",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AuthActionPage({ searchParams }: PageProps<"/auth/action">) {
  const params = await searchParams;
  const mode = typeof params.mode === "string" ? params.mode : null;
  const code = typeof params.oobCode === "string" ? params.oobCode : null;

  return <AuthActionHandler mode={mode} code={code} />;
}
