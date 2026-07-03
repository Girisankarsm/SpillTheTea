export function mongodbUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is required for MongoDB Atlas.");
  }
  return uri;
}

export function mongodbDbName(): string {
  return process.env.MONGODB_DB?.trim() || "spillthetea";
}

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim().replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}
