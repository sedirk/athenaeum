import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import { I18nProvider, useI18n } from '../../src/i18n/I18nContext';
import { NavHistoryProvider } from '../../src/contexts/NavHistoryContext';
import HistoryNav from '../../src/components/HistoryNav';
import { RolePlaceholderInspector } from '../../src/components/folders/RoleInspector';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { StageRow } from '../../src/components/stacking/StageRow';
import { useState } from 'react';
import '../../src/index.css';

function Check() {
  const { locale, setLocale, t, tx } = useI18n();
  const [dialog, setDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  return <div className="p-6 max-w-3xl mx-auto space-y-4">
    <select aria-label="Language" value={locale} onChange={e => setLocale(e.target.value as 'en' | 'zh-CN')}>
      <option value="en">English</option><option value="zh-CN">简体中文</option>
    </select>
    <h1>{t('fileManager.title')}</h1>
    <HistoryNav />
    <button onClick={() => navigate('/second')}>Navigate</button>
    <p data-testid="route">{location.pathname}</p>
    <RolePlaceholderInspector kind="calibration_library" onSetUp={() => setDialog(true)} />
    <h2>{tx('Export Mode')}</h2>
    <StageRow index={5} stage="register" label="Register" state="ready" summary="" selected={false} onSelect={() => {}} />
    <p data-testid="community-updates">{tx('Community updates are checked on GitHub and installed manually. Official upstream updates will not replace this bilingual build.')}</p>
    {['Lights only', 'Lights + calibration sets', 'Lights + masters', 'Calibrated lights'].map(s => <p key={s}>{tx(s)}</p>)}
    <p data-testid="count">{tx('{count} files missing from disk', { count: 2 })}</p>
    <p data-testid="fallback">{tx('Unknown upstream text')}</p>
    <p data-testid="literal">{tx('Inside {path}', { path: 'D:\\M45 $& {count}' })}</p>
    <ConfirmDialog isOpen={dialog} title={tx('Confirm')} message={tx('Files on disk are never touched.')} onCancel={() => setDialog(false)} onConfirm={() => setDialog(false)} />
  </div>;
}
createRoot(document.getElementById('root')!).render(<I18nProvider><MemoryRouter><NavHistoryProvider><Check /></NavHistoryProvider></MemoryRouter></I18nProvider>);
