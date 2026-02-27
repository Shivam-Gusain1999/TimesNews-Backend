import swaggerJsdoc from "swagger-jsdoc";

// Dynamically resolve API base URL for Swagger
const getServerUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // Render auto-injects RENDER_EXTERNAL_URL; fallback to BASE_URL env var
    const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || "http://localhost:4000";
    return `${baseUrl}/api/v1`;
  }
  return `http://localhost:${process.env.PORT || 4000}/api/v1`;
};

const options = {
  definition: {
    openapi: "3.0.0", // Standard Swagger OpenAPI version
    info: {
      title: "Times News Pro API", // Project Title
      version: "1.0.0",
      description: "API Documentation for News Portal Application", // Brief summary
      contact: {
        name: "Shivam Gusain", // Lead Developer
        email: "shivam@example.com",
      },
    },
    servers: [
      {
        url: getServerUrl(),
        description: process.env.NODE_ENV === "production" ? "Production Server" : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Directory patterns where Swagger will scan for annotated APIs
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;