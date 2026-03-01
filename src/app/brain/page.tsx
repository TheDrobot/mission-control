"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search, FolderPlus, Plus, FileText, Link as LinkIcon, Upload,
    Folder, MoreVertical, Trash2, Edit3, X, Loader2, ChevronRight,
    File, Image, ExternalLink, Download, Brain
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Types
interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    color: string;
    icon: string;
    created_at: string;
}

interface BrainItem {
    id: string;
    folder_id: string | null;
    type: 'text' | 'link' | 'document' | 'note' | 'image';
    title: string;
    content: string | null;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    tags: string[];
    created_at: string;
    updated_at: string;
    folder?: Folder;
}

type AddModalType = 'text' | 'link' | 'note' | null;

export default function SecondBrain() {
    // State
    const [folders, setFolders] = useState<Folder[]>([]);
    const [items, setItems] = useState<BrainItem[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState<AddModalType>(null);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newItemData, setNewItemData] = useState({ title: '', content: '', url: '' });
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch data
    useEffect(() => {
        fetchFolders();
        fetchItems();

        // Real-time subscriptions
        const foldersChannel = supabase.channel('folders-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'brain_folders' }, () => fetchFolders())
            .subscribe();

        const itemsChannel = supabase.channel('items-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'brain_items' }, () => fetchItems())
            .subscribe();

        return () => {
            supabase.removeChannel(foldersChannel);
            supabase.removeChannel(itemsChannel);
        };
    }, []);

    const fetchFolders = async () => {
        try {
            const res = await fetch('/api/brain/folders');
            const data = await res.json();
            if (!res.ok) {
                console.error('Error fetching folders:', data.error);
            }
            setFolders(data.folders || []);
        } catch (error) {
            console.error('Error fetching folders:', error);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            let url = '/api/brain/items';
            if (selectedFolder) {
                url += `?folder_id=${selectedFolder}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            setItems(data.items || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [selectedFolder]);

    // Folder actions
    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/brain/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Errore: ${data.error || 'Errore sconosciuto'}`);
                console.error('Server error:', data);
            } else {
                setNewFolderName('');
                setShowNewFolder(false);
                fetchFolders(); // Refresh list
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Errore di connessione');
        } finally {
            setSaving(false);
        }
    };

    const deleteFolder = async (id: string) => {
        if (!confirm('Eliminare questa cartella? Gli elementi verranno spostati nella root.')) return;
        try {
            await fetch(`/api/brain/folders?id=${id}`, { method: 'DELETE' });
            if (selectedFolder === id) setSelectedFolder(null);
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    // Item actions
    const createItem = async () => {
        if (!newItemData.title.trim()) return;
        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                type: showAddModal,
                title: newItemData.title,
                folder_id: selectedFolder,
            };

            if (showAddModal === 'link') {
                body.content = newItemData.url;
            } else {
                body.content = newItemData.content;
            }

            await fetch('/api/brain/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            setNewItemData({ title: '', content: '', url: '' });
            setShowAddModal(null);
        } catch (error) {
            console.error('Error creating item:', error);
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm('Eliminare questo elemento?')) return;
        try {
            await fetch(`/api/brain/items?id=${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    // File upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            if (selectedFolder) {
                formData.append('folder_id', selectedFolder);
            }

            await fetch('/api/brain/upload', {
                method: 'POST',
                body: formData,
            });
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Filter items
    const filteredItems = items.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) ||
               item.content?.toLowerCase().includes(q) ||
               item.tags?.some(t => t.toLowerCase().includes(q));
    });

    // Helpers
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'link': return <LinkIcon size={16} />;
            case 'document': return <File size={16} />;
            case 'image': return <Image size={16} />;
            case 'note': return <FileText size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'link': return '#5a9cf5';
            case 'document': return '#ef4444';
            case 'image': return '#22c55e';
            case 'note': return '#f59e0b';
            default: return 'var(--text-secondary)';
        }
    };

    const formatBytes = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar - Folders */}
            <aside style={{
                width: '260px',
                backgroundColor: 'var(--bg-sidebar)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>
                {/* Sidebar Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Brain size={24} color="var(--brand-orange)" />
                        <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Second Brain</h1>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Cerca..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                outline: 'none',
                            }}
                        />
                    </div>
                </div>

                {/* Folders List */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Cartelle
                        </span>
                        <button
                            onClick={() => setShowNewFolder(true)}
                            style={{
                                padding: '0.25rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            <FolderPlus size={16} />
                        </button>
                    </div>

                    {/* New Folder Input */}
                    {showNewFolder && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Nome cartella..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--brand-blue)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={createFolder} disabled={saving} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                    Crea
                                </button>
                                <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                    Annulla
                                </button>
                            </div>
                        </div>
                    )}

                    {/* All Items */}
                    <button
                        onClick={() => setSelectedFolder(null)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: selectedFolder === null ? 'var(--bg-elevated)' : 'transparent',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: selectedFolder === null ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            marginBottom: '0.25rem',
                        }}
                    >
                        <FileText size={16} />
                        Tutti gli elementi
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {items.length}
                        </span>
                    </button>

                    {/* Folders */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: selectedFolder === folder.id ? 'var(--bg-elevated)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            <button
                                onClick={() => setSelectedFolder(folder.id)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: selectedFolder === folder.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <Folder size={16} color={folder.color} />
                                {folder.name}
                            </button>
                            <button
                                onClick={() => deleteFolder(folder.id)}
                                style={{
                                    padding: '0.25rem',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    opacity: 0.5,
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Buttons */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowAddModal('note')}
                            title="Nuova nota"
                            style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            <FileText size={18} />
                        </button>
                        <button
                            onClick={() => setShowAddModal('link')}
                            title="Nuovo link"
                            style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            <LinkIcon size={18} />
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Carica file"
                            style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            <Upload size={18} />
                        </button>
                        <button
                            onClick={() => setShowAddModal('text')}
                            title="Incolla testo"
                            style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'Tutti gli elementi'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {filteredItems.length} elementi
                    </p>
                </div>

                {/* Loading */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-orange)' }} />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Nessun elemento trovato</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Usa i pulsanti in basso a sinistra per aggiungere contenuto</p>
                    </div>
                ) : (
                    /* Items Grid */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Item Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    gap: '0.75rem',
                                    borderBottom: '1px solid var(--border-color)',
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        backgroundColor: `${getTypeColor(item.type)}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: getTypeColor(item.type),
                                    }}>
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {item.title}
                                        </h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {formatDate(item.updated_at)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        style={{
                                            padding: '0.25rem',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            opacity: 0.5,
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Item Content */}
                                <div style={{ padding: '1rem' }}>
                                    {item.type === 'link' ? (
                                        <a
                                            href={item.content || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--brand-blue)',
                                                fontSize: '0.875rem',
                                                textDecoration: 'none',
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {item.content}
                                            <ExternalLink size={14} />
                                        </a>
                                    ) : item.file_url ? (
                                        <div>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                {item.file_name}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {formatBytes(item.file_size)}
                                            </p>
                                            <a
                                                href={item.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    marginTop: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--brand-blue)',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                <Download size={14} /> Scarica
                                            </a>
                                        </div>
                                    ) : (
                                        <p style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.6,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {item.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                {showAddModal === 'note' ? 'Nuova Nota' : showAddModal === 'link' ? 'Nuovo Link' : 'Incolla Testo'}
                            </h3>
                            <button onClick={() => setShowAddModal(null)} style={{ padding: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Titolo"
                                value={newItemData.title}
                                onChange={(e) => setNewItemData({ ...newItemData, title: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                }}
                            />

                            {showAddModal === 'link' ? (
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={newItemData.url}
                                    onChange={(e) => setNewItemData({ ...newItemData, url: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                    }}
                                />
                            ) : (
                                <textarea
                                    placeholder="Contenuto..."
                                    value={newItemData.content}
                                    onChange={(e) => setNewItemData({ ...newItemData, content: e.target.value })}
                                    rows={6}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        resize: 'vertical',
                                    }}
                                />
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowAddModal(null)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'transparent',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={createItem}
                                    disabled={saving || !newItemData.title.trim()}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'var(--brand-blue)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        color: '#fff',
                                        fontSize: '0.875rem',
                                        cursor: saving || !newItemData.title.trim() ? 'default' : 'pointer',
                                        opacity: !newItemData.title.trim() ? 0.5 : 1,
                                    }}
                                >
                                    {saving ? 'Salvataggio...' : 'Salva'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `
            }} />
        </div>
    );
}
