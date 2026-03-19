"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Hammer,
  Smartphone,
  Apple,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
} from "lucide-react";
import type { Build } from "./types";

interface Project {
  id: string;
  name: string;
}

interface BuildListProps {
  projects: Project[];
  filterProjectId: string;
  setFilterProjectId: (id: string) => void;
  builds: Build[];
  loading: boolean;
  publishingBuildId: string | null;
  publishToStore: (build: Build) => void;
}

function getStatusIcon(status: Build["status"]) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "FAILED":
    case "CANCELLED":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "BUILDING":
      return <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />;
    default:
      return <Clock className="h-5 w-5 text-slate-400" />;
  }
}

function getStatusColor(status: Build["status"]) {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "BUILDING":
      return "warning";
    default:
      return "secondary";
  }
}

export function BuildFilter({
  projects,
  filterProjectId,
  setFilterProjectId,
}: Pick<BuildListProps, "projects" | "filterProjectId" | "setFilterProjectId">) {
  return (
    <Card className="liquid-glass-card">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Filter by project:</span>
          <Select
            value={filterProjectId}
            onValueChange={setFilterProjectId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export function BuildList({
  builds,
  loading,
  publishingBuildId,
  publishToStore,
}: Pick<BuildListProps, "builds" | "loading" | "publishingBuildId" | "publishToStore">) {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Hammer className="h-5 w-5" />
          Build History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 text-violet-400 animate-spin" />
            <p className="text-slate-400">Loading builds...</p>
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-8">
            <Hammer className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400 mb-2">No builds yet</p>
            <p className="text-sm text-slate-500">
              Start a build to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {builds.map((build) => (
              <div
                key={build.id}
                className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(build.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {build.project.name}
                        </span>
                        <Badge
                          variant={
                            build.platform === "IOS"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {build.platform === "IOS" ? (
                            <>
                              <Apple className="h-3 w-3 mr-1" /> iOS
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-3 w-3 mr-1" />{" "}
                              Android
                            </>
                          )}
                        </Badge>
                        <Badge
                          variant={
                            getStatusColor(build.status) as
                              | "success"
                              | "destructive"
                              | "secondary"
                              | "default"
                          }
                        >
                          {build.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>Profile: {build.buildProfile}</span>
                        {build.version && <span>v{build.version}</span>}
                        <span>
                          {new Date(build.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {build.status === "BUILDING" && (
                        <Progress value={45} className="mt-2 w-48" />
                      )}
                      {build.errorMessage && (
                        <p className="mt-2 text-sm text-red-400">
                          {build.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  {build.status === "SUCCESS" && build.artifactUrl && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publishToStore(build)}
                        disabled={publishingBuildId === build.id}
                        className="gap-1"
                      >
                        {publishingBuildId === build.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {build.platform === "IOS"
                          ? "Publish to App Store"
                          : "Publish to Play Store"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={build.artifactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
