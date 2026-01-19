"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/stores/project-store";
import { toast } from "@/hooks/use-toast";

export function useProjects() {
  const {
    projects,
    currentProject,
    setProjects,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    setIsSaving,
  } = useProjectStore();

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [setProjects]);

  const createProject = useCallback(
    async (name: string, template?: string) => {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, template }),
        });

        if (!response.ok) throw new Error("Failed to create project");

        const data = await response.json();
        addProject(data.project);
        setCurrentProject(data.project);

        toast({
          title: "Project created",
          description: `${name} is ready!`,
        });

        return data.project;
      } catch (error) {
        console.error("Failed to create project:", error);
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        });
        return null;
      }
    },
    [addProject, setCurrentProject]
  );

  const saveProject = useCallback(async () => {
    if (!currentProject) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeFiles: currentProject.codeFiles,
          appConfig: currentProject.appConfig,
        }),
      });

      if (!response.ok) throw new Error("Failed to save project");

      toast({
        title: "Saved",
        description: "Project saved successfully",
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, setIsSaving]);

  const removeProject = useCallback(
    async (projectId: string) => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete project");

        deleteProject(projectId);

        if (currentProject?.id === projectId) {
          setCurrentProject(null);
        }

        toast({
          title: "Project deleted",
        });
      } catch (error) {
        console.error("Failed to delete project:", error);
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    },
    [currentProject, deleteProject, setCurrentProject]
  );

  const exportProject = useCallback(async () => {
    if (!currentProject) return;

    try {
      const response = await fetch(
        `/api/export?projectId=${currentProject.id}`
      );

      if (!response.ok) throw new Error("Failed to export project");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject.slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Project downloaded as ZIP",
      });
    } catch (error) {
      console.error("Failed to export project:", error);
      toast({
        title: "Error",
        description: "Failed to export project",
        variant: "destructive",
      });
    }
  }, [currentProject]);

  return {
    projects,
    currentProject,
    fetchProjects,
    createProject,
    saveProject,
    removeProject,
    exportProject,
    setCurrentProject,
  };
}
