import { PhotoProvider, usePhotoContext } from './context/PhotoContext';
import { StepNavigator } from './components/StepNavigator';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import PhotoUploader from './components/PhotoUploader';
import { ImageCropper } from './components/ImageCropper';
import BackgroundChanger from './components/BackgroundChanger';
import PhotoExporter from './components/PhotoExporter';

/**
 * Inner content component that reads context state to determine
 * which step component to render.
 */
function IdPhotoContent() {
  const { state } = usePhotoContext();

  const renderStep = () => {
    switch (state.currentStep) {
      case 'upload':
        return <PhotoUploader />;
      case 'crop':
        return <ImageCropper />;
      case 'background':
        return <BackgroundChanger />;
      case 'export':
        return <PhotoExporter />;
      default:
        return <PhotoUploader />;
    }
  };

  return (
    <div className="p-4">
      <StepNavigator />
      <div className="mt-4">
        <ErrorBoundary>
          {renderStep()}
        </ErrorBoundary>
      </div>
    </div>
  );
}

/**
 * ID Photo module entry point.
 * Wraps everything in PhotoProvider so all child components share state.
 * ErrorBoundary catches uncaught errors in step components (Canvas OOM, etc.)
 * Requirements: 7.2, 7.3, 9.5
 */
export default function IdPhotoModule() {
  return (
    <PhotoProvider>
      <IdPhotoContent />
    </PhotoProvider>
  );
}
