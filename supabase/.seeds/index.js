import { seedMessages } from "./email-seeds.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.DEV_ONLY_SUPABASE_URL,
  process.env.DEV_ONLY_SUPABASE_SERVICE_ROLE_KEY
);

const util = {
  randomDateInLastNDays: (daysBack) => {
    const now = new Date();
    const pastTime = now.getTime() - daysBack * 24 * 60 * 60 * 1000;
    const randomTime = Math.random() * (now.getTime() - pastTime);
    const randomDate = new Date(pastTime + randomTime);
    return randomDate.toISOString();
  },
};

seedMessages(supabase, util)
  .then(() => console.log("🎉 Seeding complete!"))
  .catch((err) => console.error("❌ Seeding failed:", err));
