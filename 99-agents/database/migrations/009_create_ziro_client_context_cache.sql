-- Migration: 009_create_ziro_client_context_cache.sql
-- Target: Platform Supabase (gngbyydqjouxkoprzzil)
-- Purpose: ZIRO_CLIENT Agent — cached student context for fast ZIRO_MESSAGING tone adaptation
-- Run manually via Supabase SQL editor on the platform project.

CREATE TABLE IF NOT EXISTS ziro_client_context_cache (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID        NOT NULL,
  tenant_id      UUID        NOT NULL,
  context_json   JSONB       NOT NULL,
  built_at       TIMESTAMPTZ DEFAULT now(),
  invalidated_at TIMESTAMPTZ,
  UNIQUE(student_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_ziro_client_cache_student_tenant
  ON ziro_client_context_cache(student_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_ziro_client_cache_invalidated
  ON ziro_client_context_cache(invalidated_at)
  WHERE invalidated_at IS NOT NULL;
