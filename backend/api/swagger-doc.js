export default {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Presto CRUD Server",
    description: "Server that powers the Presto frontend",
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  tags: [
    {
      name: "Admin Auth",
      description: "Managing admin authentication and authorisation"
    },
    {
      name: "Data Store Management",
      description: "Managing the data store for a particular user"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      AuthToken: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "Authorization Bearer Token"
          }
        }
      },
      Email: {
        type: "string",
        example: "hayden@unsw.edu.au",
        description: "Email address of the admin attempting to login"
      },
      Password: {
        type: "string",
        description: "Password of the admin attempting to login",
        example: "adummypassword"
      },
      Admin: {
        type: "string",
        description: "Name (single or full name) of the admin registering",
        example: "Harry Jenkins"
      },
      Store: {
        type: "object",
        properties: {
          ALL: { type: "string", example: "THE" },
          DATA: { type: "string", example: "HERE IN CAPS" },
          "CAN BE": { type: "number", example: 100000 },
          DIFFERENT: {
            type: "object",
            example: {
              "THINGS.": "IT CAN",
              LITERALLY: "BE",
              ANYTHING: {
                YOU: "WANT",
                IT: "TO BE",
                AND: {
                  AS: "NESTED",
                  "AS YOU": "WOULD LIKE!"
                }
              }
            }
          },
          "THIS WILL BE": {
            type: "array",
            example: ["PERSONAL", "TO", "YOUR", "OWN", "WORK"]
          }
        }
      },
      RegisterRequest: {
        type: "object",
        properties: {
          email: { $ref: "#/components/schemas/Email" },
          password: { $ref: "#/components/schemas/Password" },
          name: { $ref: "#/components/schemas/Admin" }
        },
        required: ["email", "password", "name"]
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { $ref: "#/components/schemas/Email" },
          password: { $ref: "#/components/schemas/Password" }
        },
        required: ["email", "password"]
      }
    },
    responses: {
      400: {
        description: "Bad Input",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  description: "Error message returned from server",
                  example: "Invalid input"
                }
              }
            }
          }
        }
      },
      403: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  description: "Error message returned from server",
                  example: "Invalid Token"
                }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/admin/auth/register": {
      post: {
        summary: "Send registration request for someone to join Presto",
        tags: ["Admin Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthToken" }
              }
            }
          },
          400: { $ref: "#/components/responses/400" }
        }
      }
    },
    "/admin/auth/login": {
      post: {
        summary: "Given correct credentials, return an authorised access token",
        tags: ["Admin Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthToken" }
              }
            }
          },
          400: { $ref: "#/components/responses/400" }
        }
      }
    },
    "/admin/auth/logout": {
      post: {
        summary: "Invalidate a particular authorised token",
        security: [{ bearerAuth: [] }],
        tags: ["Admin Auth"],
        parameters: [
          {
            name: "Authorization",
            in: "header",
            schema: { type: "string" },
            required: true,
            description: "Bearer [token]"
          }
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: {} }
              }
            }
          },
          403: { $ref: "#/components/responses/403" }
        }
      }
    },
    "/store": {
      get: {
        summary: "Read the data store for a particular user",
        security: [{ bearerAuth: [] }],
        tags: ["Data Store Management"],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { store: { $ref: "#/components/schemas/Store" } }
                }
              }
            }
          },
          403: { $ref: "#/components/responses/403" }
        }
      },
      put: {
        summary: "Set the data store for a particular user",
        security: [{ bearerAuth: [] }],
        tags: ["Data Store Management"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { store: { $ref: "#/components/schemas/Store" } }
              }
            }
          }
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: {} }
              }
            }
          },
          400: { $ref: "#/components/responses/400" },
          403: { $ref: "#/components/responses/403" }
        }
      }
    }
  }
};