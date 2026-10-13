import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./FilterBar";
import { NoteForm } from "./NoteForm";

describe("FilterBar", () => {
  it("renders status filter chips and invokes callbacks", () => {
    const onSelectStatus = vi.fn();
    const onSearchChange = vi.fn();

    render(
      <FilterBar
        selectedStatus={null}
        onSelectStatus={onSelectStatus}
        statusCounts={{
          new: 2,
          contacted: 1,
          qualified: 1,
          proposal_sent: 1,
          won: 1,
          lost: 0,
        }}
        totalCount={6}
        searchQuery=""
        onSearchChange={onSearchChange}
      />
    );

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Proposal Sent")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Qualified"));
    expect(onSelectStatus).toHaveBeenCalledWith("qualified");

    const input = screen.getByPlaceholderText(/Search leads/i);
    fireEvent.change(input, { target: { value: "Sarah" } });
    expect(onSearchChange).toHaveBeenCalledWith("Sarah");
  });
});

describe("NoteForm", () => {
  it("blocks empty note submission with inline error and submits valid note", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText("Save Note"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Please enter a discussion note/i
    );
    expect(onSubmit).not.toHaveBeenCalled();

    const textarea = screen.getByPlaceholderText(/Log a new discussion/i);
    fireEvent.change(textarea, { target: { value: "Called client about pricing" } });
    fireEvent.click(screen.getByText("Save Note"));

    expect(onSubmit).toHaveBeenCalledWith({
      note: "Called client about pricing",
      follow_up_at: null,
    });
  });
});

describe("Header", () => {
  it("renders notification bell badge and toggles reminder popover", async () => {
    const { Header } = await import("@/components/Header");
    const onSelectLead = vi.fn();
    const onAddLeadClick = vi.fn();
    const onViewModeChange = vi.fn();
    const onExportCsv = vi.fn();

    const mockReminderLeads = [
      {
        id: 42,
        name: "Alice Stark",
        company: "Stark Industries",
        phone: "555-0199",
        status: "qualified" as const,
        follow_up_at: new Date(Date.now() - 3600000).toISOString(),
        last_discussion_at: null,
        last_note: "Check proposal feedback",
        discussions_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <Header
        onAddLeadClick={onAddLeadClick}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        onExportCsv={onExportCsv}
        reminderLeads={mockReminderLeads}
        onSelectLead={onSelectLead}
      />
    );

    // Bell button exists and has pending count 1
    const bellBtn = screen.getByRole("button", {
      name: /Follow-up reminders \(1 pending\)/i,
    });
    expect(bellBtn).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Click bell to open reminders dropdown
    fireEvent.click(bellBtn);
    expect(screen.getByText("Follow-up Reminders")).toBeInTheDocument();
    expect(screen.getByText("Alice Stark")).toBeInTheDocument();
    expect(screen.getByText("Stark Industries")).toBeInTheDocument();

    // Click lead to trigger onSelectLead
    fireEvent.click(screen.getByText("Alice Stark"));
    expect(onSelectLead).toHaveBeenCalledWith(42);
  });
});

