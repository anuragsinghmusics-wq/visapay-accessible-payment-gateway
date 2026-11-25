import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[VisaPay] Server running on http://localhost:${PORT}`);
  console.log(`[VisaPay] Health endpoint: http://localhost:${PORT}/api/health`);
});

