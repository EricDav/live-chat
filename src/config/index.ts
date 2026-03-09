import * as dotenv from 'dotenv';
import * as joi from 'joi';

dotenv.config();

// validating environment variables
const schema = joi
  .object({
    PORT: joi.number().required(),
    NODE_ENV: joi
      .string()
      .valid('development', 'production', 'staging')
      .required(),
    // database configs
    DBHOST: joi.string().required(),
    DBUSER: joi.string().required(),
    DBPASSWORD: joi.string().required(),
    DATABASE: joi.string().required(),
    SECRET_KEY: joi.string().required(),
    DATABASE_PORT: joi.string().required(),
    DATABASE_LOGGING: joi
      .boolean()
      .truthy('TRUE')
      .truthy('true')
      .falsy('FALSE')
      .falsy('false')
      .default(false),
  })
  .unknown()
  .required();

const { error, value: envVars } = schema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  isProduction: envVars.NODE_ENV === 'production' ? true : false,
  isDevelopment: envVars.NODE_ENV === 'development' ? true : false,
  isLocahost: envVars.NODE_ENV === 'local' ? true : false,
  port: {
    http: envVars.PORT,
  },
  NODE_ENV: envVars.NODE_ENV,
  secretKey: envVars.SECRET_KEY,
  db: {
    port: envVars.DATABASE_PORT,
    host: envVars.DBHOST,
    username: envVars.DBUSER,
    password: envVars.DBPASSWORD,
    name: envVars.DATABASE,
    logging: envVars.DATABASE_LOGGING,
  },
};
