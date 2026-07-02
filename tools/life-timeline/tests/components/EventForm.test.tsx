import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventForm } from '@/components/EventForm';
import type { EventNodeInput } from '@/types/event';

// Mock date-utils to return deterministic values
vi.mock('@/lib/date-utils', () => ({
  getLocalToday: () => '2024-06-15',
  addYears: (_dateStr: string, years: number) => `${2024 + years}-06-15`,
  parseLocalDate: (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  },
  formatLocalDate: (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
  isValidDateFormat: (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr),
}));

describe('EventForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm(props: Partial<Parameters<typeof EventForm>[0]> = {}) {
    return render(
      <EventForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  }

  describe('Renders all fields in create mode', () => {
    it('should render title, date, category, sentiment, and description fields', () => {
      renderForm();

      expect(screen.getByLabelText(/事件标题/)).toBeInTheDocument();
      expect(screen.getByLabelText(/事件日期/)).toBeInTheDocument();
      expect(screen.getByLabelText(/事件分类/)).toBeInTheDocument();
      expect(screen.getByText(/情感色彩/)).toBeInTheDocument();
      expect(screen.getByLabelText(/事件描述/)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    });
  });

  describe('Title validation', () => {
    it('should show error after blur when title is empty', () => {
      renderForm();

      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);

      expect(screen.getByText('请输入事件标题')).toBeInTheDocument();
    });
  });

  describe('Date validation', () => {
    it('should show error when no date is selected after blur', () => {
      renderForm();

      const dateInput = screen.getByLabelText(/事件日期/);
      fireEvent.focus(dateInput);
      fireEvent.blur(dateInput);

      expect(screen.getByText('请选择事件日期')).toBeInTheDocument();
    });
  });

  describe('Category validation', () => {
    it('should show error when no category is selected after blur', () => {
      renderForm();

      const categorySelect = screen.getByLabelText(/事件分类/);
      fireEvent.focus(categorySelect);
      fireEvent.blur(categorySelect);

      expect(screen.getByText('请选择有效的事件分类')).toBeInTheDocument();
    });
  });

  describe('Sentiment validation', () => {
    it('should show error when no sentiment is selected after form submit attempt', async () => {
      renderForm();

      // Fill required fields except sentiment
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });
      fireEvent.blur(titleInput);

      const dateInput = screen.getByLabelText(/事件日期/);
      fireEvent.change(dateInput, { target: { value: '2024-03-15' } });

      const categorySelect = screen.getByLabelText(/事件分类/);
      fireEvent.change(categorySelect, { target: { value: 'work' } });

      // Try to submit - this will mark all fields as touched
      const form = screen.getByRole('form', { name: /添加事件/ });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('请选择有效的情感色彩')).toBeInTheDocument();
      });
    });
  });

  describe('Description character count', () => {
    it('should show X/2000 counter', () => {
      renderForm();

      expect(screen.getByText('0/2000')).toBeInTheDocument();
    });

    it('should update counter as text is typed', () => {
      renderForm();

      const descInput = screen.getByLabelText(/事件描述/);
      fireEvent.change(descInput, { target: { value: 'Hello' } });

      expect(screen.getByText('5/2000')).toBeInTheDocument();
    });
  });

  describe('Submit disabled', () => {
    it('should disable submit button when form has validation errors', () => {
      renderForm();

      // In create mode with no input, the form is pristine so submit is disabled
      const submitBtn = screen.getByRole('button', { name: '添加' });
      expect(submitBtn).toBeDisabled();
    });

    it('should disable submit button when form is pristine in create mode', () => {
      renderForm();

      const submitBtn = screen.getByRole('button', { name: '添加' });
      expect(submitBtn).toBeDisabled();
    });

    it('should remain disabled after touching fields if errors exist', () => {
      renderForm();

      // Touch title but leave it empty
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);

      const submitBtn = screen.getByRole('button', { name: '添加' });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('Successful submit', () => {
    it('should call onSubmit with correct EventNodeInput when all fields are valid', async () => {
      renderForm();

      // Fill title
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: '  我的毕业典礼  ' } });
      fireEvent.blur(titleInput);

      // Fill date
      const dateInput = screen.getByLabelText(/事件日期/);
      fireEvent.change(dateInput, { target: { value: '2024-06-01' } });

      // Fill category
      const categorySelect = screen.getByLabelText(/事件分类/);
      fireEvent.change(categorySelect, { target: { value: 'education' } });

      // Fill sentiment
      const positiveRadio = screen.getByRole('radio', { name: '正面' });
      fireEvent.click(positiveRadio);

      // Fill description
      const descInput = screen.getByLabelText(/事件描述/);
      fireEvent.change(descInput, { target: { value: '难忘的一天' } });

      // Submit
      const form = screen.getByRole('form', { name: /添加事件/ });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: '我的毕业典礼',
          eventDate: '2024-06-01',
          category: 'education',
          sentiment: 'positive',
          description: '难忘的一天',
        } satisfies EventNodeInput);
      });
    });

    it('should not call onSubmit when form has errors', async () => {
      renderForm();

      // Only fill partial data (missing required fields)
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: 'Test' } });
      fireEvent.blur(titleInput);

      const form = screen.getByRole('form', { name: /添加事件/ });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Unsaved changes cancel', () => {
    it('should show ConfirmDialog when form is dirty and cancel is clicked', () => {
      renderForm();

      // Make form dirty
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: 'Some title' } });

      // Click cancel
      const cancelBtn = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelBtn);

      // ConfirmDialog should appear
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('您有未保存的修改，确定要取消吗？')).toBeInTheDocument();
    });

    it('should call onCancel after confirming in ConfirmDialog', () => {
      renderForm();

      // Make form dirty
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: 'Dirty' } });

      // Click cancel
      const cancelBtn = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelBtn);

      // Confirm the dialog
      const confirmBtn = screen.getByRole('button', { name: '确定' });
      fireEvent.click(confirmBtn);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should dismiss dialog when continuing editing', () => {
      renderForm();

      // Make form dirty
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: 'Dirty' } });

      // Click cancel
      const cancelBtn = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelBtn);

      // Click "继续编辑" in dialog
      const continueBtn = screen.getByRole('button', { name: '继续编辑' });
      fireEvent.click(continueBtn);

      // Dialog should disappear, onCancel not called
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Clean cancel', () => {
    it('should call onCancel directly when form is not dirty', () => {
      renderForm();

      const cancelBtn = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    const initialData: EventNodeInput = {
      title: '原始标题',
      eventDate: '2023-12-25',
      description: '原始描述内容',
      category: 'travel',
      sentiment: 'positive',
    };

    it('should pre-fill initial data correctly', () => {
      renderForm({ mode: 'edit', initialData });

      expect(screen.getByLabelText(/事件标题/)).toHaveValue('原始标题');
      expect(screen.getByLabelText(/事件日期/)).toHaveValue('2023-12-25');
      expect(screen.getByLabelText(/事件分类/)).toHaveValue('travel');
      expect(screen.getByRole('radio', { name: '正面' })).toBeChecked();
      expect(screen.getByLabelText(/事件描述/)).toHaveValue('原始描述内容');
    });

    it('should show "编辑事件" heading and "保存" button in edit mode', () => {
      renderForm({ mode: 'edit', initialData });

      expect(screen.getByText('编辑事件')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('should detect dirty state when fields are changed in edit mode', () => {
      renderForm({ mode: 'edit', initialData });

      // Change title
      const titleInput = screen.getByLabelText(/事件标题/);
      fireEvent.change(titleInput, { target: { value: '修改后的标题' } });

      // Cancel should trigger confirm dialog
      const cancelBtn = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not show confirm dialog when no changes in edit mode', () => {
      renderForm({ mode: 'edit', initialData });

      // Cancel without changes
      const cancelBtn = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelBtn);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
