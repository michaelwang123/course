---
title: Hutool
sidebar_position: 3
slug: /middleware/java-hutool
---

# Hutool

## 简介与定位

Hutool 是一个国产开源的 Java 工具类库，定位为"小而全"的开发利器。它对 JDK 方法进行了大量封装，覆盖了文件操作、日期处理、加密解密、HTTP 客户端、缓存、数据库操作等几乎所有日常开发场景。与 Guava 专注于集合与缓存、Apache Commons 聚焦基础工具不同，Hutool 的核心差异在于**"一行代码解决问题"**的设计哲学——API 设计追求极简，几乎不需要额外配置就能直接使用。

Hutool 由国内开发者 looly 维护，社区活跃，文档全中文，对国内开发者尤为友好。适合中小型项目快速开发，也适合作为大型项目中特定模块的工具补充。

## Maven 坐标

```xml
<!-- 引入 Hutool 全量包（推荐快速开发场景） -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.25</version>
</dependency>
```

如果只需要部分功能，可以按需引入子模块：

```xml
<!-- 仅引入核心工具模块 -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-core</artifactId>
    <version>5.8.25</version>
</dependency>

<!-- 仅引入 HTTP 模块 -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-http</artifactId>
    <version>5.8.25</version>
</dependency>
```

## 核心功能与 API 速查

| API / 工具类 | 用途说明 |
|-------------|---------|
| `StrUtil` | 字符串工具，提供判空、格式化、驼峰转换、截取等常用操作 |
| `DateUtil` | 日期时间工具，封装日期解析、格式化、偏移计算、时间差等操作 |
| `FileUtil` | 文件操作工具，一行代码完成文件读写、拷贝、删除、遍历等 |
| `HttpUtil` | HTTP 客户端工具，支持 GET/POST 请求、文件上传下载、超时设置 |
| `SecureUtil` | 加密解密工具，支持 MD5、SHA、AES、RSA 等主流算法 |
| `JSONUtil` | JSON 工具，支持对象与 JSON 字符串互转、JSONPath 查询 |
| `BeanUtil` | Bean（JavaBean）操作工具，属性拷贝、Map 与 Bean 互转 |
| `CollUtil` | 集合工具，提供集合创建、交并差集、分组、排序等操作 |
| `IdUtil` | 唯一 ID 生成器，支持 UUID、Snowflake（雪花算法）、ObjectId |
| `CaptchaUtil` | 验证码生成工具，支持线段干扰、圆圈干扰、扭曲等样式 |

## 实战代码示例

### 示例一：字符串与日期处理

```java
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.date.DateUtil;
import java.util.Date;

public class StrAndDateDemo {
    public static void main(String[] args) {
        // 使用 StrUtil 进行字符串格式化，类似 SLF4J 的占位符风格
        String message = StrUtil.format("你好，{}！今天是{}", "开发者", "周一");
        System.out.println(message);

        // 判空操作：同时判断 null 和空字符串，避免 NPE
        boolean empty = StrUtil.isBlank("  ");
        System.out.println("空白字符串判断: " + empty); // true

        // 日期解析：自动识别常见日期格式，无需指定 pattern
        Date date = DateUtil.parse("2024-03-15 10:30:00");
        // 日期偏移：计算3天后的日期，链式调用简洁直观
        String threeDaysLater = DateUtil.formatDateTime(DateUtil.offsetDay(date, 3));
        System.out.println("三天后: " + threeDaysLater);

        // 计算两个日期之间的天数差
        Date start = DateUtil.parse("2024-01-01");
        Date end = DateUtil.parse("2024-03-15");
        long betweenDays = DateUtil.betweenDay(start, end, true);
        System.out.println("间隔天数: " + betweenDays);
    }
}
```

### 示例二：HTTP 请求与 JSON 处理

```java
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONObject;
import java.util.HashMap;
import java.util.Map;

public class HttpAndJsonDemo {
    public static void main(String[] args) {
        // 发送 GET 请求获取远程 JSON 数据，一行完成请求+超时设置
        String response = HttpUtil.get("https://api.example.com/users/1", 5000);
        System.out.println("响应内容: " + response);

        // 将 JSON 字符串解析为 JSONObject，支持链式路径访问
        JSONObject json = JSONUtil.parseObj(response);
        String name = json.getStr("name");
        System.out.println("用户名: " + name);

        // 发送 POST 请求，自动序列化 Map 为表单参数
        Map<String, Object> params = new HashMap<>();
        params.put("username", "test_user");
        params.put("email", "test@example.com");
        // HttpUtil.post 自动处理参数编码和 Content-Type 设置
        String postResult = HttpUtil.post("https://api.example.com/register", params);
        System.out.println("注册结果: " + postResult);

        // 对象转 JSON 字符串，支持格式化输出便于调试
        Map<String, Object> data = new HashMap<>();
        data.put("code", 200);
        data.put("message", "success");
        String prettyJson = JSONUtil.toJsonPrettyStr(data);
        System.out.println(prettyJson);
    }
}
```

### 示例三：文件操作与加密

```java
import cn.hutool.core.io.FileUtil;
import cn.hutool.crypto.SecureUtil;
import cn.hutool.core.util.CharsetUtil;
import java.io.File;
import java.util.List;

public class FileAndCryptoDemo {
    public static void main(String[] args) {
        // 一行代码写入文件，自动创建父目录和处理编码
        FileUtil.writeUtf8String("Hello Hutool!", "/tmp/test.txt");

        // 一行代码读取文件全部内容为字符串
        String content = FileUtil.readUtf8String("/tmp/test.txt");
        System.out.println("文件内容: " + content);

        // 按行读取文件，返回 List<String>，适合逐行处理日志
        List<String> lines = FileUtil.readUtf8Lines("/tmp/test.txt");
        lines.forEach(System.out::println);

        // MD5 摘要计算：对字符串进行 MD5 加密
        String md5 = SecureUtil.md5("需要加密的内容");
        System.out.println("MD5: " + md5);

        // AES 对称加密示例：加密和解密流程
        // 生成密钥并进行加解密，适用于敏感数据存储场景
        byte[] key = SecureUtil.generateKey("AES").getEncoded();
        cn.hutool.crypto.symmetric.AES aes = SecureUtil.aes(key);
        String encrypted = aes.encryptHex("机密信息");
        String decrypted = aes.decryptStr(encrypted);
        System.out.println("加密后: " + encrypted);
        System.out.println("解密后: " + decrypted);

        // 计算文件的 SHA-256 摘要，可用于校验文件完整性
        String sha256 = SecureUtil.sha256(new File("/tmp/test.txt"));
        System.out.println("文件SHA-256: " + sha256);
    }
}
```

### 示例四：Bean 操作与 ID 生成

```java
import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.lang.Snowflake;
import cn.hutool.core.util.IdUtil;
import java.util.Map;

public class BeanAndIdDemo {
    // 定义简单的用户实体类
    static class User {
        private String name;
        private Integer age;
        // getter/setter 省略
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
    }

    public static void main(String[] args) {
        // Bean 转 Map：将对象属性自动映射为键值对
        User user = new User();
        user.setName("张三");
        user.setAge(28);
        Map<String, Object> map = BeanUtil.beanToMap(user);
        System.out.println("Bean转Map: " + map);

        // Map 转 Bean：自动类型转换，适合接收前端参数后赋值
        Map<String, Object> source = Map.of("name", "李四", "age", 30);
        User newUser = BeanUtil.mapToBean(source, User.class, false);
        System.out.println("姓名: " + newUser.getName());

        // 生成不带横线的 UUID，常用于数据库主键
        String simpleUUID = IdUtil.simpleUUID();
        System.out.println("SimpleUUID: " + simpleUUID);

        // 雪花算法生成分布式唯一 ID，适合高并发场景
        Snowflake snowflake = IdUtil.getSnowflake(1, 1);
        long snowflakeId = snowflake.nextId();
        System.out.println("Snowflake ID: " + snowflakeId);
    }
}
```

## 使用心得与踩坑经验

### 心得一：hutool-all 虽方便但要注意包体积

在项目初期引入 `hutool-all` 非常方便，几乎所有工具类随用随取。但在生产环境中发现，`hutool-all` 包含了大量我们从未使用的模块（如 POI 集成、邮件模块、FTP 模块等），这会显著增加最终打包体积。后来我们改为按需引入 `hutool-core`、`hutool-http`、`hutool-crypto` 等子模块，打包体积减少了约 60%。建议在项目稳定后梳理实际使用的功能，切换为精确依赖，对 Docker 镜像大小和启动速度都有肉眼可见的优化效果。

### 心得二：DateUtil 自动格式识别的隐患

Hutool 的 `DateUtil.parse()` 方法会尝试自动识别日期字符串格式，这个特性在大多数场景下很方便。但我曾在生产环境遇到一个诡异的 bug：传入 `"01-02-2024"` 时，Hutool 将其识别为"月-日-年"格式（美式），而我们期望的是"日-月-年"格式（欧式）。这类歧义在自动解析中无法避免。**踩坑教训**：当日期格式明确且固定时，务必使用 `DateUtil.parse(str, "dd-MM-yyyy")` 显式指定 pattern，不要依赖自动识别。尤其是处理用户输入或外部系统传入的日期数据时，显式指定格式能避免潜在的数据错乱问题。

### 心得三：HttpUtil 在高并发场景下的连接管理

Hutool 的 `HttpUtil` 底层使用 JDK 自带的 `HttpURLConnection`，每次调用都会新建连接。在低并发场景下这没问题，但在每秒数百次 HTTP 调用的场景中，频繁创建/销毁连接带来了大量 TIME_WAIT 状态的 TCP 连接，最终导致端口耗尽。解决方案是在高并发场景下改用 OkHttp 或 Apache HttpClient 这类自带连接池的客户端，将 Hutool 的 `HttpUtil` 保留给低频调用（如配置拉取、健康检查等）。

## 适用场景建议

### ✅ 推荐使用

- **中小型项目快速开发**：Hutool 的"一行代码"哲学能极大提升开发效率，尤其适合业务逻辑密集、对第三方库依赖不多的项目。配合 [Lombok](./lombok.md) 一起使用，可以将 Java 的样板代码量压缩到极致。
- **工具脚本与数据处理**：编写一次性的数据迁移脚本、日志分析工具、批量文件处理等场景时，Hutool 丰富的工具类可以避免反复造轮子。
- **原型验证与 Demo 开发**：快速搭建 POC（概念验证）或技术 Demo 时，无需逐个引入多个第三方库，一个 `hutool-all` 就能覆盖绝大部分需求。

### ❌ 不推荐使用

- **高并发/高性能核心链路**：Hutool 的很多实现偏向易用性而非极致性能。例如 `HttpUtil` 无连接池管理、`JSONUtil` 性能弱于 Jackson/Fastjson2。核心链路建议使用专业库（如 [Guava Cache](./guava.md) 替代 Hutool 缓存、[Apache Commons](./apache-commons.md) 的 Pool 做连接池管理）。
- **已有成熟技术栈的大型项目**：如果项目已经引入了 Guava + Apache Commons + Jackson 的标准组合，再叠加 Hutool 会造成功能重复和团队认知负担，容易出现"同一个功能两种写法"的混乱局面。

---

## 相关教程

- [Guava — Google Java 基础工具集](./guava.md)
- [Apache Commons — Lang3/Collections4/IO 工具套件](./apache-commons.md)
- [Lombok — 消除 Java 样板代码](./lombok.md)
