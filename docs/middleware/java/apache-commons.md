---
title: Apache Commons
sidebar_position: 2
slug: /middleware/java-apache-commons
---

# Apache Commons

## 简介与定位

Apache Commons 是 Apache 软件基金会维护的一组 Java 通用工具类库集合，被称为"Java 开发的基础设施"。它将 JDK 标准库中缺失或不够便捷的功能进行了补充和封装，提供了大量经过生产验证的实用工具类。与 Guava 侧重于不可变集合和函数式编程不同，Apache Commons 更注重对 JDK 原生 API 的增强与补全，覆盖面极广。

本教程重点覆盖三个最常用的子模块：

- **Commons Lang3**：对 `java.lang` 包的扩展，提供字符串处理、数值操作、对象工具、反射增强等
- **Commons Collections4**：对 `java.util` 集合框架的增强，提供双向 Map、有序集合、集合转换等
- **Commons IO**：对 `java.io` / `java.nio` 的增强，提供文件操作、流处理、文件监控等

## Maven 坐标

```xml
<!-- Commons Lang3 - 字符串与对象工具 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.14.0</version>
</dependency>

<!-- Commons Collections4 - 集合增强 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-collections4</artifactId>
    <version>4.4</version>
</dependency>

<!-- Commons IO - 文件与流操作 -->
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.16.1</version>
</dependency>
```

## 核心功能与 API 速查

### Commons Lang3

| API | 用途说明 |
|-----|---------|
| `StringUtils.isBlank()` | 判断字符串是否为 null、空或仅包含空白字符 |
| `StringUtils.join()` | 将数组/集合元素拼接为字符串，支持自定义分隔符 |
| `NumberUtils.toInt()` | 安全地将字符串转为 int，转换失败不抛异常而是返回默认值 |
| `ObjectUtils.defaultIfNull()` | 当对象为 null 时返回指定的默认值 |
| `ReflectionToStringBuilder.toString()` | 通过反射自动生成对象的 toString 输出 |
| `RandomStringUtils.randomAlphanumeric()` | 生成指定长度的随机字母数字字符串 |

### Commons Collections4

| API | 用途说明 |
|-----|---------|
| `CollectionUtils.isEmpty()` | 判断集合是否为 null 或空，避免 NPE |
| `MapUtils.getString()` | 安全地从 Map 中获取 String 值，支持默认值 |
| `BidiMap` | 双向 Map（Bidirectional Map），支持通过 value 反查 key |
| `MultiValuedMap` | 一个 key 对应多个 value 的 Map 结构 |
| `ListUtils.partition()` | 将大 List 按指定大小分割为多个子 List |
| `TransformerUtils.chainedTransformer()` | 将多个转换器链式组合为一个复合转换器 |

### Commons IO

| API | 用途说明 |
|-----|---------|
| `FileUtils.readFileToString()` | 一行代码读取文件全部内容为字符串 |
| `FileUtils.writeStringToFile()` | 一行代码将字符串写入文件 |
| `IOUtils.copy()` | 在输入流与输出流之间复制数据 |
| `IOUtils.closeQuietly()` | 安静关闭流，不抛出异常 |
| `FilenameUtils.getExtension()` | 安全获取文件扩展名，处理各种边界情况 |
| `FileAlterationObserver` | 文件变更监控，支持监听目录下文件的创建、修改、删除事件 |

## 实战代码示例

### 示例一：字符串与对象处理（Lang3）

```java
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;

public class Lang3Demo {
    public static void main(String[] args) {
        // 使用 StringUtils 进行安全的字符串判空，避免 NullPointerException
        String input = "  ";
        System.out.println(StringUtils.isBlank(input));  // true
        System.out.println(StringUtils.isBlank(null));   // true

        // 使用 join 拼接集合元素，比手动 StringBuilder 更简洁
        String[] tags = {"Java", "Commons", "Lang3"};
        String result = StringUtils.join(tags, ", ");
        System.out.println(result);  // "Java, Commons, Lang3"

        // ObjectUtils 提供空值安全处理，简化防御性代码
        String name = null;
        String safeName = ObjectUtils.defaultIfNull(name, "未知用户");
        System.out.println(safeName);  // "未知用户"

        // 通过反射自动生成 toString，调试时非常方便
        User user = new User("张三", 28);
        System.out.println(ReflectionToStringBuilder.toString(user));
    }

    static class User {
        private String name;
        private int age;
        User(String name, int age) { this.name = name; this.age = age; }
    }
}
```

### 示例二：集合增强操作（Collections4）

```java
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.ListUtils;
import org.apache.commons.collections4.bidimap.DualHashBidiMap;
import org.apache.commons.collections4.map.MultiValueMap;

import java.util.Arrays;
import java.util.List;

public class Collections4Demo {
    public static void main(String[] args) {
        // 安全判空：同时处理 null 和 empty 两种情况
        List<String> emptyList = null;
        System.out.println(CollectionUtils.isEmpty(emptyList));  // true

        // 使用 partition 将大列表按批次分割，适合批量处理场景
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        List<List<Integer>> batches = ListUtils.partition(numbers, 3);
        System.out.println("分割为 " + batches.size() + " 批");  // 4 批
        batches.forEach(batch -> System.out.println("  批次: " + batch));

        // BidiMap 支持双向查询：通过 key 查 value，也能通过 value 反查 key
        DualHashBidiMap<String, String> bidiMap = new DualHashBidiMap<>();
        bidiMap.put("CN", "中国");
        bidiMap.put("US", "美国");
        bidiMap.put("JP", "日本");
        System.out.println("CN -> " + bidiMap.get("CN"));           // 中国
        System.out.println("中国 -> " + bidiMap.getKey("中国"));     // CN
    }
}
```

### 示例三：文件与流操作（IO）

```java
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.filefilter.SuffixFileFilter;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collection;

public class IODemo {
    public static void main(String[] args) throws Exception {
        // 一行代码完成文件读写，告别繁琐的 BufferedReader/Writer 样板代码
        File tempFile = new File("test-output.txt");
        FileUtils.writeStringToFile(tempFile, "Hello, Commons IO!", StandardCharsets.UTF_8);
        String content = FileUtils.readFileToString(tempFile, StandardCharsets.UTF_8);
        System.out.println("文件内容: " + content);

        // 安全获取文件扩展名，自动处理 null、无扩展名、多点号等边界情况
        System.out.println(FilenameUtils.getExtension("report.pdf"));     // "pdf"
        System.out.println(FilenameUtils.getExtension("archive.tar.gz")); // "gz"
        System.out.println(FilenameUtils.getExtension(null));             // null

        // 从 URL 直接读取内容到字符串，简化网络资源获取流程
        // 注意：生产环境应设置超时参数
        InputStream input = new URL("https://example.com").openStream();
        String html = IOUtils.toString(input, StandardCharsets.UTF_8);
        System.out.println("网页长度: " + html.length() + " 字符");
        IOUtils.closeQuietly(input);

        // 递归列出目录下所有指定类型的文件
        File projectDir = new File("src");
        if (projectDir.exists()) {
            Collection<File> javaFiles = FileUtils.listFiles(
                projectDir, new String[]{"java"}, true
            );
            System.out.println("找到 " + javaFiles.size() + " 个 Java 文件");
        }

        // 清理临时文件
        FileUtils.deleteQuietly(tempFile);
    }
}
```

### 示例四：数值安全转换与随机字符串（Lang3）

```java
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.commons.lang3.RandomStringUtils;

public class NumberAndRandomDemo {
    public static void main(String[] args) {
        // NumberUtils.toInt 在转换失败时返回默认值而不是抛出异常
        // 非常适合处理前端传来的不可信参数
        String pageStr = "abc";
        int page = NumberUtils.toInt(pageStr, 1);
        System.out.println("页码: " + page);  // 1（默认值）

        String sizeStr = "20";
        int size = NumberUtils.toInt(sizeStr, 10);
        System.out.println("每页条数: " + size);  // 20

        // 生成随机字符串，常用于临时 token、验证码等场景
        String token = RandomStringUtils.randomAlphanumeric(32);
        System.out.println("随机 Token: " + token);

        String verifyCode = RandomStringUtils.randomNumeric(6);
        System.out.println("验证码: " + verifyCode);
    }
}
```

## 使用心得与踩坑经验

### 1. Lang3 的 StringUtils 与 JDK 11+ String 方法的取舍

随着 JDK 版本演进，`String.isBlank()`（JDK 11）和 `String.strip()`（JDK 11）等方法逐步补齐了原先需要 Commons Lang 才能实现的功能。但在实际项目中，`StringUtils` 依然有不可替代的价值：它能安全处理 null 输入（JDK 原生方法会抛 NPE），且项目如果需要兼容 JDK 8 则别无选择。我的经验是：如果项目已经升级到 JDK 17+且对 null 有统一的校验层，可以考虑减少对 Lang3 的依赖；但在大多数企业级项目中，StringUtils 仍然是代码防御性编程的首选工具，特别是在处理外部输入（HTTP 参数、配置文件解析结果）时，一个 `isBlank()` 就能避免大量的 NPE 防御代码。

### 2. Collections4 的版本兼容问题

Commons Collections 存在 3.x 和 4.x 两个大版本，包名分别是 `org.apache.commons.collections` 和 `org.apache.commons.collections4`。这两个版本**可以共存**但 API 不兼容，曾经在项目中因为同时引入了两个版本（一个是直接依赖，另一个被某个旧框架传递引入）导致类型转换异常。排查建议：使用 `mvn dependency:tree` 检查是否同时存在 3.x 和 4.x 的依赖，如果有冲突通过 `<exclusions>` 排除旧版本。新项目应始终使用 4.x 版本。

### 3. IOUtils.closeQuietly() 的过时与替代方案

在 Java 7 引入 try-with-resources 语法后，`IOUtils.closeQuietly()` 的使用场景大幅减少。然而在处理某些遗留代码（比如手动管理多个流的复杂场景）或者在 finally 块中需要关闭非 AutoCloseable 资源时，它仍然有用。我的建议是：新代码统一使用 try-with-resources，只在确实无法使用 TWR 的场景（如第三方库返回的非标准资源对象）才使用 closeQuietly。另外要注意，`IOUtils.closeQuietly()` 在 Commons IO 2.6+ 中已标记为 `@Deprecated`，后续版本可能移除。

## 适用场景建议

### ✅ 推荐使用场景

1. **企业级 Java 项目的基础工具层**：当项目需要大量字符串处理、集合操作、文件读写时，Apache Commons 三件套提供了经过亿级生产验证的稳定实现，比自行封装工具类更可靠。参见 [Guava 教程](./guava.md) 了解另一种风格的工具库选择。

2. **需要兼容 JDK 8 的项目**：如果项目无法升级到 JDK 11+，Commons Lang3 提供的 `isBlank()`、`strip()` 等方法是必须的补充。同时 Collections4 的 `MultiValuedMap` 等数据结构在 JDK 标准库中没有对应实现。

3. **批量数据处理与文件操作**：`ListUtils.partition()` 适合将大数据集分批处理（如批量入库），`FileUtils` 的递归文件操作简化了文件系统遍历代码。参见 [Hutool 教程](./hutool.md) 了解另一个覆盖面更广的国产工具库。

### ❌ 不推荐使用场景

1. **轻量级微服务或 Serverless 函数**：如果项目只需要一两个工具方法（如判空），引入完整的 Commons 依赖会增加不必要的 JAR 体积。此时可以考虑直接使用 JDK 原生 API 或引入更轻量的 [Lombok](./lombok.md) 来减少样板代码。

## 相关教程

- [Guava 教程](./guava.md) — Google 出品的 Java 核心工具库，侧重不可变集合与函数式编程
- [Hutool 教程](./hutool.md) — 国产全能型 Java 工具库，API 设计更贴近中文开发者习惯
- [Lombok 教程](./lombok.md) — 通过注解消除 Java 样板代码的编译期工具
