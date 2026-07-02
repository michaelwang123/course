---
title: Jackson
sidebar_position: 1
slug: /middleware/java-jackson
---

# Jackson

## 简介与定位

Jackson 是 Java 生态中最流行的 JSON（JavaScript Object Notation，JavaScript 对象表示法）处理库，由 FasterXML 组织维护。它提供了高性能的 JSON 序列化（Serialization，将对象转为 JSON 字符串）与反序列化（Deserialization，将 JSON 字符串转为对象）能力，同时支持 XML、YAML、CSV 等多种数据格式。

与同类库的差异：相比 [Fastjson2](./fastjson2.md) 的"极致性能 + 中文社区"定位，Jackson 在**功能完整性**和**生态集成度**上更胜一筹——Spring Boot 默认内置 Jackson 作为 JSON 处理器，大量第三方框架也优先适配 Jackson。相比 [Gson](./gson.md) 的"轻量简洁"定位，Jackson 提供了更强大的注解体系、流式 API（Streaming API）和数据绑定（Data Binding）能力，适合对 JSON 处理有复杂定制需求的企业级项目。

## Maven 坐标

```xml
<!-- Jackson 核心三件套 -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.0</version>
</dependency>

<!-- jackson-databind 会自动引入以下两个依赖，通常无需单独声明 -->
<!-- jackson-core: 流式解析器 -->
<!-- jackson-annotations: 注解支持 -->
```

> **提示**：如果项目使用 Spring Boot，`spring-boot-starter-web` 已经包含了 Jackson 依赖，无需额外引入。建议通过 `jackson-bom` 统一管理版本号，避免子模块版本不一致。

## 核心功能与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `ObjectMapper.writeValueAsString()` | 将 Java 对象序列化为 JSON 字符串，是最常用的序列化入口方法 |
| `ObjectMapper.readValue()` | 将 JSON 字符串反序列化为 Java 对象，支持泛型类型处理 |
| `@JsonProperty` | 指定 JSON 字段名与 Java 属性的映射关系，解决命名不一致问题 |
| `@JsonIgnore` | 标记某个属性在序列化/反序列化时被忽略（如密码字段） |
| `@JsonFormat` | 控制日期时间字段的序列化格式（如 `yyyy-MM-dd HH:mm:ss`） |
| `ObjectMapper.configure()` | 全局配置序列化/反序列化行为（如忽略未知字段、空值处理） |
| `TypeReference<T>` | 处理泛型类型的反序列化，解决 Java 类型擦除（Type Erasure）问题 |
| `JsonNode / ObjectNode` | Tree Model（树模型）方式操作 JSON，适合动态结构或部分字段提取 |
| `@JsonCreator + @JsonProperty` | 支持不可变对象（如 Record 类型）的反序列化构造 |
| `ObjectMapper.writerWithDefaultPrettyPrinter()` | 生成格式化（带缩进）的 JSON 输出，便于调试和日志记录 |

## 实战代码示例

### 示例一：基础序列化与反序列化

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.util.Date;

public class JacksonBasicDemo {
    public static void main(String[] args) throws Exception {
        // 创建 ObjectMapper 实例，它是 Jackson 的核心入口，线程安全可复用
        ObjectMapper mapper = new ObjectMapper();

        // 构造示例对象，演示对象到 JSON 字符串的转换过程
        User user = new User("张三", 28, new Date());

        // 序列化：Java 对象 → JSON 字符串
        String json = mapper.writeValueAsString(user);
        System.out.println("序列化结果: " + json);
        // 输出: {"user_name":"张三","age":28,"create_time":"2024-01-15 10:30:00"}

        // 反序列化：JSON 字符串 → Java 对象
        User parsed = mapper.readValue(json, User.class);
        System.out.println("反序列化姓名: " + parsed.getName());
    }
}

class User {
    // 使用 @JsonProperty 将 Java 驼峰命名映射为 JSON 下划线命名
    @JsonProperty("user_name")
    private String name;

    private int age;

    // 使用 @JsonFormat 控制日期序列化格式，避免输出时间戳数字
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @JsonProperty("create_time")
    private Date createTime;

    public User() {}

    public User(String name, int age, Date createTime) {
        this.name = name;
        this.age = age;
        this.createTime = createTime;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public Date getCreateTime() { return createTime; }
}
```

### 示例二：泛型集合与复杂类型反序列化

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;
import java.util.Map;

public class JacksonGenericDemo {
    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        // 模拟从接口返回的 JSON 数组字符串
        String jsonArray = "[{\"id\":1,\"name\":\"Redis\"},{\"id\":2,\"name\":\"Kafka\"}]";

        // 使用 TypeReference 处理泛型集合的反序列化，解决 Java 类型擦除问题
        // 如果直接用 List.class 会丢失元素类型信息，导致返回 LinkedHashMap
        List<Map<String, Object>> list = mapper.readValue(
                jsonArray,
                new TypeReference<List<Map<String, Object>>>() {}
        );

        // 遍历反序列化后的列表，验证类型正确还原
        for (Map<String, Object> item : list) {
            System.out.println("ID: " + item.get("id") + ", Name: " + item.get("name"));
        }

        // 嵌套泛型场景：API 响应包装类的反序列化
        String responseJson = "{\"code\":200,\"data\":{\"total\":100,\"items\":[\"item1\",\"item2\"]}}";

        // 利用 JsonNode 树模型按需提取嵌套字段，无需定义完整 POJO
        var rootNode = mapper.readTree(responseJson);
        int code = rootNode.get("code").asInt();
        int total = rootNode.get("data").get("total").asInt();
        System.out.println("响应码: " + code + ", 总数: " + total);
    }
}
```

### 示例三：自定义序列化配置与忽略策略

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;

public class JacksonConfigDemo {
    public static void main(String[] args) throws Exception {
        // 创建 ObjectMapper 并配置全局行为，推荐在应用启动时统一配置
        ObjectMapper mapper = new ObjectMapper();

        // 反序列化时忽略 JSON 中存在但 Java 类中不存在的字段，避免抛出异常
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // 序列化时不输出值为 null 的字段，减少 JSON 体积
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // 日期类型序列化为可读字符串而非时间戳数字
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        // 演示：含敏感字段的对象序列化
        Account account = new Account("admin", "secret123", "admin@example.com");
        String json = mapper.writeValueAsString(account);
        System.out.println("序列化结果（密码已隐藏）: " + json);
        // 输出: {"username":"admin","email":"admin@example.com"}
        // password 字段因 @JsonIgnore 被自动排除

        // 演示：忽略未知字段的反序列化（JSON 多出 extra_field 不会报错）
        String extraJson = "{\"username\":\"test\",\"email\":\"t@t.com\",\"extra_field\":\"ignored\"}";
        Account parsed = mapper.readValue(extraJson, Account.class);
        System.out.println("反序列化用户名: " + parsed.getUsername());
    }
}

class Account {
    private String username;

    // @JsonIgnore 标记敏感字段，序列化时自动排除，防止密码泄露到日志或接口响应中
    @JsonIgnore
    private String password;

    private String email;

    public Account() {}

    public Account(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getEmail() { return email; }
}
```

### 示例四：Stream API 处理大文件 JSON

```java
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;

import java.io.File;

public class JacksonStreamDemo {
    public static void main(String[] args) throws Exception {
        // 使用流式 API 逐条解析大型 JSON 文件，避免一次性加载到内存导致 OOM
        // 适用于处理 GB 级别的 JSON 数据文件
        JsonFactory factory = new JsonFactory();
        JsonParser parser = factory.createParser(new File("large-data.json"));

        int count = 0;
        // 逐个 Token 读取，内存占用恒定，不受文件大小影响
        while (parser.nextToken() != null) {
            if (parser.currentToken() == JsonToken.FIELD_NAME) {
                String fieldName = parser.getCurrentName();
                if ("name".equals(fieldName)) {
                    parser.nextToken();
                    count++;
                }
            }
        }
        parser.close();
        System.out.println("共解析到 " + count + " 条 name 字段");
    }
}
```

## 使用心得与踩坑经验

### 心得一：ObjectMapper 必须复用，切勿每次调用都 new

在一个高并发接口中，我曾因为在每次请求处理方法内 `new ObjectMapper()` 导致 GC 压力急剧增大、接口 P99 延迟从 50ms 飙升到 300ms。排查后发现 `ObjectMapper` 的创建开销并不小——它会初始化大量内部缓存结构（如 SerializerCache、DeserializerCache）。正确做法是将 `ObjectMapper` 声明为 `static final` 常量或通过 Spring 容器注入为单例 Bean。Jackson 官方文档明确指出 `ObjectMapper` 是线程安全的，可以安全地在多线程环境中共享使用。一个典型的最佳实践是在应用启动时创建一个全局配置好的实例，后续所有序列化和反序列化操作都复用这个实例，这样既能保证配置统一，又能充分利用内部缓存提升性能。

### 心得二：反序列化时务必关闭 FAIL_ON_UNKNOWN_PROPERTIES

在微服务架构中，上下游接口的 JSON 字段经常会新增。如果不设置 `FAIL_ON_UNKNOWN_PROPERTIES = false`，当对方新增一个字段而你的 POJO 类没有对应属性时，Jackson 会直接抛出 `UnrecognizedPropertyException` 导致整个请求失败。我们团队曾因为依赖方悄悄加了一个 `debug_info` 字段，导致线上服务连续告警两小时才定位到原因。这个配置应该作为 ObjectMapper 初始化的标配项，尤其是在对接第三方接口时。另外，与之相关的一个常见坑是 Java Record 类型（JDK 16+）的反序列化——Record 的字段是 final 的，必须通过 `@JsonCreator` 注解标记构造函数才能正常工作，否则会报无默认构造器的错误。

### 心得三：日期时间处理需要额外注册 JavaTimeModule

Jackson 默认不支持 Java 8 的 `LocalDateTime`、`LocalDate` 等新时间 API。如果不注册 `jackson-datatype-jsr310` 模块，序列化 `LocalDateTime` 会输出一个难以阅读的数组格式 `[2024,1,15,10,30,0]`。正确做法是引入 `jackson-datatype-jsr310` 依赖并注册 `JavaTimeModule`，配合 `@JsonFormat` 注解指定日期格式。这个问题几乎是每个新接触 Jackson 的开发者都会遇到的第一个坑。

## 适用场景建议

### ✅ 推荐使用的场景

1. **Spring Boot 项目的默认 JSON 处理**：Spring Boot 已深度集成 Jackson，包括请求体解析、响应体序列化、配置文件绑定等。在 Spring 生态中使用 Jackson 能获得最佳的开箱体验和最丰富的社区支持。如需了解其他 JSON 库在 Spring 中的集成方式，可参考 [Fastjson2 教程](./fastjson2.md)。

2. **复杂 JSON 结构的处理**：当需要处理嵌套层级深、字段动态变化、多态类型（Polymorphism）序列化等复杂场景时，Jackson 的注解体系和 Tree Model（`JsonNode`）能力远超其他 JSON 库。特别是 `@JsonTypeInfo` + `@JsonSubTypes` 组合处理继承层次的序列化/反序列化，是其他库难以替代的能力。

3. **多数据格式支持**：如果项目需要同时处理 JSON、XML、YAML 等格式，Jackson 的 `jackson-dataformat-xml`、`jackson-dataformat-yaml` 等模块可以复用相同的注解和编程模型，无需学习多套 API。参见 [Gson 教程](./gson.md) 了解更轻量的纯 JSON 处理方案。

### ❌ 不推荐使用的场景

1. **极致性能敏感的纯 JSON 场景**：在对 JSON 解析速度有极端要求的场景（如高频交易系统的行情数据解析），Jackson 的性能虽然优秀但不是最快的。[Fastjson2](./fastjson2.md) 在纯 JSON 序列化/反序列化的 benchmark 中通常更快，且提供了 JSONB 二进制格式进一步提升性能。如果项目对功能丰富度要求不高，追求极致吞吐，可以考虑 Fastjson2。

2. **简单小项目或学习用途**：如果只是做简单的 JSON 转换，不需要复杂的注解配置和多格式支持，[Gson](./gson.md) 的 API 更加简洁直观，学习曲线更平缓，两三行代码即可完成基本操作。

---

## 相关教程

- [Fastjson2 - 高性能 JSON 处理库](./fastjson2.md)
- [Gson - 轻量级 JSON 处理库](./gson.md)
