import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GitCompare,
  Languages,
  Menu,
  Microscope,
  RefreshCw,
  Server,
  ServerOff,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import type {
  ConnectionStatus,
  HealthResponse,
  ModuleId,
  NavGroup,
} from '../types/contexta';
import { MODULES, MODULE_MAP } from '../data/researchArtifacts';

const NAV_ICONS: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  overview: Activity,
  inventory: BookOpen,
  wsd: FlaskConical,
  lid: Languages,
  translation: Sparkles,
  comparison: GitCompare,
  batch: FileSpreadsheet,
  annotation: CheckCircle2,
  datasets: Database,
  evaluation: BarChart3,
  ablation: Microscope,
  experiments: FileText,
};

const NAV_GROUPS: NavGroup[] = [
  'Discover',
  'Live Inference Labs',
  'Research & Corpora',
];

interface AppShellProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  connectionStatus: ConnectionStatus;
  health: HealthResponse | null;
  apiBaseUrl: string;
  onOpenConnectionModal: () => void;
  onRetryConnection: () => void;
  children: React.ReactNode;
}

export function AppShell({
  activeModule,
  onSelectModule,
  connectionStatus,
  health,
  apiBaseUrl,
  onOpenConnectionModal,
  onRetryConnection,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentMeta = MODULE_MAP[activeModule];

  const handleNavClick = (id: ModuleId) => {
    onSelectModule(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-[#000000] text-white">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] rounded-lg"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954] font-display text-lg font-extrabold text-black"
          >
            C
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap">
            Contexta
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#B3B3B3] hover:bg-[#181818] hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Grouped 12-module navigation */}
      <nav
        aria-label="Primary research modules"
        className="flex-1 overflow-y-auto px-3 pb-4 space-y-5"
      >
        {NAV_GROUPS.map((group) => {
          const items = MODULES.filter((m) => m.group === group);
          return (
            <div key={group}>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#8E8E8E]">
                {group}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = NAV_ICONS[item.id];
                  const isActive = activeModule === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] ${
                          isActive
                            ? 'bg-[#282828] text-white'
                            : 'text-[#B3B3B3] hover:bg-[#181818] hover:text-white'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#1DB954]'
                                : 'text-[#8E8E8E] group-hover:text-white'
                            }`}
                          />
                          <span className="truncate whitespace-nowrap">
                            {item.shortLabel}
                          </span>
                        </span>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1DB954]"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom local backend summary card */}
      <div className="border-t border-[#1E1E1E] p-3">
        <button
          type="button"
          onClick={onOpenConnectionModal}
          className="w-full rounded-xl bg-[#141414] p-3 text-left border border-[#242424] hover:bg-[#1E1E1E] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">
              FastAPI Backend
            </span>
            <span
              className={`text-xs font-medium ${
                connectionStatus === 'online'
                  ? 'text-[#1DB954]'
                  : connectionStatus === 'checking'
                    ? 'text-[#B3B3B3]'
                    : 'text-amber-400'
              }`}
            >
              {connectionStatus === 'online'
                ? 'Connected'
                : connectionStatus === 'checking'
                  ? 'Checking'
                  : 'Offline'}
            </span>
          </div>
          <p className="mt-1 truncate font-mono-tabular text-[11px] text-[#8E8E8E]">
            {apiBaseUrl || 'Proxy /api → 127.0.0.1:8000'}
          </p>
          {health && (
            <p className="mt-1.5 text-[11px] text-[#B3B3B3]">
              LoRA {health.models.wsd_lora ? 'ready' : 'off'} · LID{' '}
              {health.models.lid ? 'ready' : 'off'} · MT{' '}
              {health.models.translation ? 'ready' : 'off'}
            </p>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#121212] text-white overflow-x-clip">
      {/* Desktop fixed pure-black sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 border-r border-[#1F1F1F] sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full border-r border-[#242424]">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky compact top bar (<= 60px, strict 3-zone balance) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[#242424] bg-[#121212]/92 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          {/* Left zone: mobile trigger + breadcrumb */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#B3B3B3] hover:bg-[#282828] hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-[#8E8E8E] sm:inline whitespace-nowrap">
                {currentMeta.group}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="hidden h-3.5 w-3.5 text-[#5E5E5E] sm:inline shrink-0"
              />
              <span className="truncate font-semibold text-white">
                {currentMeta.label}
              </span>
            </div>
          </div>

          {/* Right zone: live connection status + action */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden md:inline text-xs text-[#B3B3B3] whitespace-nowrap">
              {connectionStatus === 'online'
                ? 'FastAPI Connected'
                : connectionStatus === 'checking'
                  ? 'Checking FastAPI…'
                  : 'Preview Mode · Backend Offline'}
            </span>
            <button
              type="button"
              onClick={onRetryConnection}
              disabled={connectionStatus === 'checking'}
              aria-label="Retry FastAPI health check"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2E2E2E] bg-[#181818] text-[#B3B3B3] hover:bg-[#282828] hover:text-white disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={onOpenConnectionModal}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#1DB954] px-4 text-xs font-bold text-black hover:bg-[#1ED760] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>API Settings</span>
            </button>
          </div>
        </header>

        {/* Active module content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

interface ModuleHeroProps {
  kicker: string;
  title: string;
  subtitle: string;
  metaItems?: string[];
  action?: React.ReactNode;
  variant?: 'emerald' | 'subtle';
}

export function ModuleHero({
  kicker,
  title,
  subtitle,
  metaItems,
  action,
  variant = 'emerald',
}: ModuleHeroProps) {
  return (
    <section
      className={`${
        variant === 'emerald'
          ? 'contexta-hero-gradient'
          : 'contexta-hero-gradient-subtle'
      } border-b border-[#222222] px-4 pt-8 pb-8 sm:px-6 lg:px-10 lg:pt-10 lg:pb-9`}
    >
      <div className="mx-auto max-w-7xl flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-2.5">
          <p className="text-xs font-semibold tracking-wide text-[#1DB954]">
            {kicker}
          </p>
          <h1
            className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-[#B3B3B3] sm:text-base max-w-2xl">
            {subtitle}
          </p>
          {metaItems && metaItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-[#A3A3A3]">
              {metaItems.map((item, idx) => (
                <React.Fragment key={item}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}

interface OfflineGateBannerProps {
  connectionStatus: ConnectionStatus;
  featureName: string;
  endpointPath: string;
  onRetry: () => void;
  onOpenSettings: () => void;
}

export function OfflineGateBanner({
  connectionStatus,
  featureName,
  endpointPath,
  onRetry,
  onOpenSettings,
}: OfflineGateBannerProps) {
  if (connectionStatus === 'online') return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-[#2E2E2E] bg-[#181818] p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <ServerOff className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-white">
            <span>Local FastAPI Backend Offline</span>
            <span aria-hidden="true" className="text-[#5E5E5E]">·</span>
            <span className="font-mono-tabular text-xs font-normal text-amber-400">
              {endpointPath}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#B3B3B3] max-w-2xl">
            {featureName} requires a live local FastAPI server at{' '}
            <code className="font-mono-tabular text-white">127.0.0.1:8000</code>.
            Live inference actions are disabled while offline—Contexta never
            substitutes saved examples or fabricated outputs for live model calls.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          disabled={connectionStatus === 'checking'}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#363636] bg-[#222222] px-4 text-xs font-semibold text-white hover:bg-[#2E2E2E] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`}
          />
          <span>Retry Connection</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-black hover:bg-[#E5E5E5] transition-colors whitespace-nowrap"
        >
          <span>Local Setup Guide</span>
        </button>
      </div>
    </div>
  );
}

interface ProvenanceBarProps {
  sourceType: 'historical' | 'live' | 'bundled';
  sourcePath: string;
  note?: string;
}

export function ProvenanceBar({ sourceType, sourcePath, note }: ProvenanceBarProps) {
  const label =
    sourceType === 'live'
      ? 'Live FastAPI Output'
      : sourceType === 'bundled'
        ? 'Verified Bundled Inventory'
        : 'Historical Research Artifact (Read-Only)';

  const tone =
    sourceType === 'live'
      ? 'text-[#1DB954]'
      : sourceType === 'bundled'
        ? 'text-sky-400'
        : 'text-amber-400';

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#A3A3A3]">
      <span className={`font-semibold ${tone}`}>{label}</span>
      <span aria-hidden="true">·</span>
      <span className="font-mono-tabular text-[#D4D4D4] break-all min-w-0">
        {sourcePath}
      </span>
      {note && (
        <>
          <span aria-hidden="true">·</span>
          <span>{note}</span>
        </>
      )}
    </div>
  );
}

interface JsonArtifactAccordionProps {
  title: string;
  sourcePath: string;
  data: unknown;
  defaultOpen?: boolean;
}

export function JsonArtifactAccordion({
  title,
  sourcePath,
  data,
  defaultOpen = false,
}: JsonArtifactAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-[#222222] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1DB954]"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{title}</div>
          <div className="font-mono-tabular text-xs text-[#8E8E8E] truncate">
            {sourcePath}
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#B3B3B3]" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#B3B3B3]" />
        )}
      </button>
      {open && (
        <div className="border-t border-[#262626] bg-[#111111] p-4">
          <pre className="max-h-80 overflow-auto font-mono-tabular text-xs leading-relaxed text-[#D4D4D4]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onSaveBaseUrl: (url: string) => void;
  connectionStatus: ConnectionStatus;
  health: HealthResponse | null;
  errorDetail: string | null;
  onRetry: () => void;
}

export function ConnectionModal({
  isOpen,
  onClose,
  apiBaseUrl,
  onSaveBaseUrl,
  connectionStatus,
  health,
  errorDetail,
  onRetry,
}: ConnectionModalProps) {
  const [draftUrl, setDraftUrl] = useState(apiBaseUrl);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const localCmd = 'uvicorn backend.main:app --host 127.0.0.1 --port 8000';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted sandboxes
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBaseUrl(draftUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connection-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#2C2C2C] bg-[#181818] p-6 text-white shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="connection-modal-title"
              className="font-display text-xl font-bold text-white"
            >
              FastAPI Backend Connection
            </h2>
            <p className="text-xs text-[#B3B3B3]">
              Configure the live Contexta FastAPI endpoint for local macOS or LAN
              demonstrations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close connection settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#B3B3B3] hover:bg-[#282828] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current health status */}
        <div className="rounded-xl border border-[#282828] bg-[#121212] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              {connectionStatus === 'online' ? (
                <Server className="h-4 w-4 text-[#1DB954]" />
              ) : (
                <ServerOff className="h-4 w-4 text-amber-400" />
              )}
              <span>
                {connectionStatus === 'online'
                  ? 'Connected to Live FastAPI'
                  : connectionStatus === 'checking'
                    ? 'Verifying /api/health…'
                    : 'Backend Unreachable (Preview / Offline)'}
              </span>
            </div>
            <button
              type="button"
              onClick={onRetry}
              disabled={connectionStatus === 'checking'}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#343434] bg-[#1E1E1E] px-3 text-xs font-medium text-white hover:bg-[#2A2A2A] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`}
              />
              <span>Re-check</span>
            </button>
          </div>

          {health ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs sm:grid-cols-4">
              <div>
                <div className="text-[#8E8E8E]">Inventory</div>
                <div className="font-mono-tabular font-semibold text-white">
                  {health.inventory_words} words
                </div>
              </div>
              <div>
                <div className="text-[#8E8E8E]">XLM-R LoRA</div>
                <div
                  className={`font-semibold ${health.models.wsd_lora ? 'text-[#1DB954]' : 'text-amber-400'}`}
                >
                  {health.models.wsd_lora ? 'Ready' : 'Missing'}
                </div>
              </div>
              <div>
                <div className="text-[#8E8E8E]">Comi-Lingua LID</div>
                <div
                  className={`font-semibold ${health.models.lid ? 'text-[#1DB954]' : 'text-amber-400'}`}
                >
                  {health.models.lid ? 'Ready' : 'Missing'}
                </div>
              </div>
              <div>
                <div className="text-[#8E8E8E]">MarianMT</div>
                <div
                  className={`font-semibold ${health.models.translation ? 'text-[#1DB954]' : 'text-amber-400'}`}
                >
                  {health.models.translation ? 'Ready' : 'Missing'}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-[#A3A3A3]">
              {errorDetail ||
                'Hosted previews cannot reach your Mac’s localhost:8000 server. Historical research artifacts remain viewable; live inference unlocks automatically when connected locally.'}
            </p>
          )}
        </div>

        {/* Endpoint URL override form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label
            htmlFor="api-base-url-input"
            className="block text-xs font-semibold text-[#D4D4D4]"
          >
            FastAPI Base URL (leave empty to use Vite /api proxy)
          </label>
          <input
            id="api-base-url-input"
            type="text"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="http://127.0.0.1:8000"
            className="w-full rounded-lg border border-[#343434] bg-[#121212] px-3.5 py-2.5 font-mono-tabular text-xs text-white placeholder:text-[#666666] focus:border-[#1DB954] focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setDraftUrl('');
                onSaveBaseUrl('');
              }}
              className="text-xs font-medium text-[#B3B3B3] hover:text-white underline underline-offset-4"
            >
              Reset to default /api proxy
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-full border border-[#343434] px-4 text-xs font-semibold text-white hover:bg-[#282828]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-full bg-[#1DB954] px-5 text-xs font-bold text-black hover:bg-[#1ED760]"
              >
                Save & Check
              </button>
            </div>
          </div>
        </form>

        {/* Local macOS startup guide */}
        <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#D4D4D4]">
              <Terminal className="h-3.5 w-3.5 text-[#1DB954]" />
              Local Mac Startup Command
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1DB954] hover:text-[#1ED760]"
            >
              {copiedCmd ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <code className="block overflow-x-auto rounded-lg bg-[#0A0A0A] px-3 py-2 font-mono-tabular text-xs text-[#E5E5E5]">
            {localCmd}
          </code>
        </div>
      </div>
    </div>
  );
}

interface ToastBannerProps {
  message: string | null;
  tone?: 'success' | 'error';
  onDismiss: () => void;
}

export function ToastBanner({
  message,
  tone = 'success',
  onDismiss,
}: ToastBannerProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-5 bottom-5 z-50 flex items-center gap-3 rounded-full border px-5 py-3 text-sm font-medium shadow-2xl ${
        tone === 'error'
          ? 'border-rose-500/40 bg-[#261417] text-rose-200'
          : 'border-[#1DB954]/40 bg-[#122619] text-white'
      }`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-[#B3B3B3] hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
