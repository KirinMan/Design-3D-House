/**
 * Unit tests for ProjectControls component
 * Tests requirements: 4.2, 4.3, 4.4
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectControls } from "../ProjectControls";
import { useProjectStore } from "../../stores/projectStore";

// Mock the project store
jest.mock("../../stores/projectStore");
const mockUseProjectStore = useProjectStore as jest.MockedFunction<typeof useProjectStore>;

const mockProjectStore = {
  currentProject: null,
  hasUnsavedChanges: false,
  isLoading: false,
  saveCurrentProject: jest.fn(),
};

describe("ProjectControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProjectStore.mockReturnValue(mockProjectStore);
  });

  it("should display 'No project open' when no current project", () => {
    render(<ProjectControls />);
    expect(screen.getByText("No project open")).toBeInTheDocument();
  });

  it("should display current project name", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
    });

    render(<ProjectControls />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("should show unsaved indicator when there are unsaved changes", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
    });

    render(<ProjectControls />);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
  });

  it("should show save button when there are unsaved changes", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
    });

    render(<ProjectControls />);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("should not show save button when no unsaved changes", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: false,
    });

    render(<ProjectControls />);
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("should handle quick save", async () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
    });

    render(<ProjectControls />);
    
    fireEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(mockProjectStore.saveCurrentProject).toHaveBeenCalledWith({
        generateThumbnail: true,
      });
    });
  });

  it("should open project manager when Projects button is clicked", () => {
    render(<ProjectControls />);
    
    fireEvent.click(screen.getByText("Projects"));
    
    // ProjectManager should be rendered (we can check for its title)
    expect(screen.getByText("Project Manager")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
      isLoading: true,
    });

    render(<ProjectControls />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("should disable buttons when loading", () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      sceneData: { objects: [], materials: [], settings: {} as any },
    };

    mockUseProjectStore.mockReturnValue({
      ...mockProjectStore,
      currentProject: mockProject,
      hasUnsavedChanges: true,
      isLoading: true,
    });

    render(<ProjectControls />);
    
    const saveButton = screen.getByText("Saving...");
    const projectsButton = screen.getByText("Projects");
    
    expect(saveButton).toBeDisabled();
    expect(projectsButton).toBeDisabled();
  });
});