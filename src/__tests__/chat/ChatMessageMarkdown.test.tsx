import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ChatMessageMarkdown } from "@/components/ui/ChatMessageMarkdown";

describe("ChatMessageMarkdown", () => {
  it("renders basic markdown elements correctly", () => {
    const markdown = "# Title\n\nThis is **bold** and *italic* text.";
    const { container } = render(<ChatMessageMarkdown content={markdown} />);

    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Title");
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");
  });

  it("renders lists cleanly", () => {
    const markdown = "- First item\n- Second item\n- Third item";
    render(<ChatMessageMarkdown content={markdown} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toBe("First item");
    expect(listItems[1].textContent).toBe("Second item");
  });

  it("converts run-on inline bullet points with bold headers into proper bullet list items", () => {
    // The problem reported by the user: "Landlord: - **Phone:** 0917 111 0001 - **Email:** test@example.com"
    const rawContent = "Here are your landlord details: - **Phone:** 0917 111 0001 - **Email:** landlord@test.com";
    render(<ChatMessageMarkdown content={rawContent} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBeGreaterThanOrEqual(2);
    expect(listItems[0].textContent).toContain("Phone:");
    expect(listItems[1].textContent).toContain("Email:");
  });

  it("automatically creates clickable tel: links for Philippine phone numbers", () => {
    const content = "You can call the landlord at 0917 111 0001 or +639171110002.";
    render(<ChatMessageMarkdown content={content} />);

    const telLink1 = screen.getByRole("link", { name: "0917 111 0001" });
    expect(telLink1.getAttribute("href")).toBe("tel:09171110001");

    const telLink2 = screen.getByRole("link", { name: "+639171110002" });
    expect(telLink2.getAttribute("href")).toBe("tel:+639171110002");
  });

  it("renders tables with GFM table plugin", () => {
    const tableMarkdown = `
| Item | Price |
| :--- | :--- |
| Rent | ₱15,000 |
| Water | ₱500 |
`;
    render(<ChatMessageMarkdown content={tableMarkdown} />);

    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.getByText("Item")).toBeDefined();
    expect(screen.getByText("Rent")).toBeDefined();
    expect(screen.getByText("₱15,000")).toBeDefined();
  });

  it("renders code block with language header and copy button", async () => {
    const codeMarkdown = "```javascript\nconst x = 42;\n```";
    
    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ChatMessageMarkdown content={codeMarkdown} />);

    expect(screen.getByText("javascript")).toBeDefined();
    expect(screen.getByText("const x = 42;")).toBeDefined();

    const copyBtn = screen.getByRole("button", { name: /copy/i });
    expect(copyBtn).toBeDefined();

    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith("const x = 42;");

    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeDefined();
    });
  });

  it("applies user bubble styling when isUser is true", () => {
    const { container } = render(
      <ChatMessageMarkdown content="Hello landlord" isUser={true} />
    );

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("text-primary-foreground");
  });
});
