import React, { useState, useEffect } from 'react';
import { PenTool, Save, Trash2, Plus } from 'lucide-react';

const PersonalNotesWidget = () => {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('user_dashboard_notes');
        return saved ? JSON.parse(saved) : [{ id: 1, text: "Check emails for new RFQs", color: "bg-yellow-50" }];
    });
    const [newNote, setNewNote] = useState("");

    useEffect(() => {
        localStorage.setItem('user_dashboard_notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        setNotes([{ id: Date.now(), text: newNote, color: "bg-white" }, ...notes]);
        setNewNote("");
    };

    const deleteNote = (id) => {
        setNotes(notes.filter(n => n.id !== id));
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-pink-500" />
                    My Notes
                </h3>
            </div>

            <form onSubmit={addNote} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a quick note..."
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:bg-white transition-all outline-none"
                />
                <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="p-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {notes.length > 0 ? (
                    notes.map(note => (
                        <div key={note.id} className="group p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-all bg-yellow-50/50 flex justify-between items-start gap-2">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                            <button
                                onClick={() => deleteNote(note.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                        No notes yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalNotesWidget;
