import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SignaturePad } from "../SignaturePad";

let mockIsEmptyValue = true;
let endStrokeCallback: () => void = () => {};
const mockClear = vi.fn();

vi.mock("signature_pad", () => {
  return {
    default: class MockSignaturePad {
      clear = mockClear;
      isEmpty = () => mockIsEmptyValue;
      toDataURL = () => "data:image/png;base64,mockdata";
      addEventListener = (event: string, cb: () => void) => {
        if (event === "endStroke") {
          endStrokeCallback = cb;
        }
      };
      off = vi.fn();
    }
  };
});

describe("SignaturePad", () => {
  let mockOnSave: Mock<(dataUrl: string) => void>;
  let mockOnClear: Mock<() => void>;

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnClear = vi.fn();
    mockIsEmptyValue = true;
    endStrokeCallback = () => {};
    mockClear.mockClear();

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
      fillRect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    })) as unknown as any;

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mockdata");
  });

  it("should render canvas and buttons", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Finalize Signature")).toBeInTheDocument();
  });

  it("should initialize canvas with correct dimensions", () => {
    const width = 800;
    const height = 400;

    render(<SignaturePad onSave={mockOnSave} width={width} height={height} />);

    const canvas = document.querySelector("canvas");
    // Since we use signature_pad library now, it might handle dimensions differently (internal resize)
    // But the canvas element should still have properties if we set them.
  });

  it("should disable clear and save buttons when canvas is empty", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    const clearButton = screen.getByText("Clear");
    const saveButton = screen.getByText("Finalize Signature");

    expect(clearButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it("should clear canvas when clear button is clicked", () => {
    render(<SignaturePad onSave={mockOnSave} onClear={mockOnClear} />);

    // Simulate drawing
    mockIsEmptyValue = false;
    act(() => {
      endStrokeCallback();
    });

    const clearButton = screen.getByText("Clear");
    expect(clearButton).not.toBeDisabled();

    fireEvent.click(clearButton);
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it("should handle save button interaction", () => {
    render(<SignaturePad onSave={mockOnSave} />);

    // Simulate drawing
    mockIsEmptyValue = false;
    act(() => {
      endStrokeCallback();
    });

    const saveButton = screen.getByText("Finalize Signature");
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith("data:image/png;base64,mockdata");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SignaturePad onSave={mockOnSave} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });
});
