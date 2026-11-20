import React, { useCallback, useEffect, useState } from 'react';
import type {
  BatchResultRow,
  CompareResponse,
  ConnectionStatus,
  HealthResponse,
  InventoryMap,
  LidResponse,
  LiveDatasetsResponse,
  ModuleId,
  PredictResponse,
  TranslateResponse,
} from './types/contexta';
import { BUNDLED_INVENTORY } from './data/researchArtifacts';
import {
  fetchDatasets,
  fetchExperiments,
  fetchHealth,
  fetchInventory,
} from './services/api';
import { normalizeBaseUrl } from './utils/nlp';
import {
  AppShell,
  ConnectionModal,
  ToastBanner,
} from './components/Layout';
import { OverviewView } from './views/OverviewView';
import { WsdLabView } from './views/WsdLabView';
import { LidLabView } from './views/LidLabView';
import { TranslationStudioView } from './views/TranslationStudioView';
import { ModelComparisonView } from './views/ModelComparisonView';
import { SenseExplorerView } from './views/SenseExplorerView';
import { DatasetIntelligenceView } from './views/DatasetIntelligenceView';
import { EvaluationView } from './views/EvaluationView';
import { AblationView } from './views/AblationView';
import { BatchProcessingView } from './views/BatchProcessingView';
import { AnnotationStudioView } from './views/AnnotationStudioView';
import { ExperimentsRegistryView } from './views/ExperimentsRegistryView';

const STORAGE_KEY_API_BASE = 'contexta_api_base_url';

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');

  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API_BASE) || '';
    } catch {
      return '';
    }
  });
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('checking');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);

  // Dynamically hydrated inventory: starts with verified bundled configs/inventory.json
  // and upgrades seamlessly to live /api/inventory when FastAPI is connected.
  const [inventory, setInventory] = useState<InventoryMap>(BUNDLED_INVENTORY);
  const [inventorySource, setInventorySource] = useState<'live' | 'bundled'>(
    'bundled',
  );
  const [liveDatasets, setLiveDatasets] =
    useState<LiveDatasetsResponse | null>(null);
  const [liveExperiments, setLiveExperiments] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Persistent per-lab inputs & results across tab switches
  const [wsdText, setWsdText] = useState('The fisherman sat on the bank.');
  const [wsdResult, setWsdResult] = useState<PredictResponse | null>(null);

  const [lidText, setLidText] = useState('Hello mujhe bank jaana hai');
  const [lidResult, setLidResult] = useState<LidResponse | null>(null);

  const [translationText, setTranslationText] = useState(
    'The bank approved the loan.',
  );
  const [translationResult, setTranslationResult] =
    useState<TranslateResponse | null>(null);

  const [compareText, setCompareText] = useState(
    'They sat on the bank of the river.',
  );
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(
    null,
  );

  const [batchResults, setBatchResults] = useState<BatchResultRow[]>([]);

  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  const notify = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      setToast({ message, tone });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const checkBackend = useCallback(
    async (overrideBase?: string) => {
      const targetBase = overrideBase ?? apiBaseUrl;
      setConnectionStatus('checking');
      setConnectionError(null);
      try {
        const healthData = await fetchHealth(targetBase);
        setHealth(healthData);
        setConnectionStatus('online');

        const [invResult, dsResult, expResult] = await Promise.allSettled([
          fetchInventory(targetBase),
          fetchDatasets(targetBase),
          fetchExperiments(targetBase),
        ]);

        if (
          invResult.status === 'fulfilled' &&
          Object.keys(invResult.value).length > 0
        ) {
          setInventory(invResult.value);
          setInventorySource('live');
        }
        if (dsResult.status === 'fulfilled') {
          setLiveDatasets(dsResult.value);
        }
        if (expResult.status === 'fulfilled') {
          setLiveExperiments(expResult.value);
        }
      } catch (err) {
        setHealth(null);
        setConnectionStatus('offline');
        setInventory(BUNDLED_INVENTORY);
        setInventorySource('bundled');
        setLiveDatasets(null);
        setLiveExperiments(null);
        setConnectionError(
          err instanceof Error
            ? err.message
            : 'Local FastAPI backend is not reachable.',
        );
      }
    },
    [apiBaseUrl],
  );

  useEffect(() => {
    void checkBackend();
  }, [checkBackend]);

  const handleSaveBaseUrl = (raw: string) => {
    const clean = normalizeBaseUrl(raw);
    setApiBaseUrl(clean);
    try {
      if (clean) {
        localStorage.setItem(STORAGE_KEY_API_BASE, clean);
      } else {
        localStorage.removeItem(STORAGE_KEY_API_BASE);
      }
    } catch {
      // Storage unavailable
    }
    void checkBackend(clean);
    setConnectionModalOpen(false);
  };

  const handleRefreshDatasets = async () => {
    if (connectionStatus !== 'online') return;
    try {
      const ds = await fetchDatasets(apiBaseUrl);
      setLiveDatasets(ds);
      notify('Dataset availability refreshed from FastAPI.');
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Failed to refresh datasets.',
        'error',
      );
    }
  };

  const handleTestLemmaInWsd = (_lemma: string, sampleSentence: string) => {
    setWsdText(sampleSentence);
    setWsdResult(null);
    setActiveModule('wsd');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      connectionStatus={connectionStatus}
      health={health}
      apiBaseUrl={apiBaseUrl}
      onOpenConnectionModal={() => setConnectionModalOpen(true)}
      onRetryConnection={() => void checkBackend()}
    >
      {activeModule === 'overview' && (
        <OverviewView
          inventory={inventory}
          inventorySource={inventorySource}
          connectionStatus={connectionStatus}
          health={health}
          onNavigate={setActiveModule}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
          onRetryConnection={() => void checkBackend()}
        />
      )}

      {activeModule === 'wsd' && (
        <WsdLabView
          inventory={inventory}
          connectionStatus={connectionStatus}
          apiBaseUrl={apiBaseUrl}
          text={wsdText}
          onTextChange={setWsdText}
          result={wsdResult}
          onResultChange={setWsdResult}
          onRetryConnection={() => void checkBackend()}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />
      )}

      {activeModule === 'lid' && (
        <LidLabView
          connectionStatus={connectionStatus}
          apiBaseUrl={apiBaseUrl}
          text={lidText}
          onTextChange={setLidText}
          result={lidResult}
          onResultChange={setLidResult}
          onRetryConnection={() => void checkBackend()}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />
      )}

      {activeModule === 'translation' && (
        <TranslationStudioView
          connectionStatus={connectionStatus}
          apiBaseUrl={apiBaseUrl}
          text={translationText}
          onTextChange={setTranslationText}
          result={translationResult}
          onResultChange={setTranslationResult}
          onRetryConnection={() => void checkBackend()}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />
      )}

      {activeModule === 'comparison' && (
        <ModelComparisonView
          inventory={inventory}
          connectionStatus={connectionStatus}
          apiBaseUrl={apiBaseUrl}
          text={compareText}
          onTextChange={setCompareText}
          result={compareResult}
          onResultChange={setCompareResult}
          onRetryConnection={() => void checkBackend()}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />
      )}

      {activeModule === 'inventory' && (
        <SenseExplorerView
          inventory={inventory}
          inventorySource={inventorySource}
          onTestLemmaInWsd={handleTestLemmaInWsd}
          onNavigate={setActiveModule}
        />
      )}

      {activeModule === 'datasets' && (
        <DatasetIntelligenceView
          connectionStatus={connectionStatus}
          liveDatasets={liveDatasets}
          onRefreshDatasets={() => void handleRefreshDatasets()}
        />
      )}

      {activeModule === 'evaluation' && <EvaluationView />}

      {activeModule === 'ablation' && <AblationView />}

      {activeModule === 'batch' && (
        <BatchProcessingView
          inventory={inventory}
          connectionStatus={connectionStatus}
          apiBaseUrl={apiBaseUrl}
          results={batchResults}
          onResultsChange={setBatchResults}
          onRetryConnection={() => void checkBackend()}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />
      )}

      {activeModule === 'annotation' && (
        <AnnotationStudioView
          inventory={inventory}
          connectionStatus={connectionStatus}
          apiBaseUrl={apiBaseUrl}
          onNotify={notify}
          onRetryConnection={() => void checkBackend()}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />
      )}

      {activeModule === 'experiments' && (
        <ExperimentsRegistryView
          connectionStatus={connectionStatus}
          liveExperiments={liveExperiments}
        />
      )}

      <ConnectionModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        apiBaseUrl={apiBaseUrl}
        onSaveBaseUrl={handleSaveBaseUrl}
        connectionStatus={connectionStatus}
        health={health}
        errorDetail={connectionError}
        onRetry={() => void checkBackend()}
      />

      <ToastBanner
        message={toast?.message ?? null}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
    </AppShell>
  );
}

export default App;
