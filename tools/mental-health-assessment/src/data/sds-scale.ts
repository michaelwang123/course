import type { Scale, ScaleItem, ScoringRule, GradeThreshold, ScaleOption } from '@/types/scale';

/**
 * SDS 抑郁自评量表 (Self-Rating Depression Scale)
 * 由 Zung 于 1965 年编制，共 20 题，用于评估抑郁状态的程度
 */

const SDS_SCALE_ID = 'sds-depression-scale';

const sdsOptions: ScaleOption[] = [
  { text: '没有或很少时间', score: 1 },
  { text: '小部分时间', score: 2 },
  { text: '相当多时间', score: 3 },
  { text: '绝大部分或全部时间', score: 4 },
];

export const sdsScoringRule: ScoringRule = {
  type: 'multiply',
  factor: 1.25,
  maxOptionScore: 4,
};

export const sdsGradeThresholds: GradeThreshold[] = [
  {
    level: '正常',
    minScore: 0,
    maxScore: 52,
    interpretation: '您当前的情绪状态良好，未显示出明显的抑郁症状。请继续保持积极乐观的心态，注意劳逸结合。',
  },
  {
    level: '轻度',
    minScore: 53,
    maxScore: 62,
    interpretation: '您可能存在轻度抑郁倾向。建议适当调整工作节奏，增加休息和娱乐活动，多与家人朋友沟通交流。',
  },
  {
    level: '中度',
    minScore: 63,
    maxScore: 72,
    interpretation: '您可能存在中度抑郁症状。建议尽快寻求专业心理咨询师的帮助，进行系统的心理疏导。',
  },
  {
    level: '重度',
    minScore: 73,
    maxScore: null,
    interpretation: '您可能存在较重的抑郁症状。强烈建议立即寻求专业心理医生的帮助，必要时配合药物治疗。',
  },
];

export const sdsItems: ScaleItem[] = [
  {
    id: `${SDS_SCALE_ID}-item-1`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 1,
    content: '我觉得闷闷不乐，情绪低沉',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-2`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 2,
    content: '我觉得一天之中早晨最好',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-3`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 3,
    content: '我一阵阵哭出来或觉得想哭',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-4`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 4,
    content: '我晚上睡眠不好',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-5`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 5,
    content: '我吃得跟平常一样多',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-6`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 6,
    content: '我与异性亲密接触时和以往一样感觉愉快',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-7`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 7,
    content: '我发觉我的体重在下降',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-8`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 8,
    content: '我有便秘的苦恼',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-9`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 9,
    content: '我心跳比平常快',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-10`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 10,
    content: '我无缘无故地感到疲乏',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-11`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 11,
    content: '我的头脑跟平常一样清楚',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-12`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 12,
    content: '我觉得经常做的事情并没有困难',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-13`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 13,
    content: '我觉得不安而平静不下来',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-14`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 14,
    content: '我对将来抱有希望',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-15`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 15,
    content: '我比平常容易生气激动',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-16`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 16,
    content: '我觉得作出决定是容易的',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-17`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 17,
    content: '我觉得自己是有用的，有人需要我',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-18`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 18,
    content: '我的生活过得很有意思',
    options: sdsOptions,
    isReverseScored: true,
  },
  {
    id: `${SDS_SCALE_ID}-item-19`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 19,
    content: '我认为如果我死了别人会生活得好些',
    options: sdsOptions,
    isReverseScored: false,
  },
  {
    id: `${SDS_SCALE_ID}-item-20`,
    scaleId: SDS_SCALE_ID,
    itemOrder: 20,
    content: '平常感兴趣的事我仍然照样感兴趣',
    options: sdsOptions,
    isReverseScored: true,
  },
];

export const sdsScale: Scale = {
  id: SDS_SCALE_ID,
  name: '抑郁自评量表(SDS)',
  description: 'Zung 抑郁自评量表，用于评估抑郁状态的严重程度。包含20个项目，涵盖情绪、躯体症状、精神运动和心理等方面。',
  scaleType: '抑郁',
  targetAudience: '家政从业人员（月嫂、老人护理）',
  itemCount: 20,
  estimatedMinutes: 10,
  scoringRule: sdsScoringRule,
  gradeThresholds: sdsGradeThresholds,
  createdAt: new Date().toISOString(),
};
