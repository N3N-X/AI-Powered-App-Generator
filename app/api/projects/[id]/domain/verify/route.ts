import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

/**
 * @swagger
 * /api/projects/{id}/domain/verify:
 *   post:
 *     summary: Verify custom domain DNS settings
 *     description: Checks if the custom domain has correct DNS records configured.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 },
      );
    }

    if (project.domainVerified) {
      return NextResponse.json({
        verified: true,
        message: "Domain is already verified",
      });
    }

    const domain = project.customDomain;
    const expectedTxtRecord = `rux-verify=${id}`;

    let txtVerified = false;
    let cnameVerified = false;
    const errors: string[] = [];

    // Check TXT record for verification
    try {
      const txtRecords = await resolveTxt(`_rux.${domain}`);
      const flatRecords = txtRecords.flat();
      txtVerified = flatRecords.some((record) =>
        record.includes(expectedTxtRecord),
      );
      if (!txtVerified) {
        errors.push(
          `TXT record found but doesn't match. Expected: ${expectedTxtRecord}`,
        );
      }
    } catch (error: unknown) {
      const dnsError = error as { code?: string };
      if (dnsError.code === "ENODATA" || dnsError.code === "ENOTFOUND") {
        errors.push(`TXT record not found at _rux.${domain}`);
      } else {
        errors.push(
          `Failed to query TXT record: ${dnsError.code || "unknown error"}`,
        );
      }
    }

    // Check CNAME record
    try {
      const cnameRecords = await resolveCname(domain);
      cnameVerified = cnameRecords.some(
        (record) => record.toLowerCase() === "cname.rux.sh",
      );
      if (!cnameVerified) {
        errors.push(
          `CNAME record found but points to wrong target. Expected: cname.rux.sh, Got: ${cnameRecords[0]}`,
        );
      }
    } catch (error: unknown) {
      const dnsError = error as { code?: string };
      if (dnsError.code === "ENODATA" || dnsError.code === "ENOTFOUND") {
        errors.push(`CNAME record not found for ${domain}`);
      } else {
        errors.push(
          `Failed to query CNAME record: ${dnsError.code || "unknown error"}`,
        );
      }
    }

    const verified = txtVerified && cnameVerified;

    if (verified) {
      // Update project as verified
      await prisma.project.update({
        where: { id },
        data: {
          domainVerified: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        verified: true,
        message: "Domain verified successfully!",
        customDomainUrl: `https://${domain}`,
      });
    }

    return NextResponse.json({
      verified: false,
      txtVerified,
      cnameVerified,
      errors,
      message: "Domain verification failed. Please check your DNS settings.",
      requiredRecords: [
        {
          type: "CNAME",
          name: domain,
          value: "cname.rux.sh",
          status: cnameVerified ? "ok" : "missing",
        },
        {
          type: "TXT",
          name: `_rux.${domain}`,
          value: expectedTxtRecord,
          status: txtVerified ? "ok" : "missing",
        },
      ],
    });
  } catch (error) {
    console.error("Failed to verify domain:", error);
    return NextResponse.json(
      { error: "Failed to verify domain" },
      { status: 500 },
    );
  }
}
