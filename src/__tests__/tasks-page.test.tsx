import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TasksPage from "@/app/app/tasks/page";

describe("Tasks page", () => {
  it("shows today's open tasks with subtask progress and project chips", () => {
    render(<TasksPage />);
    expect(screen.getByText("Send proposal to Kemi")).toBeInTheDocument();
    expect(screen.getByText("Review Q3 budget draft")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument(); // subtask progress
    expect(screen.getByText("Client: Kemi")).toBeInTheDocument();
    // Due in 2 days → Upcoming, not Today
    expect(screen.queryByText("Book flight to Nairobi")).not.toBeInTheDocument();
  });

  it("tabs filter tasks; Upcoming holds the flight task", async () => {
    render(<TasksPage />);
    await userEvent.click(screen.getByRole("tab", { name: /Upcoming/ }));
    expect(screen.getByText("Book flight to Nairobi")).toBeInTheDocument();
    expect(screen.queryByText("Send proposal to Kemi")).not.toBeInTheDocument();
  });

  it("quick-add creates a task due today", async () => {
    render(<TasksPage />);
    await userEvent.type(screen.getByLabelText("Add a task"), "Write tests{Enter}");
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a task")).toHaveValue(""); // input cleared
  });

  it("completing a task moves it to Completed with undo-able state", async () => {
    render(<TasksPage />);
    await userEvent.click(screen.getByLabelText("Complete Review Q3 budget draft"));
    expect(screen.queryByText("Review Q3 budget draft")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Completed/ }));
    expect(screen.getByText("Review Q3 budget draft")).toBeInTheDocument();
  });

  it("the detail drawer shows and toggles subtasks", async () => {
    render(<TasksPage />);
    await userEvent.click(screen.getByText("Send proposal to Kemi"));
    const dialog = screen.getByRole("dialog", { name: "Send proposal to Kemi" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Draft pricing section")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Toggle Final review"));
    // close and check row progress updated to 2/2
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("Mark complete in the drawer completes the task", async () => {
    render(<TasksPage />);
    await userEvent.click(screen.getByText("Send proposal to Kemi"));
    await userEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Send proposal to Kemi")).not.toBeInTheDocument();
  });
});
