const User = require("../models/User");

// Guarantees the owner's super-admin account exists, using ADMIN_EMAIL / ADMIN_PASSWORD
// from the environment (kept out of source control). Runs on every startup.
async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set. Skipping admin account setup.");
    return;
  }

  try {
    const existing = await User.findOne({ email });

    if (!existing) {
      await new User({ name: "Admin", email, password, role: "super-admin" }).save();
      console.log(`Super-admin account created for ${email}.`);
      return;
    }

    if (existing.role !== "super-admin") {
      // Someone else could have signed up with this email first — reclaim it with the configured password
      existing.role = "super-admin";
      existing.status = "active";
      existing.password = password;
      await existing.save();
      console.log(`Existing account ${email} promoted to super-admin.`);
    }
  } catch (err) {
    console.error("Admin account setup failed:", err.message);
  }
}

module.exports = ensureAdmin;
