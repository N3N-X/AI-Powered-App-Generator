export const EAS_GRAPHQL_URL = "https://api.expo.dev/graphql";

export function getEASToken(): string {
  const token = process.env.EAS_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "EAS_ACCESS_TOKEN is not configured. Set it in environment variables.",
    );
  }
  return token;
}

export function getExpoProjectId(): string {
  const id = process.env.EXPO_PROJECT_ID;
  if (!id) {
    throw new Error(
      "EXPO_PROJECT_ID is not configured. Set it in environment variables.",
    );
  }
  return id;
}

export async function easGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const response = await fetch(EAS_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EAS API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors
      .map((e: { message: string }) => e.message)
      .join("; ");
    throw new Error(`EAS GraphQL error: ${errorMessages}`);
  }

  return result.data;
}

export const BUILD_FRAGMENT = `
  fragment BuildFragment on Build {
    id
    status
    platform
    createdAt
    updatedAt
    artifacts {
      applicationArchiveUrl
      buildUrl
    }
    error {
      message
      errorCode
    }
  }
`;
