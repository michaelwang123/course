import { useNavigate } from 'react-router-dom';
import { useScales } from '@/hooks/useScales';
import { Disclaimer } from '@/components/Disclaimer';
import { ScaleCard } from '@/components/ScaleCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

/**
 * 测评首页
 * 展示免责声明和可用量表列表，支持选择量表开始测评
 */
export function HomePage() {
  const { scales, loading, error } = useScales();
  const navigate = useNavigate();

  function handleScaleSelect(scaleId: string) {
    navigate(`/info/${scaleId}`);
  }

  return (
    <div className="space-y-6">
      {/* 免责声明 */}
      <div className="rounded-lg bg-green-50 p-4">
        <Disclaimer />
      </div>

      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">心理健康测评</h1>
        <p className="mt-1 text-sm text-gray-600">
          请选择一个量表开始测评
        </p>
      </div>

      {/* 内容区域：加载、错误、空状态或量表列表 */}
      {loading && <LoadingSpinner />}

      {!loading && error && (
        <ErrorMessage
          message="当前无法加载测评量表，请稍后重试"
          onRetry={() => window.location.reload()}
        />
      )}

      {!loading && !error && scales.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-600">当前暂无可用测评</p>
        </div>
      )}

      {!loading && !error && scales.length > 0 && (
        <div className="space-y-4">
          {scales.map((scale) => (
            <ScaleCard
              key={scale.id}
              name={scale.name}
              description={scale.description}
              itemCount={scale.itemCount}
              estimatedMinutes={scale.estimatedMinutes}
              onClick={() => handleScaleSelect(scale.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
