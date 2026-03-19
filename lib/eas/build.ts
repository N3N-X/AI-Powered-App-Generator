import { BuildRequest } from "./types";
import { getEASToken, getExpoProjectId, easGraphQL, BUILD_FRAGMENT } from "./client";
import { createProjectArchive, uploadProjectArchive } from "./archive";
import { fetchPlatformAndroidKeystore, fetchPlatformIosCredentials } from "./credentials";

/**
 * Trigger an EAS Build using the real EAS GraphQL API.
 *
 * Flow:
 * 1. Create project archive (tar.gz)
 * 2. Upload to EAS via signed GCS URL
 * 3. Fetch platform signing credentials from EAS
 * 4. Assemble build job with embedded credentials
 * 5. Submit via CreateAndroidBuildMutation / CreateIosBuildMutation
 */
export async function triggerEASBuild(
  request: BuildRequest,
): Promise<{ buildId: string; buildUrl: string }> {
  const token = getEASToken();
  const projectId = getExpoProjectId();
  const platform = request.platform.toLowerCase();

  // Step 1: Create project archive
  const archive = await createProjectArchive(request.codeFiles);

  // Step 2: Upload archive to EAS
  const bucketKey = await uploadProjectArchive(archive, token);

  // Step 3: Build the job object based on platform
  if (platform === "android") {
    return triggerAndroidBuild(token, projectId, bucketKey, request);
  } else {
    return triggerIosBuild(token, projectId, bucketKey, request);
  }
}

async function triggerAndroidBuild(
  token: string,
  projectId: string,
  bucketKey: string,
  request: BuildRequest,
): Promise<{ buildId: string; buildUrl: string }> {
  // Fetch platform keystore from EAS
  const keystore = await fetchPlatformAndroidKeystore(token, projectId);

  // Determine build type based on profile
  const isProduction = request.profile === "production";
  const buildType = isProduction ? "APP_BUNDLE" : "APK";
  const gradleCommand = isProduction
    ? ":app:bundleRelease"
    : request.profile === "development"
      ? ":app:assembleDebug"
      : ":app:assembleRelease";

  // Assemble Android build job
  const job: Record<string, unknown> = {
    type: "GENERIC",
    projectArchive: {
      type: "GCS",
      bucketKey,
    },
    projectRootDirectory: ".",
    builderEnvironment: {
      image: "default",
      node: "18.18.0",
      env: {},
    },
    cache: {
      disabled: false,
      paths: [],
    },
    buildType,
    gradleCommand,
  };

  // Embed platform signing credentials if available
  if (keystore) {
    job.secrets = {
      buildCredentials: {
        keystore: {
          dataBase64: keystore.dataBase64,
          keystorePassword: keystore.keystorePassword,
          keyAlias: keystore.keyAlias,
          keyPassword: keystore.keyPassword,
        },
      },
    };
  }

  const mutation = `
    mutation CreateAndroidBuildMutation(
      $appId: ID!
      $job: AndroidJobInput!
      $metadata: BuildMetadataInput
      $buildParams: BuildParamsInput
    ) {
      build {
        createAndroidBuild(
          appId: $appId
          job: $job
          metadata: $metadata
          buildParams: $buildParams
        ) {
          build {
            id
            status
            platform
            ...BuildFragment
          }
          deprecationInfo {
            type
            message
          }
        }
      }
    }
    ${BUILD_FRAGMENT}
  `;

  const metadata = {
    trackingContext: {
      platform: "android",
      buildProfile: request.profile,
    },
    appName: request.appConfig.name,
    appVersion: request.appConfig.version || "1.0.0",
    workflow: "GENERIC",
    credentialsSource: keystore ? "REMOTE" : "LOCAL",
    distribution: request.profile === "production" ? "STORE" : "INTERNAL",
    buildProfile: request.profile,
  };

  const data = await easGraphQL<{
    build: {
      createAndroidBuild: {
        build: {
          id: string;
          status: string;
          platform: string;
          artifacts?: { buildUrl?: string };
        };
        deprecationInfo?: { type: string; message: string };
      };
    };
  }>(
    mutation,
    {
      appId: projectId,
      job,
      metadata,
      buildParams: { resourceClass: "ANDROID_DEFAULT" },
    },
    token,
  );

  const build = data.build.createAndroidBuild.build;
  const buildUrl = `https://expo.dev/accounts/rux/projects/${projectId}/builds/${build.id}`;

  return {
    buildId: build.id,
    buildUrl,
  };
}

async function triggerIosBuild(
  token: string,
  projectId: string,
  bucketKey: string,
  request: BuildRequest,
): Promise<{ buildId: string; buildUrl: string }> {
  // Fetch platform iOS credentials from EAS
  const iosCredentials = await fetchPlatformIosCredentials(token, projectId);

  const bundleIdentifier =
    request.appConfig.ios?.bundleIdentifier ||
    `com.rux.${request.appConfig.slug}`;

  // Assemble iOS build job
  const job: Record<string, unknown> = {
    type: "GENERIC",
    projectArchive: {
      type: "GCS",
      bucketKey,
    },
    projectRootDirectory: ".",
    builderEnvironment: {
      image: "default",
      node: "18.18.0",
      env: {},
    },
    cache: {
      disabled: false,
      paths: [],
    },
    scheme: request.appConfig.name,
    buildConfiguration: request.profile === "development" ? "Debug" : "Release",
    distribution: request.profile === "production" ? "APP_STORE" : "INTERNAL",
  };

  // Embed platform signing credentials if available
  if (iosCredentials) {
    job.secrets = {
      buildCredentials: {
        distributionCertificate: {
          dataBase64: iosCredentials.distributionCertificate.dataBase64,
          password: iosCredentials.distributionCertificate.password,
        },
        provisioningProfileBase64:
          iosCredentials.provisioningProfile.dataBase64,
      },
    };
  }

  const mutation = `
    mutation CreateIosBuildMutation(
      $appId: ID!
      $job: IosJobInput!
      $metadata: BuildMetadataInput
      $buildParams: BuildParamsInput
    ) {
      build {
        createIosBuild(
          appId: $appId
          job: $job
          metadata: $metadata
          buildParams: $buildParams
        ) {
          build {
            id
            status
            platform
            ...BuildFragment
          }
          deprecationInfo {
            type
            message
          }
        }
      }
    }
    ${BUILD_FRAGMENT}
  `;

  const metadata = {
    trackingContext: {
      platform: "ios",
      buildProfile: request.profile,
    },
    appName: request.appConfig.name,
    appVersion: request.appConfig.version || "1.0.0",
    appIdentifier: bundleIdentifier,
    workflow: "GENERIC",
    credentialsSource: iosCredentials ? "REMOTE" : "LOCAL",
    distribution: request.profile === "production" ? "STORE" : "INTERNAL",
    buildProfile: request.profile,
  };

  const data = await easGraphQL<{
    build: {
      createIosBuild: {
        build: {
          id: string;
          status: string;
          platform: string;
          artifacts?: { buildUrl?: string };
        };
        deprecationInfo?: { type: string; message: string };
      };
    };
  }>(
    mutation,
    {
      appId: projectId,
      job,
      metadata,
      buildParams: { resourceClass: "IOS_DEFAULT" },
    },
    token,
  );

  const build = data.build.createIosBuild.build;
  const buildUrl = `https://expo.dev/accounts/rux/projects/${projectId}/builds/${build.id}`;

  return {
    buildId: build.id,
    buildUrl,
  };
}
