/**
 * Unit tests for ProjectManager component
 * Tests requirements: 4.2, 4.3, 4.4
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectManager } from "../ProjectManager";
import { useProjectStore } from "../../stores/projectStore";

// Mock the project store
jest.mock("../../stores/projectStore");
const mockUseProjectStore = useProjectStore as jest.MockedFunction<typeof useProjectStore>;

const mockProjectStore = {
  currentProject: null,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
  projectList: [],
  createNewProject: jest.fn(),
  saveCurrentProject: jest.fn(),
  loadProjectById: jest.fn(),
  deleteProjectById: jest.fn(),
  refreshProjectList: jest.fn(),
  clearError: jest.fn(),
};

describe("ProjectManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProjectStore.mockReturnValue(mockProjectStore);
  });

  it("should not render when closed", () => {
    render(<ProjectManager isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText("Project Manager")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText("Project Manager")).toBeInTheDocument();
  });

  it("should call refreshProjectList when opened", () => {
    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    expect(mockProjectStore.refreshProjectList).toHaveBeenCalled();
  });

  it("should display current project information", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-02"),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
    });

    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("(Unsaved changes)")).toBeInTheDocument();
  });

  it("should display project list", () => {
    const mockProjectList = [
      {
        id: "project-1",
        name: "Project 1",
        updatedAt: new Date("2023-01-01"),
        size: 1024,
      },
      {
        id: "project-2",
        name: "Project 2",
        updatedAt: new Date("2023-01-02"),
        size: 2048,
      },
    ];

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      projectList: mockProjectList,
    });

    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("Project 2")).toBeInTheDocument();
    expect(screen.getByText("Saved Projects (2)")).toBeInTheDocument();
  });

  it("should handle new project creation", async () => {
    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    // Click new project button
    fireEvent.click(screen.getByText("New Project"));
    
    // Fill in project name
    const nameInput = screen.getByPlaceholderText("Enter project name...");
    fireEvent.change(nameInput, { target: { value: "New Test Project" } });
    
    // Click create button
    fireEvent.click(screen.getByText("Create"));
    
    await waitFor(() => {
      expect(mockProjectStore.createNewProject).toHaveBeenCalledWith("New Test Project");
    });
  });

  it("should handle project loading", async () => {
    const mockProjectList = [
      {
        id: "project-1",
        name: "Project 1",
        updatedAt: new Date("2023-01-01"),
        size: 1024,
      },
    ];

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      projectList: mockProjectList,
    });

    const mockOnClose = jest.fn();
    render(<ProjectManager isOpen={true} onClose={mockOnClose} />);
    
    // Click load button
    fireEvent.click(screen.getByText("Load"));
    
    await waitFor(() => {
      expect(mockProjectStore.loadProjectById).toHaveBeenCalledWith("project-1");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should handle project deletion", async () => {
    const mockProjectList = [
      {
        id: "project-1",
        name: "Project 1",
        updatedAt: new Date("2023-01-01"),
        size: 1024,
      },
    ];

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      projectList: mockProjectList,
    });

    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    // Click delete button
    fireEvent.click(screen.getByText("Delete"));
    
    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText("Delete Project")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getAllByText("Delete")[1]); // Second delete button in confirmation
    
    await waitFor(() => {
      expect(mockProjectStore.deleteProjectById).toHaveBeenCalledWith("project-1");
    });
  });

  it("should show unsaved changes warning", async () => {
    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      hasUnsavedChanges: true,
    });

    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    // Click new project button
    fireEvent.click(screen.getByText("New Project"));
    
    // Fill in project name
    const nameInput = screen.getByPlaceholderText("Enter project name...");
    fireEvent.change(nameInput, { target: { value: "New Project" } });
    
    // Click create button
    fireEvent.click(screen.getByText("Create"));
    
    // Should show unsaved changes warning
    await waitFor(() => {
      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
      expect(screen.getByText(/Creating a new project will discard unsaved changes/)).toBeInTheDocument();
    });
  });

  it("should display error messages", () => {
    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      error: "Test error message",
    });

    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should handle save current project", async () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-02"),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
    });

    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    // Click save button
    fireEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(mockProjectStore.saveCurrentProject).toHaveBeenCalledWith({
        generateThumbnail: true,
      });
    });
  });

  it("should show empty state when no projects exist", () => {
    render(<ProjectManager isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText("No saved projects found")).toBeInTheDocument();
    expect(screen.getByText("Create a new project to get started")).toBeInTheDocument();
  });
});