import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/shared/empty-state";
import { PasswordInput } from "@/components/shared/password-input";
import { RoleBadge } from "@/components/shared/role-badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { PasswordStrength } from "@/modules/auth/components/password-strength";

describe("Button", () => {
  it("is disabled and marked busy while loading", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("PasswordInput", () => {
  it("toggles visibility with an accessible button", async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("PasswordStrength", () => {
  it("renders nothing for an empty password and a label otherwise", () => {
    const { container, rerender } = render(<PasswordStrength password="" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PasswordStrength password="Abcdefgh1234!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });
});

describe("FieldError", () => {
  it("announces errors and hides when empty", () => {
    const { container, rerender } = render(<FieldError />);
    expect(container).toBeEmptyDOMElement();
    rerender(<FieldError>Enter a valid email address.</FieldError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");
  });
});

describe("EmptyState and RoleBadge", () => {
  it("render their content", () => {
    render(
      <>
        <EmptyState
          icon={Inbox}
          title="No invitations"
          description="Invite someone to get started."
        />
        <RoleBadge role="MANAGER" />
      </>,
    );
    expect(screen.getByRole("heading", { name: "No invitations" })).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });
});
