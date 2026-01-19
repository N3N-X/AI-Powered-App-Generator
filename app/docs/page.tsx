"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function DocsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">RUX API Documentation</h1>
      <SwaggerUI
        url="/api/docs"
        deepLinking={true}
        displayRequestDuration={true}
      />
    </div>
  );
}
