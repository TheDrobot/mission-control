import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List items (optionally filtered by folder)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const folderId = searchParams.get('folder_id');
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        let query = supabase
            .from('brain_items')
            .select('*, folder:brain_folders(id, name, color)')
            .order('updated_at', { ascending: false });

        if (folderId) {
            query = query.eq('folder_id', folderId);
        }

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        return NextResponse.json({ items: data });
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

// POST - Create a new item
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { folder_id, type, title, content, file_url, file_name, file_size, tags, metadata } = body;

        if (!type || !title) {
            return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('brain_items')
            .insert({
                folder_id: folder_id || null,
                type,
                title,
                content: content || null,
                file_url: file_url || null,
                file_name: file_name || null,
                file_size: file_size || null,
                tags: tags || [],
                metadata: metadata || {},
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

// PUT - Update an item
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, folder_id, title, content, tags, metadata } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (folder_id !== undefined) updateData.folder_id = folder_id;
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (tags !== undefined) updateData.tags = tags;
        if (metadata !== undefined) updateData.metadata = metadata;

        const { data, error } = await supabase
            .from('brain_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('Error updating item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

// DELETE - Delete an item
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Get item first to delete file if exists
        const { data: item } = await supabase
            .from('brain_items')
            .select('file_url')
            .eq('id', id)
            .single();

        // Delete file from storage if exists
        if (item?.file_url) {
            const path = item.file_url.split('/').pop();
            if (path) {
                await supabase.storage.from('brain-files').remove([path]);
            }
        }

        const { error } = await supabase
            .from('brain_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
