-- contact_messages table
-- Run this in Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS contact_messages (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number text        NOT NULL UNIQUE,
  user_id          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name             text        NOT NULL,
  email            text        NOT NULL,
  subject          text        NOT NULL,
  message          text        NOT NULL,
  attachment_url   text,
  status           text        NOT NULL DEFAULT 'New'
                               CHECK (status IN ('New','Open','Waiting for User','Resolved','Closed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx     ON contact_messages(status);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx    ON contact_messages(user_id);

-- Service-role only — no user-facing RLS policies needed
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Also create the storage bucket (run separately in Supabase Storage UI, or via SQL):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contact-attachments', 'contact-attachments', false)
-- ON CONFLICT DO NOTHING;
