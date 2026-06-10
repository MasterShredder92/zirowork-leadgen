-- Migration: 003_create_lesson_plans.sql
-- Creates lesson_plans table on TENANT DB.
-- Run once against each tenant Supabase project.
-- NOT the platform DB.

create extension if not exists "uuid-ossp";

create table if not exists public.lesson_plans (
  id           uuid primary key
               default uuid_generate_v4(),
  tenant_id    text not null,
  student_id   uuid references public.students(id)
               on delete cascade,
  teacher_id   uuid references public.teachers(id)
               on delete set null,
  content      text not null,
  event_id     text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

create index if not exists
  idx_lesson_plans_student_id
  on public.lesson_plans (student_id);

create index if not exists
  idx_lesson_plans_teacher_id
  on public.lesson_plans (teacher_id);

create index if not exists
  idx_lesson_plans_tenant_id
  on public.lesson_plans (tenant_id);

create index if not exists
  idx_lesson_plans_created_at
  on public.lesson_plans (created_at desc);

comment on table public.lesson_plans is
  'AI-generated lesson plans produced by ZIRO_STAFF
   from teacher notes. Queryable by student
   and teacher. One record per session.';
