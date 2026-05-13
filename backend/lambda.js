/**
 * AWS Lambda + API Gateway Handler
 *
 * Wraps the Express app using `serverless-http` so it can run on Lambda
 * without changing any application code.
 *
 * Install: npm install serverless-http
 *
 * serverless.yml snippet:
 *   functions:
 *     api:
 *       handler: lambda.handler
 *       events:
 *         - http:
 *             path: /{proxy+}
 *             method: ANY
 *             cors: true
 */

require("dotenv").config();

const serverless = require("serverless-http");
const app = require("./src/app");
const connectDB = require("./src/config/database");
const logger = require("./src/utils/logger");

// Cache DB connection across warm Lambda invocations
let isConnected = false;

const handler = async (event, context) => {
  // Tell Lambda not to wait for the event loop to drain
  // (avoids hanging on MongoDB keep-alive connections)
  context.callbackWaitsForEmptyEventLoop = false;

  if (!isConnected) {
    await connectDB();
    isConnected = true;
    logger.info("Lambda: DB connection established");
  }

  return serverless(app)(event, context);
};

module.exports = { handler };
