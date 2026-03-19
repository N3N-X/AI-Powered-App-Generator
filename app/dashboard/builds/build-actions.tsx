"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { CREDIT_COSTS } from "@/types";
import { Smartphone, Apple, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface BuildActionsProps {
  projects: Project[];
  buildProjectId: string;
  setBuildProjectId: (id: string) => void;
  startBuild: (platform: "ANDROID" | "IOS") => void;
  startingBuild: boolean;
  checkingBuild: boolean;
  pendingPlatform: "ANDROID" | "IOS" | null;
  hasEnoughCredits: (platform: "ANDROID" | "IOS") => boolean;
  userCredits: number;
}

export function BuildActions({
  projects,
  buildProjectId,
  setBuildProjectId,
  startBuild,
  startingBuild,
  checkingBuild,
  pendingPlatform,
  hasEnoughCredits,
  userCredits,
}: BuildActionsProps) {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="text-white">New Build</CardTitle>
        <CardDescription className="text-slate-400">
          Select a project and platform to start a build
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              value={buildProjectId}
              onValueChange={setBuildProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project to build" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => startBuild("ANDROID")}
            disabled={
              startingBuild ||
              checkingBuild ||
              !buildProjectId ||
              !hasEnoughCredits("ANDROID")
            }
            className="gap-2"
          >
            {checkingBuild && pendingPlatform === "ANDROID" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : startingBuild && pendingPlatform === "ANDROID" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4" />
                Build Android APK
              </>
            )}
          </Button>
          <Button
            onClick={() => startBuild("IOS")}
            disabled={
              startingBuild ||
              checkingBuild ||
              !buildProjectId ||
              !hasEnoughCredits("IOS")
            }
            variant="outline"
            className="gap-2"
          >
            {checkingBuild && pendingPlatform === "IOS" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : startingBuild && pendingPlatform === "IOS" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Apple className="h-4 w-4" />
                Build iOS IPA
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Android builds cost {CREDIT_COSTS.buildAndroid} credits. iOS
          builds cost {CREDIT_COSTS.buildIOS} credits. You have{" "}
          <span className="text-white font-medium">
            {userCredits.toLocaleString()}
          </span>{" "}
          credits available.
        </p>
      </CardContent>
    </Card>
  );
}
