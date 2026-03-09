'use client';

import { useState, useRef } from 'react';
import { Question, Answer } from '@/lib/types';
import { parseCSVQuestions } from '@/lib/csvParser';

interface QuestionEditorProps {
  questions: Question[];
  onSave: (questions: Question[]) => void;
  onClose: () => void;
}

export default function QuestionEditor({ questions, onSave, onClose }: QuestionEditorProps) {
  const [editableQuestions, setEditableQuestions] = useState<Question[]>([...questions]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswers, setEditAnswers] = useState<Answer[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (index: number) => {
    const q = editableQuestions[index];
    setEditingIndex(index);
    setEditQuestion(q.question);
    setEditAnswers([...q.answers]);
  };

  const startNew = () => {
    setEditingIndex(-1);
    setEditQuestion('');
    setEditAnswers([{ text: '', points: 0 }]);
  };

  const addAnswer = () => {
    if (editAnswers.length < 8) {
      setEditAnswers([...editAnswers, { text: '', points: 0 }]);
    }
  };

  const removeAnswer = (index: number) => {
    setEditAnswers(editAnswers.filter((_, i) => i !== index));
  };

  const updateAnswer = (index: number, field: 'text' | 'points', value: string | number) => {
    const updated = [...editAnswers];
    if (field === 'points') {
      updated[index] = { ...updated[index], points: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], text: String(value) };
    }
    setEditAnswers(updated);
  };

  const saveQuestion = () => {
    const sortedAnswers = [...editAnswers]
      .filter(a => a.text.trim())
      .sort((a, b) => b.points - a.points);

    if (!editQuestion.trim() || sortedAnswers.length === 0) return;

    const newQuestion: Question = {
      id: editingIndex === -1 ? `q_custom_${Date.now()}` : editableQuestions[editingIndex!].id,
      question: editQuestion.trim(),
      answers: sortedAnswers,
      isUsed: editingIndex === -1 ? false : editableQuestions[editingIndex!].isUsed,
    };

    const updated = [...editableQuestions];
    if (editingIndex === -1) {
      updated.push(newQuestion);
    } else {
      updated[editingIndex!] = newQuestion;
    }

    setEditableQuestions(updated);
    setEditingIndex(null);
  };

  const deleteQuestion = (index: number) => {
    setEditableQuestions(editableQuestions.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    onSave(editableQuestions);
    onClose();
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const imported = parseCSVQuestions(text);
      if (imported.length === 0) {
        setImportMessage('No valid questions found in CSV. Expected format: Question, Answer1, Points1, Answer2, Points2, ...');
      } else {
        setEditableQuestions(prev => [...prev, ...imported]);
        setImportMessage(`Imported ${imported.length} question${imported.length !== 1 ? 's' : ''} from CSV`);
      }

      // Clear the file input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Auto-dismiss message after 4 seconds
      setTimeout(() => setImportMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-emerald-darker border-2 border-gold/30 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-display text-xl text-gold">Question Editor</h2>
          <div className="flex gap-2">
            <button onClick={startNew} className="host-btn-primary host-btn-sm">
              + Add New
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="host-btn-blue host-btn-sm">
              Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <button onClick={handleSaveAll} className="host-btn-gold host-btn-sm">
              Save All
            </button>
            <button onClick={onClose} className="host-btn-danger host-btn-sm">
              Close
            </button>
          </div>
        </div>

        {/* Import Message */}
        {importMessage && (
          <div className={`mx-4 mt-3 p-2.5 rounded-lg text-sm font-medium text-center ${
            importMessage.includes('No valid') ? 'bg-red-900/50 text-red-300 border border-red-500/30' : 'bg-emerald/20 text-emerald-light border border-emerald/30'
          }`}>
            {importMessage}
          </div>
        )}

        {/* Editing Form */}
        {editingIndex !== null && (
          <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="space-y-3">
              <div>
                <label className="text-gold text-xs font-bold uppercase">Question</label>
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-emerald/50 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  placeholder="Enter the survey question..."
                />
              </div>

              <div>
                <label className="text-gold text-xs font-bold uppercase">Answers</label>
                <div className="space-y-1.5">
                  {editAnswers.map((answer, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-gold/50 text-xs w-4">{i + 1}.</span>
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => updateAnswer(i, 'text', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-black/30 border border-emerald/50 rounded text-white text-sm focus:outline-none focus:border-gold"
                        placeholder="Answer text..."
                      />
                      <input
                        type="number"
                        value={answer.points || ''}
                        onChange={(e) => updateAnswer(i, 'points', e.target.value)}
                        className="w-16 px-2 py-1.5 bg-black/30 border border-emerald/50 rounded text-gold text-sm text-center focus:outline-none focus:border-gold"
                        placeholder="Pts"
                      />
                      <button
                        onClick={() => removeAnswer(i)}
                        className="text-red-400 hover:text-red-300 text-sm px-1"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                {editAnswers.length < 8 && (
                  <button
                    onClick={addAnswer}
                    className="mt-2 text-emerald-light text-xs hover:text-gold transition-colors"
                  >
                    + Add Answer
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={saveQuestion} className="host-btn-gold host-btn-sm">
                  {editingIndex === -1 ? 'Add Question' : 'Update Question'}
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="host-btn host-btn-sm bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question List */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {editableQuestions.map((q, i) => (
            <div
              key={q.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                q.isUsed
                  ? 'bg-black/20 border-white/5 opacity-50'
                  : 'bg-black/10 border-emerald/20 hover:border-gold/30'
              }`}
            >
              <span className="text-gold/50 text-xs font-mono w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{q.question}</p>
                <p className="text-white/40 text-xs">{q.answers.length} answers | Top: {q.answers[0]?.points} pts</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {q.isUsed && <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded">Used</span>}
                <button
                  onClick={() => startEditing(i)}
                  className="text-emerald-light text-xs hover:text-gold px-2 py-0.5"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestion(i)}
                  className="text-red-400 text-xs hover:text-red-300 px-2 py-0.5"
                >
                  Del
                </button>
              </div>
            </div>
          ))}

          {editableQuestions.length === 0 && (
            <p className="text-center text-white/30 py-8">No questions yet. Click &quot;Add New&quot; to create one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
