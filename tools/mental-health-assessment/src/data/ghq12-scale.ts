import type { Scale, ScaleItem, ScoringRule, GradeThreshold } from '@/types';

/**
 * GHQ-12 一般健康问卷 (General Health Questionnaire-12)
 *
 * GHQ 计分法：0-0-1-1（前两个选项计 0 分，后两个选项计 1 分）
 * 总分范围：0-12 分
 * 用途：筛查一般心理健康状况
 */

const GHQ12_SCALE_ID = 'ghq12-general-health';

export const ghq12ScoringRule: ScoringRule = {
  type: 'direct',
  maxOptionScore: 1,
};

export const ghq12GradeThresholds: GradeThreshold[] = [
  {
    level: '正常',
    minScore: 0,
    maxScore: 3,
    interpretation:
      '您的心理健康状况良好，未显示出明显的心理困扰。请继续保持当前的生活方式和心态。',
  },
  {
    level: '轻度',
    minScore: 4,
    maxScore: null,
    interpretation:
      '您可能存在心理困扰倾向，建议适当关注自身心理健康状况，增加休息和放松活动，如有持续不适请咨询专业人士。',
  },
];

export const ghq12Items: ScaleItem[] = [
  {
    id: `${GHQ12_SCALE_ID}-item-1`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 1,
    content: '您最近能够集中注意力吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-2`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 2,
    content: '您最近因忧虑而失眠吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-3`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 3,
    content: '您最近觉得自己在事情中起着有用的作用吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-4`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 4,
    content: '您最近感到有能力做出决定吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-5`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 5,
    content: '您最近感到自己经常处于紧张状态吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-6`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 6,
    content: '您最近感到自己不能克服困难吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-7`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 7,
    content: '您最近能够享受日常活动吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-8`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 8,
    content: '您最近能够面对自己的问题吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-9`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 9,
    content: '您最近感到不开心和沮丧吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-10`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 10,
    content: '您最近觉得对自己失去信心吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-11`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 11,
    content: '您最近觉得自己是一个没有价值的人吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
  {
    id: `${GHQ12_SCALE_ID}-item-12`,
    scaleId: GHQ12_SCALE_ID,
    itemOrder: 12,
    content: '您最近总的来说感到还算快乐吗？',
    options: [
      { text: '比平时好', score: 0 },
      { text: '和平时一样', score: 0 },
      { text: '比平时差', score: 1 },
      { text: '比平时差很多', score: 1 },
    ],
    isReverseScored: false,
  },
];

export const ghq12Scale: Scale = {
  id: GHQ12_SCALE_ID,
  name: 'GHQ-12 一般健康问卷',
  description:
    '一般健康问卷（GHQ-12）是用于筛查一般心理健康状况的简短量表，适用于评估近期心理困扰水平。',
  scaleType: '一般健康',
  targetAudience: '家政从业人员（月嫂、老人护理）',
  itemCount: 12,
  estimatedMinutes: 5,
  scoringRule: ghq12ScoringRule,
  gradeThresholds: ghq12GradeThresholds,
  createdAt: new Date().toISOString(),
};
