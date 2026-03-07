-- V12 Migration: Add assigned_member_id to customers table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES team_members(id);
