import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RUX API",
      version: "1.0.0",
      description: "API documentation for RUX project",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://yourdomain.com"
            : "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
  },
  apis: [path.join(process.cwd(), "app/api/**/*.ts")],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
