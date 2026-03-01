import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List all folders
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('brain_folders')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ folders: data });
    } catch (error) {
        console.error('Error fetching folders:', error);
        return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }
}

// POST - Create a new folder
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, parent_id, color, icon } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('brain_folders')
            .insert({
                name,
                parent_id: parent_id || null,
                color: color || '#5a9cf5',
                icon: icon || 'folder',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ folder: data });
    } catch (error) {
        console.error('Error creating folder:', error);
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
}

// PUT - Update a folder
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, parent_id, color, icon } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('brain_folders')
            .update({
                name,
                parent_id,
                color,
                icon,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ folder: data });
    } catch (error) {
        console.error('Error updating folder:', error);
        return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
    }
}

// DELETE - Delete a folder
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('brain_folders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting folder:', error);
        return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }
}
