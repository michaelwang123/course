import type { GradeLevel } from '@/types/assessment';

interface GradeTagProps {
  level: GradeLevel;
}

const gradeColorMap: Record<GradeLevel, string> = {
  '正常': 'bg-green-100 text-green-800',
  '轻度': 'bg-yellow-100 text-yellow-800',
  '中度': 'bg-orange-100 text-orange-800',
  '重度': 'bg-red-100 text-red-800',
};

export function GradeTag({ level }: GradeTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${gradeColorMap[level]}`}
    >
      {level}
    </span>
  );
}
