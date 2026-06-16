import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/sanitizer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ItemEditor } from '@/components/admin/ItemEditor';

/** Scale type options */
const SCALE_TYPES = ['抑郁', '焦虑', '综合症状', '一般健康'] as const;

/** Form-level item (without id/scaleId since those are assigned on save) */
interface FormItem {
  key: string;
  content: string;
  options: FormOption[];
  isReverseScored: boolean;
}

interface FormOption {
  text: string;
  score: number;
}

interface FormErrors {
  name?: string;
  description?: string;
  scaleType?: string;
  targetAudience?: string;
  scoringRuleDescription?: string;
  items?: string;
  [key: string]: string | undefined;
}

/**
 * 量表新建/编辑页面
 * - 根据路由参数判断新建或编辑模式
 * - 提供量表基本信息和题目编辑功能
 * - 验证后提交到 Supabase
 */
export function ScaleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scaleType, setScaleType] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState('');
  const [scoringRuleDescription, setScoringRuleDescription] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const generateKey = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const loadScaleData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);

    try {
      const { data: scaleData, error: scaleError } = await supabase
        .from('mha_scales')
        .select('*')
        .eq('id', id)
        .single();

      if (scaleError || !scaleData) {
        setLoadError('加载量表数据失败，请重试');
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('mha_scale_items')
        .select('*')
        .eq('scale_id', id)
        .order('item_order', { ascending: true });

      if (itemsError) {
        setLoadError('加载量表题目失败，请重试');
        return;
      }

      setName(scaleData.name || '');
      setDescription(scaleData.description || '');
      setScaleType(scaleData.scale_type || '');
      setTargetAudience(scaleData.target_audience || '');
      setScoringRuleDescription(
        typeof scaleData.scoring_rule === 'object'
          ? JSON.stringify(scaleData.scoring_rule)
          : (scaleData.scoring_rule || '')
      );

      const formItems: FormItem[] = (itemsData || []).map((item) => ({
        key: item.id || generateKey(),
        content: item.content || '',
        options: Array.isArray(item.options) ? item.options : [],
        isReverseScored: item.is_reverse_scored || false,
      }));
      setItems(formItems);
    } catch {
      setLoadError('加载量表数据失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      loadScaleData();
    }
  }, [isEditMode, loadScaleData]);

  // --- Validation ---

  function validate(): boolean {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = '该字段为必填项';
    } else if (trimmedName.length > 50) {
      newErrors.name = '量表名称不能超过50个字符';
    }

    if (description.length > 500) {
      newErrors.description = '量表简介不能超过500个字符';
    }

    if (!scaleType) {
      newErrors.scaleType = '该字段为必填项';
    }

    if (targetAudience.length > 200) {
      newErrors.targetAudience = '适用人群描述不能超过200个字符';
    }

    const trimmedScoring = scoringRuleDescription.trim();
    if (!trimmedScoring) {
      newErrors.scoringRuleDescription = '该字段为必填项';
    } else if (trimmedScoring.length > 1000) {
      newErrors.scoringRuleDescription = '评分规则说明不能超过1000个字符';
    }

    if (items.length === 0) {
      newErrors.items = '量表至少需要包含1道题目';
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.content.trim()) {
        newErrors[`item_${i}_content`] = '题干内容不能为空';
      } else if (item.content.length > 200) {
        newErrors[`item_${i}_content`] = '题干内容不能超过200个字符';
      }
      if (item.options.length < 2) {
        newErrors[`item_${i}_options`] = '每道题至少需要2个选项';
      } else if (item.options.length > 10) {
        newErrors[`item_${i}_options`] = '每道题最多10个选项';
      }
      for (let j = 0; j < item.options.length; j++) {
        const opt = item.options[j];
        if (!opt.text.trim()) {
          newErrors[`item_${i}_option_${j}_text`] = '选项文本不能为空';
        } else if (opt.text.length > 100) {
          newErrors[`item_${i}_option_${j}_text`] = '选项文本不能超过100个字符';
        }
        if (opt.score < 0 || opt.score > 10 || !Number.isInteger(opt.score)) {
          newErrors[`item_${i}_option_${j}_score`] = '分值必须为0-10之间的整数';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // --- Submit ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const sanitizedName = sanitizeInput(name.trim());
      const sanitizedDescription = sanitizeInput(description.trim());
      const sanitizedTargetAudience = sanitizeInput(targetAudience.trim());
      const sanitizedScoringRule = scoringRuleDescription.trim();

      let scoringRule: object;
      try {
        scoringRule = JSON.parse(sanitizedScoringRule);
      } catch {
        scoringRule = { type: 'direct', maxOptionScore: 4, description: sanitizedScoringRule };
      }

      const gradeThresholds = [
        { level: '正常', minScore: 0, maxScore: null, interpretation: '心理健康状况良好' },
      ];

      const scalePayload = {
        name: sanitizedName,
        description: sanitizedDescription,
        scale_type: scaleType,
        target_audience: sanitizedTargetAudience,
        item_count: items.length,
        estimated_minutes: Math.max(1, Math.ceil(items.length * 0.5)),
        scoring_rule: scoringRule,
        grade_thresholds: gradeThresholds,
      };

      let scaleId: string;

      if (isEditMode && id) {
        const { error: updateError } = await supabase
          .from('mha_scales').update(scalePayload).eq('id', id);
        if (updateError) {
          if (updateError.message?.includes('duplicate') || updateError.code === '23505') {
            setErrors({ name: '该量表名称已存在，请使用其他名称' });
            setSubmitting(false);
            return;
          }
          throw updateError;
        }
        scaleId = id;
        await supabase.from('mha_scale_items').delete().eq('scale_id', id);
      } else {
        const { data: insertedScale, error: insertError } = await supabase
          .from('mha_scales').insert(scalePayload).select('id').single();
        if (insertError) {
          if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
            setErrors({ name: '该量表名称已存在，请使用其他名称' });
            setSubmitting(false);
            return;
          }
          throw insertError;
        }
        scaleId = insertedScale.id;
      }

      if (items.length > 0) {
        const itemPayloads = items.map((item, index) => ({
          scale_id: scaleId,
          item_order: index + 1,
          content: sanitizeInput(item.content.trim()),
          options: item.options.map((opt) => ({
            text: sanitizeInput(opt.text.trim()),
            score: opt.score,
          })),
          is_reverse_scored: item.isReverseScored,
        }));

        const { error: itemsError } = await supabase
          .from('mha_scale_items').insert(itemPayloads);
        if (itemsError) throw itemsError;
      }

      setSuccessMessage(isEditMode ? '量表更新成功' : '量表创建成功');
      setTimeout(() => navigate('/admin/scales'), 1500);
    } catch {
      setErrors({ items: '保存失败，请检查网络后重试' });
    } finally {
      setSubmitting(false);
    }
  }

  // --- Item management ---

  function addItem() {
    setItems([...items, {
      key: generateKey(),
      content: '',
      options: [{ text: '', score: 0 }, { text: '', score: 1 }],
      isReverseScored: false,
    }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItemContent(index: number, content: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], content };
    setItems(updated);
  }

  function updateItemReverseScored(index: number, isReverseScored: boolean) {
    const updated = [...items];
    updated[index] = { ...updated[index], isReverseScored };
    setItems(updated);
  }

  function addOption(itemIndex: number) {
    const updated = [...items];
    const item = { ...updated[itemIndex] };
    item.options = [...item.options, { text: '', score: item.options.length }];
    updated[itemIndex] = item;
    setItems(updated);
  }

  function removeOption(itemIndex: number, optionIndex: number) {
    const updated = [...items];
    const item = { ...updated[itemIndex] };
    item.options = item.options.filter((_, i) => i !== optionIndex);
    updated[itemIndex] = item;
    setItems(updated);
  }

  function updateOptionText(itemIndex: number, optionIndex: number, text: string) {
    const updated = [...items];
    const item = { ...updated[itemIndex] };
    item.options = [...item.options];
    item.options[optionIndex] = { ...item.options[optionIndex], text };
    updated[itemIndex] = item;
    setItems(updated);
  }

  function updateOptionScore(itemIndex: number, optionIndex: number, score: number) {
    const updated = [...items];
    const item = { ...updated[itemIndex] };
    item.options = [...item.options];
    item.options[optionIndex] = { ...item.options[optionIndex], score };
    updated[itemIndex] = item;
    setItems(updated);
  }

  // --- Render ---

  if (isEditMode && loading) return <LoadingSpinner />;
  if (isEditMode && loadError) return <ErrorMessage message={loadError} onRetry={loadScaleData} />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditMode ? '编辑量表' : '新建量表'}
        </h2>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Basic fields section */}
        <div className="mb-8 rounded-lg border border-green-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-gray-900">基本信息</h3>

          <div className="mb-4">
            <label htmlFor="scale-name" className="mb-1 block text-sm font-medium text-gray-700">
              量表名称 <span className="text-red-500">*</span>
            </label>
            <input id="scale-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              maxLength={50} placeholder="请输入量表名称（最多50字符）"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              aria-describedby={errors.name ? 'name-error' : undefined} aria-invalid={!!errors.name} />
            {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="scale-description" className="mb-1 block text-sm font-medium text-gray-700">量表简介</label>
            <textarea id="scale-description" value={description} onChange={(e) => setDescription(e.target.value)}
              maxLength={500} rows={3} placeholder="请输入量表简介（最多500字符）"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              aria-describedby={errors.description ? 'description-error' : undefined} aria-invalid={!!errors.description} />
            {errors.description && <p id="description-error" className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="scale-type" className="mb-1 block text-sm font-medium text-gray-700">
              量表类型 <span className="text-red-500">*</span>
            </label>
            <select id="scale-type" value={scaleType} onChange={(e) => setScaleType(e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.scaleType ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              aria-describedby={errors.scaleType ? 'scaletype-error' : undefined} aria-invalid={!!errors.scaleType}>
              <option value="">请选择量表类型</option>
              {SCALE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            {errors.scaleType && <p id="scaletype-error" className="mt-1 text-xs text-red-600">{errors.scaleType}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="scale-audience" className="mb-1 block text-sm font-medium text-gray-700">适用人群描述</label>
            <input id="scale-audience" type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
              maxLength={200} placeholder="请输入适用人群描述（最多200字符）"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.targetAudience ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              aria-describedby={errors.targetAudience ? 'audience-error' : undefined} aria-invalid={!!errors.targetAudience} />
            {errors.targetAudience && <p id="audience-error" className="mt-1 text-xs text-red-600">{errors.targetAudience}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="scale-scoring" className="mb-1 block text-sm font-medium text-gray-700">
              评分规则说明 <span className="text-red-500">*</span>
            </label>
            <textarea id="scale-scoring" value={scoringRuleDescription} onChange={(e) => setScoringRuleDescription(e.target.value)}
              maxLength={1000} rows={4} placeholder="请输入评分规则说明（最多1000字符），可输入 JSON 格式或文字描述"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.scoringRuleDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              aria-describedby={errors.scoringRuleDescription ? 'scoring-error' : undefined} aria-invalid={!!errors.scoringRuleDescription} />
            {errors.scoringRuleDescription && <p id="scoring-error" className="mt-1 text-xs text-red-600">{errors.scoringRuleDescription}</p>}
          </div>
        </div>

        {/* Items section — uses extracted ItemEditor component */}
        <div className="mb-8 rounded-lg border border-green-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">题目列表 ({items.length} 题)</h3>
            <button type="button" onClick={addItem}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors">
              添加题目
            </button>
          </div>

          {errors.items && <p className="mb-4 text-xs text-red-600">{errors.items}</p>}

          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">暂无题目，请点击"添加题目"开始录入</p>
          )}

          <div className="space-y-6">
            {items.map((item, itemIndex) => (
              <ItemEditor
                key={item.key}
                index={itemIndex}
                content={item.content}
                options={item.options}
                isReverseScored={item.isReverseScored}
                errors={errors}
                onContentChange={(content) => updateItemContent(itemIndex, content)}
                onReverseScoredChange={(val) => updateItemReverseScored(itemIndex, val)}
                onOptionTextChange={(optIdx, text) => updateOptionText(itemIndex, optIdx, text)}
                onOptionScoreChange={(optIdx, score) => updateOptionScore(itemIndex, optIdx, score)}
                onAddOption={() => addOption(itemIndex)}
                onRemoveOption={(optIdx) => removeOption(itemIndex, optIdx)}
                onRemove={() => removeItem(itemIndex)}
              />
            ))}
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting}
            className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? '保存中...' : (isEditMode ? '保存修改' : '创建量表')}
          </button>
          <button type="button" onClick={() => navigate('/admin/scales')}
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
