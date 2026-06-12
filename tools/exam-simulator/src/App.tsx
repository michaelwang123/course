import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import HomePage from './pages/HomePage';
import QuestionListPage from './pages/admin/QuestionListPage';
import { QuestionFormPage } from './pages/admin/QuestionFormPage';
import ExamConfigPage from './pages/exam/ExamConfigPage';
import ExamSessionPage from './pages/exam/ExamSessionPage';
import ExamResultPage from './pages/exam/ExamResultPage';
import HistoryListPage from './pages/history/HistoryListPage';
import HistoryDetailPage from './pages/history/HistoryDetailPage';

const NotFoundPage: React.FC = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-800">404</h2>
    <p className="text-gray-500 mt-2">页面未找到</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* ExamSessionPage has its own full-page layout with fixed banner - no Layout wrapper */}
            <Route path="/exam/session/:id" element={<ExamSessionPage />} />

            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin/questions" element={<QuestionListPage />} />
              <Route path="/admin/questions/new" element={<QuestionFormPage />} />
              <Route path="/admin/questions/:id/edit" element={<QuestionFormPage />} />
              <Route path="/exam/config" element={<ExamConfigPage />} />
              <Route path="/exam/result/:id" element={<ExamResultPage />} />
              <Route path="/history" element={<HistoryListPage />} />
              <Route path="/history/:id" element={<HistoryDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
