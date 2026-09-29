import { test as base, type BrowserContext } from "@playwright/test";

import { createUserWithSession } from "./db";

export async function signIn(context: BrowserContext, baseURL: string, token: string) {
  await context.addCookies([
    { name: "operiq_session", value: token, url: baseURL, httpOnly: true, sameSite: "Lax" },
  ]);
}

interface Fixtures {
  newUser: (name: string) => Promise<{ id: string; email: string; token: string }>;
}

export const test = base.extend<Fixtures>({
  newUser: async ({ context, baseURL }, provide) => {
    await provide(async (name) => {
      const user = await createUserWithSession({ name });
      await signIn(context, baseURL!, user.token);
      return user;
    });
  },
});

export { expect } from "@playwright/test";
