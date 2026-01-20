"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import {
  Sparkles,
  Plus,
  Folder,
  ArrowRight,
  Zap,
  Code2,
  Smartphone,
} from "lucide-react";
import { slugify, generateId } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const templates = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch with a minimal setup",
    icon: Plus,
  },
  {
    id: "todo",
    name: "Todo App",
    description: "A simple todo list with local storage",
    icon: Folder,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Product listing with cart functionality",
    icon: Smartphone,
  },
  {
    id: "social",
    name: "Social Feed",
    description: "Instagram-like feed with posts and likes",
    icon: Code2,
  },
];

export function WelcomeScreen() {
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { addProject, setCurrentProject } = useProjectStore();

  const handleCreateProject = async (templateId: string = "blank") => {
    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          template: templateId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      addProject(data.project);
      setCurrentProject(data.project);

      toast({
        title: "Project created",
        description: `${projectName} is ready to go!`,
      });
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Welcome to RUX
          </h1>
          <p className="text-gray-600 dark:text-slate-400 max-w-md mx-auto">
            Create a new project to start building your mobile app with AI
            assistance.
          </p>
        </div>

        {/* Project creation form */}
        <Card glass className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Project Name
              </label>
              <div className="flex gap-3">
                <Input
                  placeholder="My Awesome App"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateProject();
                    }
                  }}
                />
                <Button
                  variant="gradient"
                  onClick={() => handleCreateProject()}
                  disabled={isCreating || !projectName.trim()}
                  className="gap-2"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Create
                </Button>
              </div>
            </div>

            {/* Templates */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Or start with a template
              </label>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      if (!projectName.trim()) {
                        setProjectName(template.name);
                      }
                      handleCreateProject(template.id);
                    }}
                    disabled={isCreating}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-violet-500/20 transition-colors">
                      <template.icon className="h-5 w-5 text-slate-400 group-hover:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">
                        {template.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {template.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick tips */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-slate-500">
            Tip: Describe your app in natural language and let AI generate the
            code for you.
          </p>
        </div>
      </div>
    </div>
  );
}
