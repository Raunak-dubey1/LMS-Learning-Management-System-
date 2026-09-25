const requiredInProduction = ["MONGO_URI"];

export const validateEnv = () => {
  const jwtSecret = process.env.JWT_SECRET || "";
  const missing = requiredInProduction.filter((name) => !process.env[name]);

  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  if (process.env.NODE_ENV === "production" && missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
};
