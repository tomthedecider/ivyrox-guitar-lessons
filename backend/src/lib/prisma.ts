import { PrismaClient } from "@prisma/client";

// Assignment.recording holds a practice-clip audio blob. Every existing
// query in the route handlers uses `include`, which pulls all scalar
// columns by default — without this, the recording bytes would get
// JSON-serialized into every assignment list/detail response. Omitting it
// here means those queries stay untouched; only the recording-download
// route explicitly selects it back.
export const prisma = new PrismaClient({
  omit: { assignment: { recording: true } },
});
