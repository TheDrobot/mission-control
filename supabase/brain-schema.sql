-- Second Brain Schema
-- Run this in Supabase SQL Editor

-- Folders table (projects/categories)
CREATE TABLE IF NOT EXISTS brain_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES brain_folders(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#5a9cf5',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT DEFAULT 'default'
);

-- Brain items table (documents, texts, links)
CREATE TABLE IF NOT EXISTS brain_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID REFERENCES brain_folders(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'link', 'document', 'note', 'image')),
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT DEFAULT 'default'
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_brain_folders_parent ON brain_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_brain_items_folder ON brain_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_brain_items_type ON brain_items(type);
CREATE INDEX IF NOT EXISTS idx_brain_items_tags ON brain_items USING GIN(tags);

-- Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('brain-files', 'brain-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow authenticated uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'brain-files');

CREATE POLICY "Allow authenticated reads" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'brain-files');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'brain-files');

-- Row Level Security
ALTER TABLE brain_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders" ON brain_folders
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own folders" ON brain_folders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own folders" ON brain_folders
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own folders" ON brain_folders
    FOR DELETE USING (true);

CREATE POLICY "Users can view their own items" ON brain_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own items" ON brain_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own items" ON brain_items
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own items" ON brain_items
    FOR DELETE USING (true);
