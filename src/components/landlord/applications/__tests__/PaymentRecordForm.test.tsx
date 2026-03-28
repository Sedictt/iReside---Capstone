import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaymentRecordForm } from "../PaymentRecordForm";
import type { PaymentMethod } from "@/types/database";

describe("PaymentRecordForm", () => {
  const defaultProps = {
    label: "Advance Rent",
    amount: 15000,
    paymentMethod: null as PaymentMethod | null,
    onMethodChange: vi.fn(),
    referenceNumber: "",
    onReferenceChange: vi.fn(),
    paidAt: null,
    onPaidAtChange: vi.fn(),
    status: "pending" as const,
    onStatusChange: vi.fn(),
  };

  it("should render all input fields correctly", () => {
    render(<PaymentRecordForm {...defaultProps} />);

    expect(screen.getByText("Advance Rent")).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reference Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Paid Date/i)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should display the correct amount", () => {
    render(<PaymentRecordForm {...defaultProps} amount={25000} />);

    const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
    expect(amountInput.value).toBe("25000");
  });

  it("should call onAmountChange when amount is edited and allowAmountEdit is true", () => {
    const onAmountChange = vi.fn();
    render(
      <PaymentRecordForm
        {...defaultProps}
        allowAmountEdit={true}
        onAmountChange={onAmountChange}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: "20000" } });

    expect(onAmountChange).toHaveBeenCalledWith(20000);
  });

  it("should not call onAmountChange when allowAmountEdit is false", () => {
    const onAmountChange = vi.fn();
    render(
      <PaymentRecordForm
        {...defaultProps}
        allowAmountEdit={false}
        onAmountChange={onAmountChange}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
    expect(amountInput.disabled).toBe(true);
  });

  it("should call onMethodChange when payment method is selected", () => {
    const onMethodChange = vi.fn();
    render(<PaymentRecordForm {...defaultProps} onMethodChange={onMethodChange} />);

    const methodSelect = screen.getByLabelText(/Payment Method/i);
    fireEvent.change(methodSelect, { target: { value: "gcash" } });

    expect(onMethodChange).toHaveBeenCalledWith("gcash");
  });

  it("should display all payment method options", () => {
    render(<PaymentRecordForm {...defaultProps} />);

    const methodSelect = screen.getByLabelText(/Payment Method/i);
    const options = methodSelect.querySelectorAll("option");

    // 6 payment methods + 1 placeholder option
    expect(options).toHaveLength(7);
    expect(options[0].textContent).toBe("Select payment method");
    expect(options[1].textContent).toBe("GCash");
    expect(options[2].textContent).toBe("Maya");
    expect(options[3].textContent).toBe("Bank Transfer");
    expect(options[4].textContent).toBe("Cash");
    expect(options[5].textContent).toBe("Credit Card");
    expect(options[6].textContent).toBe("Debit Card");
  });

  it("should call onReferenceChange when reference number is entered", () => {
    const onReferenceChange = vi.fn();
    render(
      <PaymentRecordForm {...defaultProps} onReferenceChange={onReferenceChange} />
    );

    const referenceInput = screen.getByLabelText(/Reference Number/i);
    fireEvent.change(referenceInput, { target: { value: "REF123456" } });

    expect(onReferenceChange).toHaveBeenCalledWith("REF123456");
  });

  it("should call onPaidAtChange when paid date is selected", () => {
    const onPaidAtChange = vi.fn();
    render(<PaymentRecordForm {...defaultProps} onPaidAtChange={onPaidAtChange} />);

    const dateInput = screen.getByLabelText(/Paid Date/i);
    fireEvent.change(dateInput, { target: { value: "2024-06-15" } });

    expect(onPaidAtChange).toHaveBeenCalledWith("2024-06-15");
  });

  it("should call onStatusChange when status toggle is clicked", () => {
    const onStatusChange = vi.fn();
    render(<PaymentRecordForm {...defaultProps} onStatusChange={onStatusChange} />);

    const completedButton = screen.getByText("Completed");
    fireEvent.click(completedButton);

    expect(onStatusChange).toHaveBeenCalledWith("completed");
  });

  it("should highlight the active status button", () => {
    const { rerender } = render(
      <PaymentRecordForm {...defaultProps} status="pending" />
    );

    const pendingButton = screen.getByText("Pending");
    expect(pendingButton).toHaveClass("bg-amber-500");

    rerender(<PaymentRecordForm {...defaultProps} status="completed" />);

    const completedButton = screen.getByText("Completed");
    expect(completedButton).toHaveClass("bg-primary");
  });

  it("should display validation errors for required fields", () => {
    render(<PaymentRecordForm {...defaultProps} />);

    const methodSelect = screen.getByLabelText(/Payment Method/i);
    expect(methodSelect).toHaveAttribute("required");
  });

  it("should not allow negative amounts", () => {
    const onAmountChange = vi.fn();
    render(
      <PaymentRecordForm
        {...defaultProps}
        allowAmountEdit={true}
        onAmountChange={onAmountChange}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: "-1000" } });

    // onAmountChange should not be called with negative values
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it("should render with pre-filled values", () => {
    render(
      <PaymentRecordForm
        {...defaultProps}
        amount={18000}
        paymentMethod="gcash"
        referenceNumber="REF789"
        paidAt="2024-06-01"
        status="completed"
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
    const methodSelect = screen.getByLabelText(/Payment Method/i) as HTMLSelectElement;
    const referenceInput = screen.getByLabelText(/Reference Number/i) as HTMLInputElement;
    const dateInput = screen.getByLabelText(/Paid Date/i) as HTMLInputElement;

    expect(amountInput.value).toBe("18000");
    expect(methodSelect.value).toBe("gcash");
    expect(referenceInput.value).toBe("REF789");
    expect(dateInput.value).toBe("2024-06-01");
  });
});
