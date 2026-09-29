import { describe, expect, it } from "vitest";

import {
  explainConnectionError,
  inspectConnectionString,
} from "../../scripts/lib/connection-string.mjs";

const HOST = "aws-0-ap-south-1.pooler.supabase.com";
const USER = "postgres.abcdefghijklmnop";

describe("inspectConnectionString", () => {
  it("accepts a correct Supabase pooler string and hides the password", () => {
    const report = inspectConnectionString(
      `postgresql://${USER}:S3cretPass99@${HOST}:6543/postgres?pgbouncer=true`,
    );
    expect(report.problems).toEqual([]);
    expect(report.summary).toContain("password of 12 characters");
    expect(report.summary).toContain(`host ${HOST}, port 6543`);
    expect(report.summary).not.toContain("S3cretPass99");
  });

  it("catches the untouched placeholder", () => {
    const report = inspectConnectionString(
      `postgresql://${USER}:[YOUR-PASSWORD]@${HOST}:5432/postgres`,
    );
    expect(report.problems.join(" ")).toMatch(/\[YOUR-PASSWORD\] placeholder/);
  });

  it("catches brackets left around the real password", () => {
    const report = inspectConnectionString(
      `postgresql://${USER}:[S3cretPass99]@${HOST}:5432/postgres`,
    );
    expect(report.problems.join(" ")).toMatch(/square brackets/);
    expect(report.summary).toContain("password of 14 characters");
  });

  it("catches quotes and stray whitespace", () => {
    const report = inspectConnectionString(` "postgresql://${USER}:pw@${HOST}:5432/postgres"\n`);
    expect(report.problems).toHaveLength(2);
    expect(report.url).not.toBeNull();
  });

  it("explains unencoded special characters", () => {
    const report = inspectConnectionString(`postgresql://${USER}:ab#cd@${HOST}:5432/postgres`);
    expect(report.url).toBeNull();
    expect(report.problems.join(" ")).toMatch(/URL-encoded/);
  });

  it("wants the project ref in the pooler username", () => {
    const report = inspectConnectionString(`postgresql://postgres:pw@${HOST}:5432/postgres`);
    expect(report.problems.join(" ")).toMatch(/postgres\.<project-ref>/);
  });

  it("accepts local and URL-encoded passwords", () => {
    expect(
      inspectConnectionString("postgresql://operiq:operiq@localhost:5432/operiq").problems,
    ).toEqual([]);
    const encoded = inspectConnectionString(`postgresql://${USER}:a%23b%40c@${HOST}:5432/postgres`);
    expect(encoded.problems).toEqual([]);
    expect(encoded.summary).toContain("password of 5 characters");
  });

  it("reports a missing value", () => {
    expect(inspectConnectionString(undefined).problems).toHaveLength(1);
  });
});

describe("explainConnectionError", () => {
  it("maps the common failures to advice", () => {
    expect(
      explainConnectionError({ code: "28P01", message: "password authentication failed" }),
    ).toMatch(/Wrong password/);
    expect(explainConnectionError({ code: "XX000", message: "Tenant or user not found" })).toMatch(
      /username or host/,
    );
    expect(explainConnectionError({ code: "ENOTFOUND", message: "" })).toMatch(/typos/);
    expect(explainConnectionError(new Error("something else"))).toBeNull();
  });
});
