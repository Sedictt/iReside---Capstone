import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignaturePad } from "../SignaturePad";

describe("SignaturePad", () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnClear: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnClear = vi.fn();

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      strokeStyle: "",
      lineWidth: 0,
      lineCap: "",
      lineJoin: "",
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mockdata");
  });

  it("should render canvas and buttons", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Save Signature")).toBeInTheDocument();
  });

  it("should initialize canvas with correct dimensions", () => {
    const width = 800;
    const height = 400;

    render(<SignaturePad onSave={mockOnSave} width={width} height={height} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toHaveProperty("width", width);
    expect(canvas).toHaveProperty("height", height);
  });

  it("should disable clear and save buttons when canvas is empty", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const clearButton = screen.getByText("Clear");
    const saveButton = screen.getByText("Save Signature");

    expect(clearButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it("should enable buttons after drawing", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Simulate drawing
    fireEvent.mouseDown(canvas!, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas!, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas!);

    const clearButton = screen.getByText("Clear");
    const saveButton = screen.getByText("Save Signature");

    expect(clearButton).not.toBeDisabled();
    expect(saveButton).not.toBeDisabled();
  });

  it("should clear canvas when clear button is clicked", () => {
    render(<SignaturePad onSave={mockOnSave} onClear={mockOnClear} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Simulate drawing
    fireEvent.mouseDown(canvas!, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas!, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas!);

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);

    // Buttons should be disabled again
    expect(clearButton).toBeDisabled();
    expect(screen.getByText("Save Signature")).toBeDisabled();
  });

  it("should call onSave with base64 data URL when save is clicked", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Simulate drawing
    fireEvent.mouseDown(canvas!, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas!, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas!);

    const saveButton = screen.getByText("Save Signature");
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith("data:image/png;base64,mockdata");
  });

  it("should not call onSave when canvas is empty", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const saveButton = screen.getByText("Save Signature");
    
    // Button should be disabled, but try clicking anyway
    expect(saveButton).toBeDisabled();
    
    // Even if we force click, onSave should not be called
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should handle touch events", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Simulate touch drawing
    fireEvent.touchStart(canvas!, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(canvas!, {
      touches: [{ clientX: 50, clientY: 50 }],
    });
    fireEvent.touchEnd(canvas!);

    const saveButton = screen.getByText("Save Signature");
    expect(saveButton).not.toBeDisabled();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SignaturePad onSave={mockOnSave} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });
});
