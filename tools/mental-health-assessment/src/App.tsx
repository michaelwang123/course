import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Layout } from '@/components/Layout';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { HomePage } from '@/pages/HomePage';
import { ParticipantInfoPage } from '@/pages/ParticipantInfoPage';
import { AssessmentPage } from '@/pages/AssessmentPage';
import { ResultPage } from '@/pages/ResultPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { HistoryDetailPage } from '@/pages/HistoryDetailPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { ScaleListPage } from '@/pages/admin/ScaleListPage';
import { ScaleFormPage } from '@/pages/admin/ScaleFormPage';
import { RecordsPage } from '@/pages/admin/RecordsPage';

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AssessmentProvider>
          <Routes>
            {/* Public routes — 每个路由独立错误边界 */}
            <Route path="/" element={
              <Layout>
                <RouteErrorBoundary fallbackPath="/" fallbackLabel="刷新首页">
                  <HomePage />
                </RouteErrorBoundary>
              </Layout>
            } />
            <Route path="/info/:scaleId" element={
              <Layout>
                <RouteErrorBoundary fallbackPath="/" fallbackLabel="返回首页">
                  <ParticipantInfoPage />
                </RouteErrorBoundary>
              </Layout>
            } />
            <Route path="/assessment" element={
              <Layout>
                <RouteErrorBoundary fallbackPath="/" fallbackLabel="返回首页">
                  <AssessmentPage />
                </RouteErrorBoundary>
              </Layout>
            } />
            <Route path="/result/:sessionId" element={
              <Layout>
                <RouteErrorBoundary fallbackPath="/" fallbackLabel="返回首页">
                  <ResultPage />
                </RouteErrorBoundary>
              </Layout>
            } />
            <Route path="/history" element={
              <Layout>
                <RouteErrorBoundary fallbackPath="/" fallbackLabel="返回首页">
                  <HistoryPage />
                </RouteErrorBoundary>
              </Layout>
            } />
            <Route path="/history/:sessionId" element={
              <Layout>
                <RouteErrorBoundary fallbackPath="/history" fallbackLabel="返回历史记录">
                  <HistoryDetailPage />
                </RouteErrorBoundary>
              </Layout>
            } />

            {/* Admin routes — 独立错误边界 */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="scales" element={
                <RouteErrorBoundary fallbackPath="/admin/scales" fallbackLabel="刷新列表">
                  <ScaleListPage />
                </RouteErrorBoundary>
              } />
              <Route path="scales/new" element={
                <RouteErrorBoundary fallbackPath="/admin/scales" fallbackLabel="返回列表">
                  <ScaleFormPage />
                </RouteErrorBoundary>
              } />
              <Route path="scales/:id/edit" element={
                <RouteErrorBoundary fallbackPath="/admin/scales" fallbackLabel="返回列表">
                  <ScaleFormPage />
                </RouteErrorBoundary>
              } />
              <Route path="records" element={
                <RouteErrorBoundary fallbackPath="/admin/records" fallbackLabel="刷新记录">
                  <RecordsPage />
                </RouteErrorBoundary>
              } />
            </Route>
          </Routes>
        </AssessmentProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
