import { BuildPlatform, CodeFiles, AppConfig } from "@/types";

export interface BuildRequest {
  platform: BuildPlatform;
  profile: "development" | "preview" | "production";
  codeFiles: CodeFiles;
  appConfig: AppConfig;
}

export interface SubmissionCredentials {
  apple?: { keyId: string; issuerId: string; p8Key: string };
  google?: { serviceAccountJson: string };
}
