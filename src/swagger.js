import swaggerJsdoc from "swagger-jsdoc";

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
        url: "http://localhost:4000/api/v1", // Primary base URL
        description: "Development Server",
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