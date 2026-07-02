// src/components/EventForm.tsx
// 事件录入/编辑表单组件 — 逐字段实时验证、字段旁独立错误信息
// 禁止 dangerouslySetInnerHTML，所有用户内容通过 JSX 渲染

import { useState, useCallback, useMemo } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  validateTitle,
  validateDate,
  validateDescription,
  validateCategory,
  validateSentiment,
} from '@/lib/event-validator';
import { getLocalToday, addYears } from '@/lib/date-utils';
import { CATEGORIES } from '@/constants/categories';
import type { EventNodeInput, EventCategory, EventSentiment } from '@/types/event';
import { SENTIMENT_LABELS } from '@/types/event';

export interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: EventNodeInput;
  onSubmit: (data: EventNodeInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FieldErrors {
  title: string | null;
  eventDate: string | null;
  description: string | null;
  category: string | null;
  sentiment: string | null;
}

/** 已触碰/修改过的字段跟踪 */
interface TouchedFields {
  title: boolean;
  eventDate: boolean;
  description: boolean;
  category: boolean;
  sentiment: boolean;
}

const DESCRIPTION_MAX_LENGTH = 2000;
const MIN_DATE = '1900-01-01';

export function EventForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EventFormProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [eventDate, setEventDate] = useState(initialData?.eventDate ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState<string>(initialData?.category ?? '');
  const [sentiment, setSentiment] = useState<string>(initialData?.sentiment ?? '');

  // Track which fields have been touched (for showing validation only after interaction)
  const [touched, setTouched] = useState<TouchedFields>({
    title: mode === 'edit',
    eventDate: mode === 'edit',
    description: mode === 'edit',
    category: mode === 'edit',
    sentiment: mode === 'edit',
  });

  // Confirm dialog state for unsaved changes
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Calculate max date (today + 10 years)
  const maxDate = useMemo(() => {
    const today = getLocalToday();
    return addYears(today, 10);
  }, []);

  // Track if form is dirty (has unsaved modifications)
  const isDirty = useMemo(() => {
    if (mode === 'create') {
      return title !== '' || eventDate !== '' || description !== '' || category !== '' || sentiment !== '';
    }
    // In edit mode, compare with initial data
    return (
      title !== (initialData?.title ?? '') ||
      eventDate !== (initialData?.eventDate ?? '') ||
      description !== (initialData?.description ?? '') ||
      category !== (initialData?.category ?? '') ||
      sentiment !== (initialData?.sentiment ?? '')
    );
  }, [title, eventDate, description, category, sentiment, initialData, mode]);

  // Real-time validation errors
  const errors: FieldErrors = useMemo(() => {
    const titleResult = validateTitle(title);
    const dateResult = validateDate(eventDate || undefined);
    const descResult = validateDescription(description);
    const catResult = validateCategory(category || undefined);
    const sentResult = validateSentiment(sentiment || undefined);

    return {
      title: titleResult.valid ? null : titleResult.errors[0]?.message ?? null,
      eventDate: dateResult.valid ? null : dateResult.errors[0]?.message ?? null,
      description: descResult.valid ? null : descResult.errors[0]?.message ?? null,
      category: catResult.valid ? null : catResult.errors[0]?.message ?? null,
      sentiment: sentResult.valid ? null : sentResult.errors[0]?.message ?? null,
    };
  }, [title, eventDate, description, category, sentiment]);

  // Check if form has any validation errors
  const hasErrors = useMemo(() => {
    return Object.values(errors).some((err) => err !== null);
  }, [errors]);

  // Check if form is pristine (nothing touched / no interaction in create mode)
  const isPristine = useMemo(() => {
    if (mode === 'create') {
      return !Object.values(touched).some(Boolean);
    }
    return false;
  }, [touched, mode]);

  // Mark field as touched on blur
  const handleBlur = useCallback((field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Handle cancel with unsaved changes check
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);

  const handleConfirmCancel = useCallback(() => {
    setShowConfirmDialog(false);
    onCancel();
  }, [onCancel]);

  const handleDismissConfirm = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched to show all errors
      setTouched({
        title: true,
        eventDate: true,
        description: true,
        category: true,
        sentiment: true,
      });

      if (hasErrors) {
        return;
      }

      const formData: EventNodeInput = {
        title: title.trim(),
        eventDate,
        description,
        category: category as EventCategory,
        sentiment: sentiment as EventSentiment,
      };

      await onSubmit(formData);
    },
    [hasErrors, title, eventDate, description, category, sentiment, onSubmit]
  );

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-4 sm:p-6"
        noValidate
        aria-label={mode === 'create' ? '添加事件' : '编辑事件'}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {mode === 'create' ? '添加事件' : '编辑事件'}
        </h2>

        {/* Title Field */}
        <div>
          <label
            htmlFor="event-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            事件标题 <span className="text-red-500">*</span>
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleBlur('title')}
            maxLength={100}
            placeholder="请输入事件标题"
            aria-required="true"
            aria-invalid={touched.title && errors.title !== null}
            aria-describedby={touched.title && errors.title ? 'title-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              touched.title && errors.title
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          />
          {touched.title && errors.title && (
            <p id="title-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label
            htmlFor="event-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            事件日期 <span className="text-red-500">*</span>
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => {
              setEventDate(e.target.value);
              setTouched((prev) => ({ ...prev, eventDate: true }));
            }}
            onBlur={() => handleBlur('eventDate')}
            min={MIN_DATE}
            max={maxDate}
            aria-required="true"
            aria-invalid={touched.eventDate && errors.eventDate !== null}
            aria-describedby={touched.eventDate && errors.eventDate ? 'date-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              touched.eventDate && errors.eventDate
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          />
          {touched.eventDate && errors.eventDate && (
            <p id="date-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.eventDate}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div>
          <label
            htmlFor="event-category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            事件分类 <span className="text-red-500">*</span>
          </label>
          <select
            id="event-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setTouched((prev) => ({ ...prev, category: true }));
            }}
            onBlur={() => handleBlur('category')}
            aria-required="true"
            aria-invalid={touched.category && errors.category !== null}
            aria-describedby={touched.category && errors.category ? 'category-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              touched.category && errors.category
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          >
            <option value="">请选择分类</option>
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
          {touched.category && errors.category && (
            <p id="category-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.category}
            </p>
          )}
        </div>

        {/* Sentiment Field */}
        <div>
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              情感色彩 <span className="text-red-500">*</span>
            </legend>
            <div
              className="flex gap-4"
              role="radiogroup"
              aria-required="true"
              aria-invalid={touched.sentiment && errors.sentiment !== null}
              aria-describedby={touched.sentiment && errors.sentiment ? 'sentiment-error' : undefined}
            >
              {(Object.entries(SENTIMENT_LABELS) as [EventSentiment, string][]).map(
                ([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-1.5 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="sentiment"
                      value={value}
                      checked={sentiment === value}
                      onChange={(e) => {
                        setSentiment(e.target.value);
                        setTouched((prev) => ({ ...prev, sentiment: true }));
                      }}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-400"
                    />
                    <span>{label}</span>
                  </label>
                )
              )}
            </div>
          </fieldset>
          {touched.sentiment && errors.sentiment && (
            <p id="sentiment-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.sentiment}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="event-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            事件描述
          </label>
          <textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={4}
            placeholder="描述这个时刻的细节（可选）"
            aria-invalid={touched.description && errors.description !== null}
            aria-describedby="description-count description-error"
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y ${
              touched.description && errors.description
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {touched.description && errors.description ? (
              <p id="description-error" className="text-xs text-red-600" role="alert">
                {errors.description}
              </p>
            ) : (
              <span />
            )}
            <span
              id="description-count"
              className={`text-xs ${
                description.length > DESCRIPTION_MAX_LENGTH
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
              aria-live="polite"
            >
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting || hasErrors || isPristine}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors min-w-[44px] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting
              ? '保存中...'
              : mode === 'create'
                ? '添加'
                : '保存'}
          </button>
        </div>
      </form>

      {/* Unsaved changes confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="确认取消"
        message="您有未保存的修改，确定要取消吗？"
        confirmText="确定"
        cancelText="继续编辑"
        onConfirm={handleConfirmCancel}
        onCancel={handleDismissConfirm}
      />
    </>
  );
}
