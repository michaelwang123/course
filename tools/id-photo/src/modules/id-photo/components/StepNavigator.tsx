import { usePhotoContext } from '../context/PhotoContext';
import type { PhotoState } from '../context/PhotoContext';

interface StepConfig {
  key: PhotoState['currentStep'];
  label: string;
  number: number;
}

const STEPS: StepConfig[] = [
  { key: 'upload', label: '上传', number: 1 },
  { key: 'crop', label: '裁剪', number: 2 },
  { key: 'background', label: '换底色', number: 3 },
  { key: 'export', label: '导出', number: 4 },
];

export function StepNavigator() {
  const { state, dispatch } = usePhotoContext();
  const { currentStep, unlockedSteps } = state;

  function handleStepClick(step: PhotoState['currentStep']) {
    if (unlockedSteps.has(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  }

  return (
    <nav aria-label="操作步骤" className="w-full">
      <ol className="flex flex-wrap gap-1 sm:gap-2">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.key;
          const isUnlocked = unlockedSteps.has(step.key);
          const isLocked = !isUnlocked;

          return (
            <li key={step.key} className="flex-1 min-w-[4.5rem]">
              <button
                type="button"
                onClick={() => handleStepClick(step.key)}
                disabled={isLocked}
                aria-current={isCurrent ? 'step' : undefined}
                className={`
                  w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isUnlocked
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                  }
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                    ${isCurrent
                      ? 'bg-white/20 text-white'
                      : isUnlocked
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  {step.number}
                </span>
                <span>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
