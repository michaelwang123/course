import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnimationSlotState =
  | 'idle'
  | 'preloading'
  | 'waiting'
  | 'active'
  | 'grace-period';

export interface AnimationSlotOptions {
  rootMargin?: string; // default: "200px"
  threshold?: number; // default: 0.1
  gracePeriod?: number; // default: 2000 (ms)
}

export interface AnimationSlotResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  isInViewport: boolean;
  state: AnimationSlotState;
}

export interface AnimationOrchestratorProviderProps {
  maxConcurrent?: number; // default: 3
  children: React.ReactNode;
}

// ─── Orchestrator Context ────────────────────────────────────────────────────

interface OrchestratorContextValue {
  requestSlot: (id: string) => boolean;
  releaseSlot: (id: string) => void;
  enqueue: (id: string) => void;
  dequeue: (id: string) => void;
  getActiveCount: () => number;
}

const OrchestratorContext = createContext<OrchestratorContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AnimationOrchestratorProvider({
  maxConcurrent = 3,
  children,
}: AnimationOrchestratorProviderProps): React.ReactElement {
  // Using refs so state changes in children don't re-render the provider
  const activeSlots = useRef<Set<string>>(new Set());
  const waitingQueue = useRef<string[]>([]);

  const requestSlot = useCallback(
    (id: string): boolean => {
      if (activeSlots.current.has(id)) {
        return true; // already active
      }
      if (activeSlots.current.size < maxConcurrent) {
        activeSlots.current.add(id);
        return true;
      }
      return false;
    },
    [maxConcurrent],
  );

  const releaseSlot = useCallback((id: string): void => {
    activeSlots.current.delete(id);
  }, []);

  const enqueue = useCallback((id: string): void => {
    if (!waitingQueue.current.includes(id)) {
      waitingQueue.current.push(id);
    }
  }, []);

  const dequeue = useCallback((id: string): void => {
    waitingQueue.current = waitingQueue.current.filter((qId) => qId !== id);
  }, []);

  const getActiveCount = useCallback((): number => {
    return activeSlots.current.size;
  }, []);

  const contextValue = useMemo<OrchestratorContextValue>(
    () => ({
      requestSlot,
      releaseSlot,
      enqueue,
      dequeue,
      getActiveCount,
    }),
    [requestSlot, releaseSlot, enqueue, dequeue, getActiveCount],
  );

  return React.createElement(
    OrchestratorContext.Provider,
    { value: contextValue },
    children,
  );
}

// ─── Hook: useAnimationSlot ──────────────────────────────────────────────────

let slotIdCounter = 0;

export function useAnimationSlot(
  options?: AnimationSlotOptions,
): AnimationSlotResult {
  const {
    rootMargin = '200px',
    threshold = 0.1,
    gracePeriod = 2000,
  } = options ?? {};

  const orchestrator = useContext(OrchestratorContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<AnimationSlotState>('idle');
  const [isInViewport, setIsInViewport] = useState(false);

  // Stable id for this hook instance
  const slotId = useRef<string>('');
  if (slotId.current === '') {
    slotId.current = `animation-slot-${++slotIdCounter}`;
  }

  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<AnimationSlotState>('idle');

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Check if IntersectionObserver is available
  const hasIO = typeof IntersectionObserver !== 'undefined';

  // Main IntersectionObserver effect
  useEffect(() => {
    // If IntersectionObserver is not available, set static fallback
    if (!hasIO) {
      setIsInViewport(true);
      return;
    }

    // If no orchestrator, don't set up observer
    if (!orchestrator) return;

    const element = ref.current;
    if (!element) return;

    const id = slotId.current;
    const { requestSlot, releaseSlot, enqueue, dequeue } = orchestrator;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const isIntersecting = entry.isIntersecting;
      const ratio = entry.intersectionRatio;

      if (isIntersecting && ratio >= threshold) {
        // Element is in viewport meeting threshold
        setIsInViewport(true);

        if (stateRef.current === 'idle' || stateRef.current === 'preloading') {
          const granted = requestSlot(id);
          if (granted) {
            setState('active');
          } else {
            enqueue(id);
            setState('waiting');
          }
        } else if (stateRef.current === 'grace-period') {
          // Re-entering viewport during grace period — reactivate
          if (graceTimerRef.current) {
            clearTimeout(graceTimerRef.current);
            graceTimerRef.current = null;
          }
          setState('active');
        }
      } else if (isIntersecting && ratio < threshold) {
        // In rootMargin zone but not meeting threshold — preloading
        setIsInViewport(false);

        if (stateRef.current === 'idle') {
          setState('preloading');
        }
      } else {
        // Exited rootMargin zone entirely
        setIsInViewport(false);

        if (stateRef.current === 'active') {
          // Start grace period
          setState('grace-period');
          graceTimerRef.current = setTimeout(() => {
            graceTimerRef.current = null;
            releaseSlot(id);
            setState('idle');
          }, gracePeriod);
        } else if (stateRef.current === 'waiting') {
          // Left viewport while waiting — go back to idle
          dequeue(id);
          setState('idle');
        } else if (stateRef.current === 'preloading') {
          setState('idle');
        }
        // grace-period: let existing timer continue
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: [0, threshold],
    });

    observer.observe(element);

    // Cleanup for React Strict Mode safety
    return () => {
      observer.disconnect();

      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }

      const { requestSlot: _req, releaseSlot: rel, dequeue: dq } = orchestrator;

      // Release slot if currently holding one
      if (
        stateRef.current === 'active' ||
        stateRef.current === 'grace-period'
      ) {
        rel(id);
      }

      // Remove from queue if waiting
      if (stateRef.current === 'waiting') {
        dq(id);
      }
    };
  }, [hasIO, orchestrator, rootMargin, threshold, gracePeriod]);

  // Poll for slot availability when in waiting state (FIFO queue)
  useEffect(() => {
    if (state !== 'waiting' || !orchestrator) return;

    const id = slotId.current;
    const { requestSlot, dequeue } = orchestrator;

    const interval = setInterval(() => {
      if (stateRef.current !== 'waiting') {
        clearInterval(interval);
        return;
      }
      const granted = requestSlot(id);
      if (granted) {
        dequeue(id);
        setState('active');
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state, orchestrator]);

  // When IntersectionObserver is unavailable, return static fallback
  if (!hasIO) {
    return {
      ref,
      isActive: false,
      isInViewport: true,
      state: 'idle',
    };
  }

  return {
    ref,
    isActive: state === 'active',
    isInViewport: isInViewport || state === 'active' || state === 'grace-period',
    state,
  };
}

export default useAnimationSlot;
