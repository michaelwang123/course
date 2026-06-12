import { QuestionInput, ExamConfigInput, ValidationResult } from '../types';

/**
 * Validates a QuestionInput object against all field constraints.
 * Returns { valid: true, errors: {} } if all constraints are satisfied,
 * or { valid: false, errors: { fieldName: errorMessage } } with specific violations.
 */
export function validateQuestion(input: QuestionInput): ValidationResult {
  const errors: Record<string, string> = {};

  // content: 1-2000 characters
  if (!input.content || input.content.length < 1) {
    errors.content = '题目内容不能为空';
  } else if (input.content.length > 2000) {
    errors.content = '题目内容不能超过2000个字符';
  }

  // score: integer 1-100
  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 100) {
    errors.score = '分值必须是1到100之间的整数';
  }

  // subject: 1-50 characters
  if (!input.subject || input.subject.length < 1) {
    errors.subject = '科目不能为空';
  } else if (input.subject.length > 50) {
    errors.subject = '科目名称不能超过50个字符';
  }

  // options: each option 1-200 characters
  if (!Array.isArray(input.options) || input.options.length === 0) {
    errors.options = '选项列表不能为空';
  } else {
    const invalidOption = input.options.find(
      (opt) => typeof opt !== 'string' || opt.length < 1 || opt.length > 200
    );
    if (invalidOption !== undefined) {
      errors.options = '每个选项长度必须在1到200个字符之间';
    }
  }

  // Type-specific validation
  if (input.type === 'boolean') {
    validateBooleanQuestion(input, errors);
  } else if (input.type === 'single') {
    validateSingleQuestion(input, errors);
  } else if (input.type === 'multiple') {
    validateMultipleQuestion(input, errors);
  } else {
    errors.type = '题目类型必须是 single、multiple 或 boolean';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateBooleanQuestion(
  input: QuestionInput,
  errors: Record<string, string>
): void {
  // Options must be exactly ["正确", "错误"]
  if (
    !Array.isArray(input.options) ||
    input.options.length !== 2 ||
    input.options[0] !== '正确' ||
    input.options[1] !== '错误'
  ) {
    errors.options = '判断题选项必须为["正确", "错误"]';
  }

  // correctAnswer must be one of the two options (string)
  if (
    typeof input.correctAnswer !== 'string' ||
    (input.correctAnswer !== '正确' && input.correctAnswer !== '错误')
  ) {
    errors.correctAnswer = '判断题正确答案必须是"正确"或"错误"';
  }
}

function validateSingleQuestion(
  input: QuestionInput,
  errors: Record<string, string>
): void {
  // 2-10 options
  if (Array.isArray(input.options)) {
    if (input.options.length < 2 || input.options.length > 10) {
      errors.options = '单选题选项数量必须在2到10个之间';
    }
  }

  // correctAnswer must be a single string matching one option
  if (typeof input.correctAnswer !== 'string') {
    errors.correctAnswer = '单选题正确答案必须是一个字符串';
  } else if (
    Array.isArray(input.options) &&
    !input.options.includes(input.correctAnswer)
  ) {
    errors.correctAnswer = '单选题正确答案必须是选项之一';
  }
}

function validateMultipleQuestion(
  input: QuestionInput,
  errors: Record<string, string>
): void {
  // 3-10 options
  if (Array.isArray(input.options)) {
    if (input.options.length < 3 || input.options.length > 10) {
      errors.options = '多选题选项数量必须在3到10个之间';
    }
  }

  // correctAnswer must be an array with 2 to (options.length - 1) elements
  if (!Array.isArray(input.correctAnswer)) {
    errors.correctAnswer = '多选题正确答案必须是一个数组';
  } else {
    const answers = input.correctAnswer;
    const optionsLength = Array.isArray(input.options) ? input.options.length : 0;
    const minAnswers = 2;
    const maxAnswers = optionsLength - 1;

    if (answers.length < minAnswers || answers.length > maxAnswers) {
      errors.correctAnswer = `多选题正确答案数量必须在2到${maxAnswers}个之间`;
    } else if (Array.isArray(input.options)) {
      // Each answer must match an option
      const invalidAnswer = answers.find((a) => !input.options.includes(a));
      if (invalidAnswer !== undefined) {
        errors.correctAnswer = '多选题正确答案必须都是选项之一';
      }
    }
  }
}

/**
 * Validates an ExamConfigInput object against range constraints.
 * Returns { valid: true, errors: {} } if all constraints are satisfied,
 * or { valid: false, errors: { fieldName: errorMessage } } with specific violations.
 */
export function validateExamConfig(
  config: ExamConfigInput,
  availableCount: number
): ValidationResult {
  const errors: Record<string, string> = {};

  // studentName: 1-20 characters
  if (!config.studentName || config.studentName.length < 1) {
    errors.studentName = '考生姓名不能为空';
  } else if (config.studentName.length > 20) {
    errors.studentName = '考生姓名不能超过20个字符';
  }

  // durationMinutes: multiple of 5 in [5, 120]
  if (
    !Number.isInteger(config.durationMinutes) ||
    config.durationMinutes < 5 ||
    config.durationMinutes > 120 ||
    config.durationMinutes % 5 !== 0
  ) {
    errors.durationMinutes = '考试时长必须是5到120之间且为5的倍数';
  }

  // questionCount: [5, 50] and <= availableCount
  if (
    !Number.isInteger(config.questionCount) ||
    config.questionCount < 5 ||
    config.questionCount > 50
  ) {
    errors.questionCount = '题目数量必须在5到50之间';
  } else if (config.questionCount > availableCount) {
    errors.questionCount = `题目数量不能超过可用题目数(${availableCount})`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
