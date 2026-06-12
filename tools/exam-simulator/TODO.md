# Exam Simulator - 技术优化 TODO

> 以下事项均为"锦上添花"级别，当前代码已生产可用（118 测试全过、0 TS 错误、build 成功）。
> 建议在功能迭代或性能瓶颈出现时按需处理。

## 架构 / 可维护性

- [ ] **提取 ExamHeader 和 QuestionItem 为独立文件**
  - 当前内联在 `src/pages/exam/ExamSessionPage.tsx`（~230 行）
  - 迁移至 `src/components/exam/ExamHeader.tsx` 和 `src/components/exam/QuestionItem.tsx`
  - 收益：后续做"错题重做"等功能时可直接复用 QuestionItem
  - 触发条件：有新页面需要复用这些组件时

- [ ] **examService.performSubmit 添加事务性保障**
  - 当前流程：insert exam_records → update session status（非原子）
  - 风险：第二步失败会导致 record 存在但 session 仍为 in_progress
  - 方案：创建 Supabase RPC（Postgres 函数），用 `BEGIN/COMMIT` 包裹
  - 触发条件：生产环境出现数据不一致时

## 性能

- [ ] **questionService.getSubjects() 改用 DISTINCT 查询**
  - 当前实现：`select('subject')` 拉取全表 → 前端 `new Set()` 去重
  - 题库 < 500 条时无感知差异；题库达到数千条时可能变慢
  - 方案：创建 Supabase RPC `SELECT DISTINCT subject FROM questions ORDER BY subject`
  - 触发条件：题库规模超过 1000 条或页面加载 > 500ms 时

- [ ] **考试页面添加 Loading Skeleton**
  - 当前所有页面加载态为简单文字"加载中..."
  - 对面向学生的产品，骨架屏可提升感知性能
  - 触发条件：收到用户体验反馈或需要提升 LCP 指标时

## 代码风格（纯偏好）

- [ ] **简化 anti-cheat 按键检测**
  - 当前：`['c', 'C', 'a', 'A', 'u', 'U'].includes(e.key)`
  - 可改为：`'cau'.includes(e.key.toLowerCase())`
  - 影响：无功能差异，纯可读性偏好
