import { useQuotes } from './hooks/useQuotes';
import { useRandomQuote } from './hooks/useRandomQuote';
import ErrorBoundary from './components/ErrorBoundary';
import { FilterPanel } from './components/FilterPanel';
import QuoteDisplay from './components/QuoteDisplay';
import CopyButton from './components/CopyButton';
import RefreshButton from './components/RefreshButton';
import EmptyState from './components/EmptyState';

const AppContent: React.FC = () => {
  const {
    allQuotes,
    filteredQuotes,
    sources,
    selectedSources,
    setSelectedSources,
    isLoading,
  } = useQuotes();

  const { currentQuote, displayedQuote, nextQuote, animationPhase, canGetNext } =
    useRandomQuote(filteredQuotes);

  // Determine empty state type
  const getEmptyStateType = (): 'loading' | 'no-data' | 'no-filter-results' | null => {
    if (isLoading) return 'loading';
    if (filteredQuotes.length === 0 && allQuotes.length === 0) return 'no-data';
    if (filteredQuotes.length === 0 && allQuotes.length > 0) return 'no-filter-results';
    return null;
  };

  const emptyStateType = getEmptyStateType();

  const handleResetFilter = () => {
    setSelectedSources(new Set());
  };

  // Show empty state
  if (emptyStateType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] px-6">
        <EmptyState
          type={emptyStateType}
          onResetFilter={emptyStateType === 'no-filter-results' ? handleResetFilter : undefined}
        />
      </div>
    );
  }

  // Main content with quotes
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#FFFDF5] px-6 py-10">
      {/* FilterPanel: Tab order position 1 */}
      <div className="w-full max-w-2xl mb-8">
        <FilterPanel
          sources={sources}
          selectedSources={selectedSources}
          onSelectionChange={setSelectedSources}
        />
      </div>

      {/* QuoteDisplay inside aria-live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="w-full max-w-2xl flex-1 flex items-center justify-center py-10"
      >
        <QuoteDisplay quote={displayedQuote} animationPhase={animationPhase} />
      </div>

      {/* Action buttons: Tab order position 2 (RefreshButton) then 3 (CopyButton) */}
      <div className="flex items-center gap-4 mt-8">
        <RefreshButton onRefresh={nextQuote} disabled={!canGetNext} />
        {currentQuote && <CopyButton quote={currentQuote} />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
