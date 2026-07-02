import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // ========== 人生成长板块 ==========
  lifeWishSidebar: [
    {
      type: 'doc',
      id: 'life_wish/index',
      label: '人生愿望概览',
    },
    {
      type: 'doc',
      id: 'life_wish/body-health',
      label: '身体与健康',
    },
    {
      type: 'doc',
      id: 'life_wish/career-wealth',
      label: '事业与财务',
    },
    {
      type: 'doc',
      id: 'life_wish/relationship-family',
      label: '关系与家庭',
    },
    {
      type: 'doc',
      id: 'life_wish/spirit-growth',
      label: '精神与成长',
    },
    {
      type: 'doc',
      id: 'life_wish/experience-adventure',
      label: '体验与冒险',
    },
  ],
  moneyWisdomSidebar: [
    {
      type: 'doc',
      id: 'money_wisdom/index',
      label: '财务认知概览',
    },
    {
      type: 'doc',
      id: 'money_wisdom/financial-mindset',
      label: '财务认知基础',
    },
    {
      type: 'doc',
      id: 'money_wisdom/income-growth',
      label: '收入增长策略',
    },
    {
      type: 'doc',
      id: 'money_wisdom/saving-spending',
      label: '储蓄与消费',
    },
    {
      type: 'doc',
      id: 'money_wisdom/investment-basics',
      label: '投资入门',
    },
    {
      type: 'doc',
      id: 'money_wisdom/risk-management',
      label: '风险管理',
    },
  ],
  mentalHealthSidebar: [
    {
      type: 'doc',
      id: 'mental_health/index',
      label: '心理健康概览',
    },
    {
      type: 'doc',
      id: 'mental_health/emotion-management',
      label: '情绪认知与管理',
    },
    {
      type: 'doc',
      id: 'mental_health/stress-burnout',
      label: '压力与倦怠',
    },
    {
      type: 'doc',
      id: 'mental_health/mindfulness',
      label: '正念与冥想',
    },
    {
      type: 'doc',
      id: 'mental_health/family-healing',
      label: '原生家庭与疗愈',
    },
    {
      type: 'doc',
      id: 'mental_health/seek-help',
      label: '何时寻求帮助',
    },
  ],
  relationshipSidebar: [
    {
      type: 'doc',
      id: 'relationship/index',
      label: '关系与社交概览',
    },
    {
      type: 'doc',
      id: 'relationship/intimate-relationship',
      label: '亲密关系经营',
    },
    {
      type: 'doc',
      id: 'relationship/communication',
      label: '沟通的艺术',
    },
    {
      type: 'doc',
      id: 'relationship/friendship',
      label: '社交与友谊',
    },
    {
      type: 'doc',
      id: 'relationship/toxic-relationship',
      label: '识别有毒关系',
    },
  ],
  habitsSidebar: [
    {
      type: 'doc',
      id: 'habits/index',
      label: '好习惯养成概览',
    },
    {
      type: 'doc',
      id: 'habits/phone-time-limit',
      label: '手机使用时长限制',
    },
    {
      type: 'doc',
      id: 'habits/phone-usage-scenarios',
      label: '手机使用场景区分',
    },
    {
      type: 'doc',
      id: 'habits/overcome-boredom',
      label: '克服无聊感',
    },
    {
      type: 'doc',
      id: 'habits/enjoy-solitude',
      label: '享受独处',
    },
  ],
  bookReadSidebar: [
    {
      type: 'doc',
      id: 'book_read/index',
      label: '智慧书籍概览',
    },
    {
      type: 'category',
      label: '东方哲学',
      items: [
        { type: 'doc', id: 'book_read/dao-de-jing', label: '道德经' },
        { type: 'doc', id: 'book_read/lun-yu', label: '论语' },
        { type: 'doc', id: 'book_read/sun-zi-bing-fa', label: '孙子兵法' },
        { type: 'doc', id: 'book_read/jin-gang-jing', label: '金刚经' },
        { type: 'doc', id: 'book_read/zhuang-zi', label: '庄子' },
        { type: 'doc', id: 'book_read/chuan-xi-lu', label: '传习录' },
      ],
    },
    {
      type: 'category',
      label: '西方哲学',
      items: [
        { type: 'doc', id: 'book_read/li-xiang-guo', label: '理想国' },
        { type: 'doc', id: 'book_read/chen-si-lu', label: '沉思录' },
        { type: 'doc', id: 'book_read/ni-ge-ma-ke', label: '尼各马可伦理学' },
        { type: 'doc', id: 'book_read/zhi-hui-shu', label: '智慧书' },
      ],
    },
    {
      type: 'category',
      label: '宗教与灵性',
      items: [
        { type: 'doc', id: 'book_read/bo-qie-fan-ge', label: '薄伽梵歌' },
        { type: 'doc', id: 'book_read/sheng-jing-zhen-yan', label: '圣经·箴言篇' },
        { type: 'doc', id: 'book_read/tan-jing', label: '坛经' },
      ],
    },
    {
      type: 'category',
      label: '现代思想与科学智慧',
      items: [
        { type: 'doc', id: 'book_read/ren-lei-jian-shi', label: '人类简史' },
        { type: 'doc', id: 'book_read/qiong-cha-li', label: '穷查理宝典' },
        { type: 'doc', id: 'book_read/si-kao-kuai-yu-man', label: '思考，快与慢' },
        { type: 'doc', id: 'book_read/yuan-ze', label: '原则' },
        { type: 'doc', id: 'book_read/zi-si-de-ji-yin', label: '自私的基因' },
      ],
    },
  ],
  basketballSidebar: [
    {
      type: 'doc',
      id: 'basketball_skill/index',
      label: '篮球训练概览',
    },
    {
      type: 'category',
      label: '赛前热身',
      items: [
        { type: 'doc', id: 'basketball_skill/warmup-greatest-stretch', label: '伟大拉伸' },
        { type: 'doc', id: 'basketball_skill/warmup-dynamic', label: '动态热身组合' },
        { type: 'doc', id: 'basketball_skill/warmup-basketball-specific', label: '篮球专项热身' },
      ],
    },
    {
      type: 'category',
      label: '投篮训练',
      items: [
        { type: 'doc', id: 'basketball_skill/shooting-fundamentals', label: '投篮基本功' },
        { type: 'doc', id: 'basketball_skill/shooting-fadeaway', label: '后仰跳投' },
        { type: 'doc', id: 'basketball_skill/shooting-pull-up', label: '急停跳投' },
        { type: 'doc', id: 'basketball_skill/shooting-three-point', label: '三分投篮' },
      ],
    },
    {
      type: 'category',
      label: '运球与控球',
      items: [
        { type: 'doc', id: 'basketball_skill/dribbling-basics', label: '运球基础' },
        { type: 'doc', id: 'basketball_skill/dribbling-crossover', label: 'Crossover 组合技' },
      ],
    },
    {
      type: 'category',
      label: '脚步与身体对抗',
      items: [
        { type: 'doc', id: 'basketball_skill/footwork', label: '脚步训练' },
        { type: 'doc', id: 'basketball_skill/strength-contact', label: '力量与对抗' },
      ],
    },
    {
      type: 'category',
      label: '实战组合',
      items: [
        { type: 'doc', id: 'basketball_skill/game-day-warmup', label: '赛前 15 分钟热身方案' },
        { type: 'doc', id: 'basketball_skill/training-plan', label: '训练计划模板' },
      ],
    },
  ],

  // ========== 技术学习板块 ==========
  aiTechSidebar: [
    {
      type: 'doc',
      id: 'ai_tech/index',
      label: 'AI 技术概览',
    },
    {
      type: 'doc',
      id: 'ai_tech/qdrant-vector-db',
      label: 'Qdrant 向量数据库',
    },
  ],
  middlewareSidebar: [
    {
      type: 'doc',
      id: 'middleware/index',
      label: '中间件与工具库概览',
    },
    {
      type: 'category',
      label: 'Java 工具库',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: '核心工具库',
          items: [
            { type: 'doc', id: 'middleware/java/guava', label: 'Guava' },
            { type: 'doc', id: 'middleware/java/apache-commons', label: 'Apache Commons' },
            { type: 'doc', id: 'middleware/java/hutool', label: 'Hutool' },
            { type: 'doc', id: 'middleware/java/lombok', label: 'Lombok' },
          ],
        },
        {
          type: 'category',
          label: 'JSON/序列化库',
          items: [
            { type: 'doc', id: 'middleware/java/jackson', label: 'Jackson' },
            { type: 'doc', id: 'middleware/java/fastjson2', label: 'Fastjson2' },
            { type: 'doc', id: 'middleware/java/gson', label: 'Gson' },
          ],
        },
        {
          type: 'category',
          label: '网络与 HTTP 库',
          items: [
            { type: 'doc', id: 'middleware/java/okhttp', label: 'OkHttp' },
            { type: 'doc', id: 'middleware/java/apache-httpclient', label: 'Apache HttpClient' },
            { type: 'doc', id: 'middleware/java/retrofit', label: 'Retrofit' },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Go 工具包',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: '标准库扩展',
          items: [
            { type: 'doc', id: 'middleware/go/cobra', label: 'cobra' },
            { type: 'doc', id: 'middleware/go/viper', label: 'viper' },
            { type: 'doc', id: 'middleware/go/zap', label: 'zap' },
            { type: 'doc', id: 'middleware/go/gin-echo', label: 'gin/echo' },
          ],
        },
        {
          type: 'category',
          label: '数据处理',
          items: [
            { type: 'doc', id: 'middleware/go/gorm', label: 'gorm' },
            { type: 'doc', id: 'middleware/go/samber-lo', label: 'samber/lo' },
            { type: 'doc', id: 'middleware/go/gjson-sjson', label: 'gjson/sjson' },
            { type: 'doc', id: 'middleware/go/go-redis', label: 'go-redis' },
          ],
        },
        {
          type: 'category',
          label: '工程化工具',
          items: [
            { type: 'doc', id: 'middleware/go/wire', label: 'wire' },
            { type: 'doc', id: 'middleware/go/testify', label: 'testify' },
            { type: 'doc', id: 'middleware/go/golangci-lint', label: 'golangci-lint' },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '大数据工具',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: '计算框架',
          items: [
            { type: 'doc', id: 'middleware/bigdata/spark', label: 'Apache Spark' },
            { type: 'doc', id: 'middleware/bigdata/flink', label: 'Apache Flink' },
          ],
        },
        {
          type: 'category',
          label: '工具库',
          items: [
            { type: 'doc', id: 'middleware/bigdata/calcite', label: 'Apache Calcite' },
            { type: 'doc', id: 'middleware/bigdata/arrow', label: 'Apache Arrow' },
            { type: 'doc', id: 'middleware/bigdata/roaring-bitmap', label: 'RoaringBitmap' },
          ],
        },
        {
          type: 'category',
          label: '数据序列化',
          items: [
            { type: 'doc', id: 'middleware/bigdata/avro-parquet', label: 'Avro/Parquet' },
            { type: 'doc', id: 'middleware/bigdata/protobuf', label: 'Protocol Buffers' },
          ],
        },
        {
          type: 'doc',
          id: 'middleware/bigdata/ai-agent-landscape',
          label: 'AI Agent 技术地图',
        },
      ],
    },
    {
      type: 'category',
      label: '中间件',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: '缓存',
          items: [
            { type: 'doc', id: 'middleware/middleware/redis', label: 'Redis' },
          ],
        },
        {
          type: 'category',
          label: '消息队列',
          items: [
            { type: 'doc', id: 'middleware/middleware/kafka', label: 'Apache Kafka' },
            { type: 'doc', id: 'middleware/middleware/rabbitmq', label: 'RabbitMQ' },
            { type: 'doc', id: 'middleware/middleware/rocketmq', label: 'RocketMQ' },
          ],
        },
        {
          type: 'category',
          label: '搜索与存储',
          items: [
            { type: 'doc', id: 'middleware/middleware/elasticsearch', label: 'Elasticsearch' },
            { type: 'doc', id: 'middleware/middleware/minio', label: 'MinIO' },
          ],
        },
        {
          type: 'category',
          label: '服务治理',
          items: [
            { type: 'doc', id: 'middleware/middleware/nacos', label: 'Nacos' },
            { type: 'doc', id: 'middleware/middleware/sentinel', label: 'Sentinel' },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes',
      collapsed: true,
      items: [
        { type: 'doc', id: 'middleware/k8s/index', label: 'K8s 知识体系' },
      ],
    },
  ],
  ragflowSidebar: [
    {
      type: 'doc',
      id: 'ragflow/index',
      label: '介绍',
    },
    {
      type: 'doc',
      id: 'ragflow/architecture',
      label: '架构概览',
    },
    {
      type: 'doc',
      id: 'ragflow/installation',
      label: '安装部署',
    },
    {
      type: 'doc',
      id: 'ragflow/quickstart',
      label: '快速上手',
    },
    {
      type: 'doc',
      id: 'ragflow/advanced',
      label: '进阶功能',
    },
  ],
};

export default sidebars;
