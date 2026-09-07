import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useReflections } from '../../api/hooks/useReflections';
import { toastSuccess, toastError } from '../../utils/toast';
import { PenLine } from 'lucide-react';

export const VenterAddReflection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addReflection } = useReflections();
  const [text, setText] = useState(() => {
    try { return localStorage.getItem('reflection_draft') || ''; } catch { return ''; }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addReflection(text.trim());
      localStorage.removeItem('reflection_draft');
      toastSuccess(t('VenterHome.reflectionSuccess.message'));
      navigate('/venter/reflections');
    } catch (e: any) {
      toastError(e?.error || t('Common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    try { localStorage.setItem('reflection_draft', val); } catch { /* ignore */ }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <PageHeader title={t('VenterHome.addReflection')} />

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl glass-accent flex items-center justify-center">
          <PenLine size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">{t('VenterHome.addReflectionSubtitle')}</p>
          <p className="text-xs text-white/80">{t('VenterHome.reflectionPrompt')}</p>
        </div>
      </div>

      {/* Starter prompts */}
      {text.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            'What brought me here today...',
            'Something I\'m feeling right now...',
            'One thing on my mind...',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setText(prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={text}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="What brought you here today? Take a moment to capture your thoughts..."
        className="input-field w-full min-h-48 resize-none text-base leading-relaxed"
        autoFocus
        maxLength={2000}
      />
      <div className="flex justify-between items-center">
        <p className={`text-xs ${text.length > 1800 ? 'text-yellow-400' : 'text-gray-600'}`}>
          {text.length}/2000 {text.length > 1800 ? '— almost at limit' : ''}
        </p>
        <p className="text-xs text-gray-600">{new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={saving}
        disabled={!text.trim()}
        onClick={handleSave}
      >
        {t('VenterHome.saveReflection')}
      </Button>
    </div>
  );
};
