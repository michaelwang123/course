import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateParticipantName } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { useAssessmentContext } from '@/context/AssessmentContext';
import { useScaleItems } from '@/hooks/useScaleItems';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

type JobType = '月嫂' | '老人护理';

/**
 * 基本信息填写页面
 * 测评者选择量表后，在此页面填写姓名和从业类型
 * 提交后创建 Assessment_Session 并跳转到测评页面
 */
export function ParticipantInfoPage() {
  const { scaleId } = useParams<{ scaleId: string }>();
  const navigate = useNavigate();
  const { dispatch } = useAssessmentContext();

  // Form state
  const [name, setName] = useState('');
  const [jobType, setJobType] = useState<JobType | null>(null);

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [jobTypeError, setJobTypeError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load single scale info (替代 useScales() 全量拉取)
  const [scaleName, setScaleName] = useState<string>('');
  useEffect(() => {
    if (!scaleId) return;
    let cancelled = false;
    async function fetchScaleName() {
      const { data } = await supabase
        .from('mha_scales')
        .select('name')
        .eq('id', scaleId)
        .single();
      if (!cancelled && data) {
        setScaleName(data.name);
      }
    }
    fetchScaleName();
    return () => { cancelled = true; };
  }, [scaleId]);

  // Load scale items for context initialization
  const { items, loading: itemsLoading, error: itemsError } = useScaleItems(scaleId ?? null);

  function validateForm(): boolean {
    let valid = true;

    // Validate name
    const nameResult = validateParticipantName(name);
    if (!nameResult.valid) {
      setNameError(nameResult.errors[0]?.message ?? '姓名格式不正确');
      valid = false;
    } else {
      setNameError(null);
    }

    // Validate job type
    if (!jobType) {
      setJobTypeError('请选择从业类型');
      valid = false;
    } else {
      setJobTypeError(null);
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Clear previous submit error
    setSubmitError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!scaleId) {
      setSubmitError('量表信息缺失，请返回重新选择');
      return;
    }

    if (items.length === 0) {
      setSubmitError('量表题目加载失败，请返回重试');
      return;
    }

    setIsSubmitting(true);

    try {
      // 直接存储原始值（React 渲染时自动转义 XSS）
      // 不对姓名做 HTML 实体编码，避免双重编码问题
      const trimmedName = name.trim();

      // Create assessment session in Supabase
      const { data, error } = await supabase
        .from('mha_assessment_sessions')
        .insert({
          participant_name: trimmedName,
          job_type: jobType,
          scale_id: scaleId,
        })
        .select('id')
        .single();

      if (error) {
        setSubmitError('测评创建失败，请重试');
        setIsSubmitting(false);
        return;
      }

      // Initialize assessment context with session data
      dispatch({
        type: 'INIT_SESSION',
        payload: {
          sessionId: data.id,
          scaleId,
          scaleName: scaleName,
          participantName: trimmedName,
          jobType: jobType!,
          items,
        },
      });

      // Navigate to assessment page
      navigate('/assessment');
    } catch {
      setSubmitError('测评创建失败，请重试');
      setIsSubmitting(false);
    }
  }

  // Handle name input change — clear error on edit
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  }

  // Handle job type selection — clear error on selection
  function handleJobTypeSelect(type: JobType) {
    setJobType(type);
    if (jobTypeError) {
      setJobTypeError(null);
    }
  }

  // Show loading while items are loading
  if (itemsLoading) {
    return <LoadingSpinner />;
  }

  // Show error if items failed to load
  if (itemsError) {
    return (
      <ErrorMessage
        message="量表数据加载失败，请返回重试"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">填写基本信息</h1>
        {scaleName && (
          <p className="mt-1 text-sm text-gray-600">
            即将开始：{scaleName}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Name field */}
        <div>
          <label
            htmlFor="participant-name"
            className="block text-base font-medium text-gray-700"
          >
            姓名
          </label>
          <input
            id="participant-name"
            type="text"
            maxLength={20}
            value={name}
            onChange={handleNameChange}
            placeholder="请输入您的姓名"
            className={`mt-2 block w-full rounded-lg border px-4 py-3 text-base leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              nameError
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300'
            }`}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError && (
            <p
              id="name-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Job type field */}
        <fieldset>
          <legend className="block text-base font-medium text-gray-700">
            从业类型
          </legend>
          <div className="mt-2 space-y-3">
            <button
              type="button"
              onClick={() => handleJobTypeSelect('月嫂')}
              className={`w-full min-h-[44px] min-w-[44px] flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-base leading-relaxed transition-colors ${
                jobType === '月嫂'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
              }`}
              aria-pressed={jobType === '月嫂'}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  jobType === '月嫂' ? 'border-green-500' : 'border-gray-400'
                }`}
              >
                {jobType === '月嫂' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                )}
              </span>
              <span className="text-[16px] leading-relaxed">月嫂</span>
            </button>

            <button
              type="button"
              onClick={() => handleJobTypeSelect('老人护理')}
              className={`w-full min-h-[44px] min-w-[44px] flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-base leading-relaxed transition-colors ${
                jobType === '老人护理'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
              }`}
              aria-pressed={jobType === '老人护理'}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  jobType === '老人护理' ? 'border-green-500' : 'border-gray-400'
                }`}
              >
                {jobType === '老人护理' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                )}
              </span>
              <span className="text-[16px] leading-relaxed">老人护理</span>
            </button>
          </div>
          {jobTypeError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {jobTypeError}
            </p>
          )}
        </fieldset>

        {/* Submit error */}
        {submitError && (
          <ErrorMessage message={submitError} />
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? '正在创建...' : '开始测评'}
        </button>
      </form>
    </div>
  );
}
