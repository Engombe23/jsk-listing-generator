import express from "express";
import multer from "multer";
import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

const VALID_SUBJECTS = new Set([
  "General Question",
  "Technical Support",
  "Bug Report",
  "Feature Request",
  "Billing & Subscription",
  "Partnership Enquiry",
  "Other",
]);

function generateReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

router.post("/contact", upload.single("attachment"), async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim())) {
    return res.status(400).json({ error: "Valid email is required." });
  }
  if (!VALID_SUBJECTS.has(subject)) {
    return res.status(400).json({ error: "Invalid subject." });
  }
  const trimmedMessage = (message || "").trim();
  if (trimmedMessage.length < 10) {
    return res.status(400).json({ error: "Message must be at least 10 characters." });
  }
  if (trimmedMessage.length > 5000) {
    return res.status(400).json({ error: "Message must be under 5000 characters." });
  }

  // Derive user_id from Authorization header — never trust body
  let userId = null;
  const token = (req.headers.authorization || "").startsWith("Bearer ")
    ? req.headers.authorization.slice(7) : null;
  if (token && supabaseAdminReady) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data?.user) userId = data.user.id;
  }

  const reference = generateReference();

  if (!supabaseAdminReady) {
    console.error("[contact] Supabase not configured — cannot store submission.");
    return res.status(503).json({ error: "Contact form is temporarily unavailable." });
  }

  const { error: dbError } = await supabaseAdmin.from("contact_submissions").insert({
    reference,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject,
    message: trimmedMessage,
    user_id: userId,
    has_attachment: !!req.file,
  });

  if (dbError) {
    console.error("[contact] Supabase insert error:", dbError.message);
    return res.status(500).json({ error: "Failed to save your message. Please try again." });
  }

  // Optional email notification (no-op if RESEND_API_KEY not set)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "PartLister Contact <noreply@partlister.app>",
        to: ["aaron@partlister.app"],
        subject: `[Contact #${reference}] ${subject} — ${name.trim()}`,
        text: `Reference: ${reference}\nName: ${name.trim()}\nEmail: ${email.trim()}\nSubject: ${subject}\n\n${trimmedMessage}`,
      });
    } catch (err) {
      // Email failure is non-fatal — submission is already stored
      console.error("[contact] Email notification failed:", err.message);
    }
  }

  res.json({ reference });
});

export default router;
