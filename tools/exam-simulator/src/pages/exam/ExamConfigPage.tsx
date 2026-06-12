import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExamConfig, ExamSession } from '../../types';
import { validateExamConfig } from '../../lib/validation';
import * as examService from '../../services/examService';
import * as questionService from '../../services/questionService';
import { useToast } from '../../components/Toast';

const ExamConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Form state
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(10);

  // Data state
  const [subjects, setSubjects] = useState<string[]>([]);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Active session state
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Validation and submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      try {
        const subjectList = await questionService.getSubjects();
        setSubjects(subjectList);
        if (subjectList.length > 0 && !subject) {
          setSubject(subjectList[0]);
        }
      } catch {
        showToast('error', '加载科目列表失败');
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for active session on mount
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const session = await examService.getActiveSession();
        setActiveSession(session);
      } catch {
        // Silently fail - not critical
      } finally {
        setCheckingSession(false);
      }
    }
    checkActiveSession();
  }, []);

  // Update available count when subject changes
  useEffect(() => {
    async function loadCount() {
      if (!subject) {
        setAvailableCount(0);
        return;
      }
      try {
        const count = await questionService.getCountBySubject(subject);
        setAvailableCount(count);
      } catch {
        setAvailableCount(0);
      }
    }
    loadCount();
  }, [subject]);

  const handleContinueExam = () => {
    if (activeSession) {
      navigate(`/exam/session/${activeSession.id}`);
    }
  };

  const handleAbandonAndRestart = async () => {
    if (!activeSession) return;
    try {
      await examService.abandonSession(activeSession.id);
      setActiveSession(null);
      showToast('success', '已放弃上次考试');
    } catch {
      showToast('error', '放弃考试失败，请重试');
    }
  };

  const handleStartExam = async () => {
    // Validate config (includes questionCount <= availableCount check)
    const config: ExamConfig = {
      studentName: studentName.trim(),
      subject,
      durationMinutes,
      questionCount,
    };

    const validationResult = validateExamConfig(config, availableCount);
    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    setSubmitting(true);
    try {
      const session = await examService.createSession(config);
      navigate(`/exam/session/${session.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建考试失败';
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDurationChange = (value: number) => {
    // Ensure step of 5
    const rounded = Math.round(value / 5) * 5;
    const clamped = Math.max(5, Math.min(120, rounded));
    setDurationMinutes(clamped);
  };

  if (loadingSubjects || checkingSession) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  // Show active session prompt
  if (activeSession) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            您有一场未完成的考试
          </h2>
          <p className="text-yellow-700 text-sm mb-4">
            科目：{activeSession.subject}，考生：{activeSession.studentName}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleContinueExam}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              继续考试
            </button>
            <button
              onClick={handleAbandonAndRestart}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors text-sm font-medium"
            >
              放弃并开始新考试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">考试配置</h1>

      <div className="space-y-5">
        {/* Student Name */}
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
            考生姓名
          </label>
          <input
            id="studentName"
            type="text"
            maxLength={20}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="请输入考生姓名（1-20字符）"
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              errors.studentName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.studentName && (
            <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>
          )}
        </div>

        {/* Subject Selector */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            考试科目
          </label>
          {subjects.length === 0 ? (
            <p className="text-red-500 text-sm">暂无可用科目，请先在管理页面添加题目</p>
          ) : (
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {subject && (
            <p className="text-gray-500 text-xs mt-1">
              该科目可用题目数：{availableCount}
            </p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-1">
            考试时长：{durationMinutes} 分钟
          </label>
          <input
            id="durationMinutes"
            type="range"
            min={5}
            max={120}
            step={5}
            value={durationMinutes}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5分钟</span>
            <span>120分钟</span>
          </div>
          {errors.durationMinutes && (
            <p className="text-red-500 text-xs mt-1">{errors.durationMinutes}</p>
          )}
        </div>

        {/* Question Count */}
        <div>
          <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-1">
            题目数量
          </label>
          <input
            id="questionCount"
            type="number"
            min={5}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              errors.questionCount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <p className="text-gray-400 text-xs mt-1">范围：5-50道</p>
          {errors.questionCount && (
            <p className="text-red-500 text-xs mt-1">{errors.questionCount}</p>
          )}
        </div>

        {/* Start Exam Button */}
        <button
          onClick={handleStartExam}
          disabled={submitting || subjects.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '正在创建考试...' : '开始考试'}
        </button>
      </div>
    </div>
  );
};

export default ExamConfigPage;
