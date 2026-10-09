import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FieldError } from "@/components/ui/field-error";
import { dateRangeRule, dateRule, emailRule } from "@/lib/validation/rules";

function DemoForm({ onValid }: { onValid?: () => void }) {
  const [values, setValues] = useState({ email: "", startDate: "", endDate: "" });
  const form = useFormValidation(values, {
    email: (v) => emailRule(v),
    startDate: (v) => dateRule(v, { label: "Start date" }),
    endDate: (v, all) => dateRule(v, { label: "End date" }) ?? dateRangeRule(all.startDate, v),
  });
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((p) => ({ ...p, [key]: e.target.value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (form.validateAll()) onValid?.();
      }}
    >
      <label htmlFor="email">Email</label>
      <input id="email" value={values.email} onChange={set("email")} {...form.fieldProps("email")} />
      <FieldError id={form.errorId("email")} message={form.errorFor("email")} />
      <label htmlFor="start">Start</label>
      <input id="start" value={values.startDate} onChange={set("startDate")} {...form.fieldProps("startDate")} />
      <FieldError id={form.errorId("startDate")} message={form.errorFor("startDate")} />
      <label htmlFor="end">End</label>
      <input id="end" value={values.endDate} onChange={set("endDate")} {...form.fieldProps("endDate")} />
      <FieldError id={form.errorId("endDate")} message={form.errorFor("endDate")} />
      <button type="submit">Save</button>
    </form>
  );
}

describe("useFormValidation", () => {
  it("does not show errors before the field is blurred", () => {
    render(<DemoForm />);
    const email = screen.getByLabelText("Email");
    fireEvent.change(email, { target: { value: "jo" } });
    expect(screen.queryByText(/valid email/)).toBeNull();
    fireEvent.blur(email);
    expect(screen.getByText(/valid email/)).toBeTruthy();
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(email.getAttribute("aria-describedby")).toBe(screen.getByText(/valid email/).closest("p")!.id);
  });

  it("clears the error as soon as the value becomes valid", () => {
    render(<DemoForm />);
    const email = screen.getByLabelText("Email");
    fireEvent.blur(email);
    expect(screen.getByText("Email address is required.")).toBeTruthy();
    fireEvent.change(email, { target: { value: "jo@example.com" } });
    expect(screen.queryByText("Email address is required.")).toBeNull();
    expect(email.getAttribute("aria-invalid")).toBeNull();
  });

  it("revalidates the end date when the start date changes", () => {
    render(<DemoForm />);
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2026-09-01" } });
    const end = screen.getByLabelText("End");
    fireEvent.change(end, { target: { value: "2026-09-05" } });
    fireEvent.blur(end);
    expect(screen.queryByText(/on or after/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2026-09-10" } });
    expect(screen.getByText("End date must be on or after the start date.")).toBeTruthy();
  });

  it("blocks submission and reveals every error", async () => {
    let submitted = false;
    render(<DemoForm onValid={() => (submitted = true)} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    expect(submitted).toBe(false);
    expect(screen.getByText("Email address is required.")).toBeTruthy();
    expect(screen.getByText("Start date is required.")).toBeTruthy();
  });
});
