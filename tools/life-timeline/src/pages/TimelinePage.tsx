// src/pages/TimelinePage.tsx
// 时光线主页面：集成所有组件，编排事件 CRUD 流程、搜索筛选、加载状态
// 优化：使用 useSearchFilter 组合 hook、useToast 队列、React.lazy 代码分割

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { EventNode, EventNodeInput } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { useToast } from '@/hooks/useToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { FilterStatus } from '@/components/FilterStatus';
import { TimelineCanvas } from '@/components/TimelineCanvas';
import { EmptyState } from '@/components/EmptyState';
import { EmptyFilterState } from '@/components/EmptyFilterState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ToastContainer } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// Code-split: EventForm and FilterPanel are only needed when user interacts
const EventForm = lazy(() => import('@/components/EventForm').then(m => ({ default: m.EventForm })));
const FilterPanel = lazy(() => import('@/components/FilterPanel').then(m => ({ default: m.FilterPanel })));

// --- Types ---

type FormMode = 'closed' | 'create' | 'edit';

// --- Component ---

function TimelinePageContent() {
  const { user, signOut } = useAuth();
  const {
    events,
    isLoading,
    error: eventsError,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useEvents();

  // Combined search + filter (no manual useEffect sync needed)
  const {
    keyword,
    criteria,
    filteredEvents,
    matchedCount,
    totalCount,
    isFiltering,
    setKeyword,
    setCategories,
    setSentiments,
    clearAll: clearAllFilters,
  } = useSearchFilter(events);

  // Toast queue
  const { toasts, showToast, dismissToast } = useToast();

  // Form state
  const [formMode, setFormMode] = useState<FormMode>('closed');
  const [editingEvent, setEditingEvent] = useState<EventNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<EventNode | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter panel expanded state (mobile collapsible)
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Show error toast when useEvents.error changes
  useEffect(() => {
    if (eventsError) {
      showToast(eventsError, 'error');
    }
  }, [eventsError, showToast]);

  // --- Form handlers ---
  const handleOpenCreateForm = useCallback(() => {
    setEditingEvent(null);
    setFormMode('create');
  }, []);

  const handleOpenEditForm = useCallback((event: EventNode) => {
    setEditingEvent(event);
    setFormMode('edit');
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormMode('closed');
    setEditingEvent(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: EventNodeInput) => {
      setIsSubmitting(true);
      try {
        if (formMode === 'create') {
          await addEvent(data);
          showToast('事件添加成功');
        } else if (formMode === 'edit' && editingEvent) {
          await updateEvent(editingEvent.id, data);
          showToast('事件更新成功');
        }
        handleCloseForm();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '操作失败';
        showToast(msg, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formMode, editingEvent, addEvent, updateEvent, handleCloseForm, showToast]
  );

  // --- Delete handlers ---
  const handleRequestDelete = useCallback((event: EventNode) => {
    setDeleteTarget(event);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setShowDeleteConfirm(false);
    try {
      await deleteEvent(deleteTarget.id);
      showToast('事件已删除');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除失败';
      showToast(msg, 'error');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteEvent, showToast]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  }, []);

  // --- Clear all ---
  const handleClearAllFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  // --- Event select (no-op passthrough for canvas) ---
  const handleSelectEvent = useCallback((_event: EventNode) => {
    // Selection is handled internally by TimelineCanvas (detail panel/modal)
  }, []);

  // --- Render helpers ---

  const renderMainContent = () => {
    if (isLoading) {
      return <SkeletonLoader />;
    }

    if (events.length === 0) {
      return <EmptyState onAddEvent={handleOpenCreateForm} />;
    }

    if (isFiltering && filteredEvents.length === 0) {
      return <EmptyFilterState onClearFilter={handleClearAllFilters} />;
    }

    return (
      <TimelineCanvas
        events={filteredEvents}
        onSelectEvent={handleSelectEvent}
        onEditEvent={handleOpenEditForm}
        onDeleteEvent={handleRequestDelete}
      />
    );
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-dark-900">
      {/* Navbar */}
      <Navbar user={user} onSignOut={signOut} />

      {/* Search + Filter area */}
      <div className="px-6 py-4 space-y-3 border-b border-gray-800/50 bg-dark-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            keyword={keyword}
            onChange={setKeyword}
            onClear={clearAllFilters}
          />
          {/* Toggle filter panel on mobile */}
          <button
            type="button"
            onClick={() => setFilterExpanded((v) => !v)}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-400
                       border border-gray-700 rounded-lg hover:bg-dark-600
                       focus:outline-none focus:ring-2 focus:ring-emerald-400
                       md:hidden"
            aria-expanded={filterExpanded}
            aria-label="展开筛选面板"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            筛选
          </button>
        </div>

        {/* Filter panel — always visible on desktop, collapsible on mobile (lazy loaded) */}
        <div className={`${filterExpanded ? 'block' : 'hidden'} md:block`}>
          <Suspense fallback={<div className="h-20 animate-pulse bg-dark-700 rounded-lg" />}>
            <FilterPanel
              categories={criteria.categories}
              sentiments={criteria.sentiments}
              onCategoriesChange={setCategories}
              onSentimentsChange={setSentiments}
              onClearAll={handleClearAllFilters}
            />
          </Suspense>
        </div>

        {/* Filter status */}
        <FilterStatus
          matchedCount={matchedCount}
          totalCount={totalCount}
          isFiltering={isFiltering}
          onClearAll={handleClearAllFilters}
        />
      </div>

      {/* Main content area */}
      <main className="flex-1 min-h-0 relative flex flex-col">
        {renderMainContent()}
      </main>

      {/* "添加事件" floating action button */}
      {!isLoading && (
        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="fixed bottom-8 right-8 z-40 flex items-center gap-2
                     px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                     rounded-full shadow-xl shadow-emerald-900/40 hover:shadow-emerald-800/60
                     hover:scale-105 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-dark-900
                     animate-pulse-glow group"
          aria-label="添加事件"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">添加事件</span>
        </button>
      )}

      {/* Event Form slide-in panel (lazy loaded) */}
      {formMode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCloseForm}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-dark-800 shadow-xl overflow-y-auto border-l border-gray-800">
            <Suspense fallback={<div className="p-6 animate-pulse"><div className="h-8 bg-dark-600 rounded mb-4" /><div className="h-4 bg-dark-600 rounded mb-2" /><div className="h-4 bg-dark-600 rounded" /></div>}>
              <EventForm
                mode={formMode === 'create' ? 'create' : 'edit'}
                initialData={
                  editingEvent
                    ? {
                        title: editingEvent.title,
                        eventDate: editingEvent.eventDate,
                        description: editingEvent.description,
                        category: editingEvent.category,
                        sentiment: editingEvent.sentiment,
                      }
                    : undefined
                }
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
                isSubmitting={isSubmitting}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除事件"
        message={`确定要删除事件"${deleteTarget?.title ?? ''}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Toast queue */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function TimelinePage() {
  return (
    <ErrorBoundary>
      <TimelinePageContent />
    </ErrorBoundary>
  );
}
