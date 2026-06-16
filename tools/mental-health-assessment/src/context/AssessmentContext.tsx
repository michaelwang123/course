import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ScaleItem } from '@/types';

export interface AssessmentState {
  sessionId: string | null;
  scaleId: string | null;
  scaleName: string;
  participantName: string;
  jobType: '月嫂' | '老人护理' | null;
  items: ScaleItem[];
  answers: Record<string, number>; // itemId -> selectedScore
  currentIndex: number;
  isSubmitting: boolean;
  error: string | null;
}

export type AssessmentAction =
  | {
      type: 'INIT_SESSION';
      payload: {
        sessionId: string;
        scaleId: string;
        scaleName: string;
        participantName: string;
        jobType: '月嫂' | '老人护理';
        items: ScaleItem[];
      };
    }
  | { type: 'SET_ANSWER'; payload: { itemId: string; score: number } }
  | { type: 'GO_NEXT' }
  | { type: 'GO_PREV' }
  | { type: 'GO_TO'; payload: number }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | {
      type: 'RESTORE_SESSION';
      payload: {
        sessionId: string;
        scaleId: string;
        scaleName: string;
        participantName: string;
        jobType: '月嫂' | '老人护理';
        answers: Record<string, number>;
        currentIndex: number;
      };
    }
  | { type: 'RESET' };

const initialState: AssessmentState = {
  sessionId: null,
  scaleId: null,
  scaleName: '',
  participantName: '',
  jobType: null,
  items: [],
  answers: {},
  currentIndex: 0,
  isSubmitting: false,
  error: null,
};

export function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction
): AssessmentState {
  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...initialState,
        sessionId: action.payload.sessionId,
        scaleId: action.payload.scaleId,
        scaleName: action.payload.scaleName,
        participantName: action.payload.participantName,
        jobType: action.payload.jobType,
        items: action.payload.items,
        answers: {},
        currentIndex: 0,
        isSubmitting: false,
        error: null,
      };

    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.itemId]: action.payload.score,
        },
      };

    case 'GO_NEXT':
      return {
        ...state,
        currentIndex: Math.min(
          state.currentIndex + 1,
          state.items.length - 1
        ),
      };

    case 'GO_PREV':
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      };

    case 'GO_TO': {
      const maxIndex = Math.max(state.items.length - 1, 0);
      const clampedIndex = Math.max(0, Math.min(action.payload, maxIndex));
      return {
        ...state,
        currentIndex: clampedIndex,
      };
    }

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'RESTORE_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        scaleId: action.payload.scaleId,
        scaleName: action.payload.scaleName,
        participantName: action.payload.participantName,
        jobType: action.payload.jobType,
        answers: action.payload.answers,
        currentIndex: action.payload.currentIndex,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface AssessmentContextValue {
  state: AssessmentState;
  dispatch: React.Dispatch<AssessmentAction>;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

interface AssessmentProviderProps {
  children: ReactNode;
}

export function AssessmentProvider({ children }: AssessmentProviderProps) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessmentContext(): AssessmentContextValue {
  const context = useContext(AssessmentContext);
  if (context === null) {
    throw new Error(
      'useAssessmentContext must be used within an AssessmentProvider'
    );
  }
  return context;
}
