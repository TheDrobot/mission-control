import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Upload a file
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folderId = formData.get('folder_id') as string;
        const title = formData.get('title') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const fileName = `${timestamp}-${randomStr}.${extension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('brain-files')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase
            .storage
            .from('brain-files')
            .getPublicUrl(fileName);

        // Determine item type
        let type = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'document';

        // Create brain item
        const { data: item, error: itemError } = await supabase
            .from('brain_items')
            .insert({
                folder_id: folderId || null,
                type,
                title: title || file.name,
                file_url: urlData.publicUrl,
                file_name: file.name,
                file_size: file.size,
            })
            .select()
            .single();

        if (itemError) throw itemError;

        return NextResponse.json({ item, url: urlData.publicUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
