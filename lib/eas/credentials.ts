import { easGraphQL } from "./client";

/**
 * Fetch the platform's Android keystore from EAS servers.
 * The keystore is managed under Rulxy's Expo account (set up once via `eas credentials`).
 */
export async function fetchPlatformAndroidKeystore(
  token: string,
  appId: string,
): Promise<{
  dataBase64: string;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
} | null> {
  const query = `
    query GetAndroidAppCredentials($appId: String!) {
      app {
        byId(appId: $appId) {
          id
          androidAppCredentials {
            androidAppBuildCredentialsList {
              isDefault
              androidKeystore {
                id
                keystore
                keystorePassword
                keyAlias
                keyPassword
                type
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await easGraphQL<{
      app: {
        byId: {
          id: string;
          androidAppCredentials: Array<{
            androidAppBuildCredentialsList: Array<{
              isDefault: boolean;
              androidKeystore: {
                id: string;
                keystore: string;
                keystorePassword: string;
                keyAlias: string;
                keyPassword: string | null;
                type: string;
              } | null;
            }>;
          }>;
        };
      };
    }>(query, { appId }, token);

    const appCredentials = data.app.byId.androidAppCredentials;
    if (!appCredentials || appCredentials.length === 0) return null;

    // Find the default build credentials with a keystore
    for (const cred of appCredentials) {
      for (const buildCred of cred.androidAppBuildCredentialsList) {
        if (buildCred.androidKeystore) {
          return {
            dataBase64: buildCred.androidKeystore.keystore,
            keystorePassword: buildCred.androidKeystore.keystorePassword,
            keyAlias: buildCred.androidKeystore.keyAlias,
            keyPassword:
              buildCred.androidKeystore.keyPassword ||
              buildCred.androidKeystore.keystorePassword,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch platform Android keystore:", error);
    return null;
  }
}

/**
 * Fetch the platform's iOS distribution certificate and provisioning profile.
 * These are managed under Rulxy's Expo account.
 */
export async function fetchPlatformIosCredentials(
  token: string,
  appId: string,
): Promise<{
  distributionCertificate: {
    dataBase64: string;
    password: string;
  };
  provisioningProfile: {
    dataBase64: string;
  };
} | null> {
  const query = `
    query GetIosAppCredentials($appId: String!) {
      app {
        byId(appId: $appId) {
          id
          iosAppCredentials {
            iosAppBuildCredentialsList {
              iosDistributionType
              distributionCertificate {
                id
                certificateP12
                certificatePassword
                serialNumber
              }
              provisioningProfile {
                id
                provisioningProfile
                developerPortalIdentifier
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await easGraphQL<{
      app: {
        byId: {
          id: string;
          iosAppCredentials: Array<{
            iosAppBuildCredentialsList: Array<{
              iosDistributionType: string;
              distributionCertificate: {
                id: string;
                certificateP12: string;
                certificatePassword: string;
                serialNumber: string;
              } | null;
              provisioningProfile: {
                id: string;
                provisioningProfile: string;
                developerPortalIdentifier: string | null;
              } | null;
            }>;
          }>;
        };
      };
    }>(query, { appId }, token);

    const appCredentials = data.app.byId.iosAppCredentials;
    if (!appCredentials || appCredentials.length === 0) return null;

    for (const cred of appCredentials) {
      for (const buildCred of cred.iosAppBuildCredentialsList) {
        if (
          buildCred.distributionCertificate &&
          buildCred.provisioningProfile
        ) {
          return {
            distributionCertificate: {
              dataBase64: buildCred.distributionCertificate.certificateP12,
              password: buildCred.distributionCertificate.certificatePassword,
            },
            provisioningProfile: {
              dataBase64: buildCred.provisioningProfile.provisioningProfile,
            },
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch platform iOS credentials:", error);
    return null;
  }
}
