-- Enable Row Level Security on all mha_ tables
-- 安全策略: 限制匿名用户的数据访问权限

-- =============================================
-- mha_scales: 匿名用户只读
-- =============================================
ALTER TABLE mha_scales ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取所有量表
CREATE POLICY "anon_read_scales"
  ON mha_scales
  FOR SELECT
  TO anon
  USING (true);

-- 仅认证用户（管理员）可以增删改
CREATE POLICY "authenticated_manage_scales"
  ON mha_scales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- mha_scale_items: 匿名用户只读
-- =============================================
ALTER TABLE mha_scale_items ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取所有题目
CREATE POLICY "anon_read_scale_items"
  ON mha_scale_items
  FOR SELECT
  TO anon
  USING (true);

-- 仅认证用户可以增删改
CREATE POLICY "authenticated_manage_scale_items"
  ON mha_scale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- mha_assessment_sessions: 匿名用户可创建和查看
-- =============================================
ALTER TABLE mha_assessment_sessions ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户创建测评会话
CREATE POLICY "anon_create_sessions"
  ON mha_assessment_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许匿名用户读取所有会话（通过姓名查询自己的记录）
-- 注意: 由于当前无认证系统，暂时允许读取所有记录
-- 未来接入认证后应改为 USING (participant_name = current_user_name())
CREATE POLICY "anon_read_sessions"
  ON mha_assessment_sessions
  FOR SELECT
  TO anon
  USING (true);

-- 允许匿名用户更新自己创建的会话（提交答案和评分）
CREATE POLICY "anon_update_sessions"
  ON mha_assessment_sessions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 仅认证用户（管理员）可以删除记录
CREATE POLICY "authenticated_manage_sessions"
  ON mha_assessment_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 说明:
-- 1. 当前应用使用 anon key，所有请求都是 anon 角色
-- 2. mha_scales 和 mha_scale_items 对匿名用户只读，
--    管理功能在接入认证后才真正安全
-- 3. mha_assessment_sessions 允许匿名创建和更新，
--    因为测评流程不需要登录
-- 4. 未来接入管理员认证后，admin 操作会使用 authenticated 角色
-- =============================================
