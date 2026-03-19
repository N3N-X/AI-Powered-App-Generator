export interface Build {
  id: string;
  platform: "ANDROID" | "IOS";
  status:
    | "PENDING"
    | "QUEUED"
    | "BUILDING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED";
  buildProfile: string;
  version: string | null;
  buildNumber: number | null;
  artifactUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  easBuildId: string | null;
  buildUrl: string | null;
  project: {
    id: string;
    name: string;
  };
}
