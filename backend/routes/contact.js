import express       from "express";
import multer        from "multer";
import crypto        from "crypto";
import { Resend }   from "resend";
import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";

const router = express.Router();

const RESEND_KEY      = process.env.RESEND_API_KEY;
const SUPPORT_EMAIL   = process.env.CONTACT_TO_EMAIL   || "support@partlister.app";
const FROM_EMAIL      = process.env.CONTACT_FROM_EMAIL || "PartLister <support@partlister.app>";
const resend          = RESEND_KEY ? new Resend(RESEND_KEY) : null;

const VALID_SUBJECTS = new Set([
  "General Question", "Technical Support", "Bug Report",
  "Feature Request", "Billing & Subscription", "Partnership Enquiry", "Other",
]);

// ── File upload ──────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf",
      "application/zip", "application/x-zip-compressed", "application/x-zip",
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error("Only images, PDF, and ZIP files are accepted."), { code: "INVALID_FILE_TYPE" }));
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateReference() {
  return `PL-${crypto.randomInt(100_000, 999_999)}`;
}

function parseUserAgent(ua = "") {
  const u = ua.toLowerCase();
  const browser =
    u.includes("edg")     ? "Edge"    :
    u.includes("chrome")  ? "Chrome"  :
    u.includes("firefox") ? "Firefox" :
    u.includes("safari")  ? "Safari"  : "Unknown";
  const os =
    u.includes("windows") ? "Windows" :
    u.includes("mac")     ? "macOS"   :
    u.includes("linux")   ? "Linux"   :
    u.includes("android") ? "Android" :
    u.includes("iphone") || u.includes("ipad") ? "iOS" : "Unknown";
  return { browser, os };
}

// ── Route ────────────────────────────────────────────────────────────────────
router.post(
  "/contact",
  (req, res, next) => {
    upload.single("attachment")(req, res, (err) => {
      if (!err) return next();
      const msg =
        err.code === "LIMIT_FILE_SIZE"   ? "Attachment is too large. Maximum size is 10 MB." :
        err.code === "INVALID_FILE_TYPE" ? err.message :
                                           "Upload failed. Please try again.";
      return res.status(400).json({ error: msg });
    });
  },
  async (req, res) => {
    const name    = (req.body.name    ?? "").trim();
    const email   = (req.body.email   ?? "").trim().toLowerCase();
    const subject = (req.body.subject ?? "").trim();
    const message = (req.body.message ?? "").trim();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name)                                  return res.status(400).json({ error: "Full name is required." });
    if (!email)                                 return res.status(400).json({ error: "Email address is required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                                return res.status(400).json({ error: "Please enter a valid email address." });
    if (!VALID_SUBJECTS.has(subject))           return res.status(400).json({ error: "Please select a valid subject." });
    if (!message || message.length < 10)        return res.status(400).json({ error: "Message must be at least 10 characters." });
    if (message.length > 5000)                  return res.status(400).json({ error: "Message must not exceed 5000 characters." });

    const reference = generateReference();
    const timestamp = new Date().toISOString();
    const { browser, os } = parseUserAgent(req.headers["user-agent"]);
    const ip = req.ip || "Unknown";

    // ── Optional: resolve user ID from auth header ───────────────────────────
    let userId = null;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && supabaseAdmin) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id ?? null;
      } catch {}
    }

    // ── Upload attachment to Supabase Storage ────────────────────────────────
    let attachmentUrl = null;
    if (req.file && supabaseAdminReady) {
      try {
        const ext      = req.file.originalname.split(".").pop().toLowerCase() || "bin";
        const fileName = `contact/${reference}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from("contact-attachments")
          .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
        if (!upErr) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from("contact-attachments")
            .getPublicUrl(fileName);
          attachmentUrl = publicUrl;
        } else {
          console.warn("[contact] attachment upload:", upErr.message);
        }
      } catch (err) {
        console.warn("[contact] attachment upload failed:", err.message);
      }
    }

    // ── Save to database ─────────────────────────────────────────────────────
    if (supabaseAdminReady) {
      const { error: dbErr } = await supabaseAdmin.from("contact_messages").insert({
        reference_number: reference,
        user_id:          userId,
        name,
        email,
        subject,
        message,
        attachment_url:   attachmentUrl,
        status:           "New",
      });
      if (dbErr) console.error("[contact] db insert:", dbErr.message);
    }

    // ── Send emails ──────────────────────────────────────────────────────────
    if (resend) {
      const attachments = req.file ? [{
        filename: req.file.originalname,
        content:  req.file.buffer.toString("base64"),
      }] : [];

      // Email to support team
      resend.emails.send({
        from:        FROM_EMAIL,
        to:          SUPPORT_EMAIL,
        replyTo:     email,
        subject:     `[Contact Form] ${subject}`,
        attachments,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:620px;margin:0 auto;color:#132A46">
  <div style="border-bottom:2px solid #135DFF;padding-bottom:20px;margin-bottom:28px">
    <h2 style="margin:0;font-size:20px;font-weight:800">New Contact Form Submission</h2>
    <p style="margin:4px 0 0;font-size:13px;color:#4d6a8a">Reference: <strong style="color:#135DFF">#${reference}</strong></p>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${[
      ["Name",       name],
      ["Email",      `<a href="mailto:${email}" style="color:#135DFF">${email}</a>`],
      ["Subject",    subject],
      ["Timestamp",  timestamp],
      ["User ID",    userId ?? "Not logged in"],
      ["Browser",    browser],
      ["OS",         os],
      ["IP Address", ip],
      ...(attachmentUrl ? [["Attachment", `<a href="${attachmentUrl}" style="color:#135DFF">${req.file?.originalname}</a>`]] : []),
    ].map(([k, v], i) => `
    <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
      <td style="padding:9px 12px;font-weight:600;color:#4d6a8a;white-space:nowrap;width:130px">${k}</td>
      <td style="padding:9px 12px">${v}</td>
    </tr>`).join("")}
  </table>
  <div style="margin-top:24px;padding:16px 20px;background:#f0f5ff;border-radius:10px;border-left:4px solid #135DFF">
    <p style="margin:0 0 8px;font-weight:700;font-size:13px">Message</p>
    <p style="margin:0;white-space:pre-wrap;color:#4d6a8a;line-height:1.65;font-size:14px">${message}</p>
  </div>
</div>`,
      }).catch(err => console.error("[contact] team email:", err.message));

      // Confirmation email to user
      resend.emails.send({
        from:    FROM_EMAIL,
        to:      email,
        subject: "We've received your message — PartLister",
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#132A46">
  <img src="https://partlister.app/logo.png" alt="PartLister" style="height:36px;margin-bottom:28px;display:block" />
  <h2 style="margin:0 0 10px;font-size:22px;font-weight:800">Hi ${name},</h2>
  <p style="margin:0 0 20px;color:#4d6a8a;line-height:1.7;font-size:15px">
    Thanks for contacting PartLister. We've received your message and will get back to you as soon as possible — usually within one business day.
  </p>
  <div style="background:#f0f5ff;border:1px solid #c7d9ff;border-radius:12px;padding:20px 24px;margin:0 0 24px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#135DFF;text-transform:uppercase;letter-spacing:0.06em">Your Reference Number</p>
    <p style="margin:0;font-size:24px;font-weight:800;font-family:monospace;color:#132A46">#${reference}</p>
  </div>
  <p style="margin:0 0 32px;color:#4d6a8a;line-height:1.7;font-size:14px">
    Please keep this reference number for your records. If you need to follow up, mention it in your reply.
  </p>
  <hr style="border:none;border-top:1px solid #dde7f5;margin:0 0 24px" />
  <p style="margin:0;font-size:13px;color:#7a96b0">
    The PartLister Team · <a href="https://partlister.app" style="color:#135DFF;text-decoration:none">partlister.app</a>
  </p>
</div>`,
      }).catch(err => console.error("[contact] user email:", err.message));
    } else {
      console.log(`[contact] No RESEND_API_KEY — email skipped. Ref: ${reference}, From: ${email}, Subject: ${subject}`);
    }

    return res.json({ reference });
  }
);

export default router;
