import { z } from "zod";

export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
export const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;

// Reserved subdomains that can't be used
export const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "mail",
  "email",
  "help",
  "support",
  "docs",
  "blog",
  "status",
  "cdn",
  "static",
  "assets",
  "dev",
  "staging",
  "prod",
  "test",
];

export const updateDomainSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(SUBDOMAIN_REGEX, "Invalid subdomain format")
    .optional()
    .nullable(),
  customDomain: z
    .string()
    .max(253)
    .regex(DOMAIN_REGEX, "Invalid domain format")
    .optional()
    .nullable(),
});

/** Build the domain response payload */
export function buildDomainResponse(project: {
  subdomain: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  id?: string;
}) {
  return {
    subdomain: project.subdomain,
    customDomain: project.custom_domain,
    domainVerified: project.domain_verified,
    subdomainUrl: project.subdomain
      ? `https://${project.subdomain}.rulxy.com`
      : null,
    customDomainUrl: project.custom_domain
      ? `https://${project.custom_domain}`
      : null,
  };
}

/** Build DNS records for unverified custom domains */
export function buildDnsRecords(customDomain: string, projectId: string) {
  return [
    {
      type: "CNAME",
      name: customDomain,
      value: "cname.rulxy.com",
      ttl: 300,
    },
    {
      type: "TXT",
      name: `_rux.${customDomain}`,
      value: `rux-verify=${projectId}`,
      ttl: 300,
    },
  ];
}
