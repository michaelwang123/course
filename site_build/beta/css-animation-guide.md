# CSS 动画 + Tailwind 实现方案

> 适用于：科技感暗色网站、产品功能展示页、数据流可视化
> 依赖：Tailwind CSS（CDN 或项目安装均可），无 JS 动画库

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│  Tailwind CSS                                    │
│  • 布局/间距/颜色/响应式                          │
│  • hover/group-hover 交互状态                     │
│  • transition-* 过渡效果                          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  自定义 @keyframes                               │
│  • 流动、发光、移动、旋转等连续动画               │
│  • 通过 animation-delay 编排多元素时序            │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  SVG                                             │
│  • 连接线路径                                    │
│  • stroke-dasharray 配合 CSS 做流动效果          │
│  • 图标（Lucide / Heroicons）                    │
└─────────────────────────────────────────────────┘
```

---

## 在项目中引入

### 方式 A：CDN（快速原型/单页面）

```html
<script src="https://cdn.tailwindcss.com"></script>
```

### 方式 B：npm 安装（正式项目）

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // 自定义动画扩展（下面会详细说明）
      animation: {
        'dash-flow': 'dash-flow 1.5s linear infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'dot-move': 'dot-move 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'spin-slow': 'spin-slow 8s linear infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        'dash-flow': {
          to: { 'stroke-dashoffset': '-20' }
        },
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 0 8px rgba(0,255,170,0.3), 0 0 16px rgba(0,255,170,0.1)' },
          '50%': { 'box-shadow': '0 0 16px rgba(0,255,170,0.6), 0 0 32px rgba(0,255,170,0.3)' }
        },
        'dot-move': {
          '0%': { transform: 'translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(160px)', opacity: '0' }
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        },
        'shimmer': {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' }
        }
      }
    }
  }
}
```

---

## 动效清单（可复用）

### 1. 虚线流动

**效果**：SVG 路径上的虚线像水流一样向前移动

**原理**：`stroke-dasharray` 创建虚线，`stroke-dashoffset` 负方向偏移产生流动感

```css
@keyframes dash-flow {
    to { stroke-dashoffset: -20; }
}
.animate-dash-flow {
    animation: dash-flow 1.5s linear infinite;
}
```

```html
<svg viewBox="0 0 400 100" fill="none">
    <path 
        d="M 0 50 H 400" 
        stroke="rgba(0,255,170,0.4)" 
        stroke-width="1.5" 
        stroke-dasharray="6 4" 
        class="animate-dash-flow"
    />
</svg>
```

**参数调整**：
- `stroke-dasharray="6 4"` → 虚线段长6，间隔4（改大更稀疏）
- `stroke-dashoffset: -20` → 偏移量（与 dasharray 总长匹配效果最好）
- `1.5s` → 速度（越小越快）

---

### 2. 脉冲发光

**效果**：元素边缘有呼吸式的光晕，强弱循环

**原理**：`box-shadow` 在两个强度之间切换

```css
@keyframes pulse-glow {
    0%, 100% { 
        box-shadow: 0 0 8px rgba(0,255,170,0.3),
                    0 0 16px rgba(0,255,170,0.1); 
    }
    50% { 
        box-shadow: 0 0 16px rgba(0,255,170,0.6),
                    0 0 32px rgba(0,255,170,0.3); 
    }
}
.animate-pulse-glow {
    animation: pulse-glow 2.5s ease-in-out infinite;
}
```

```html
<div class="w-16 h-16 rounded-xl border-2 border-emerald-500/50 animate-pulse-glow">
    <!-- 内容 -->
</div>
```

**参数调整**：
- 颜色 `rgba(0,255,170,...)` → 改成你项目的主色
- `2.5s` → 呼吸节奏（越大越慢越柔和）
- 多层 shadow → 增加外层扩散范围

---

### 3. 移动粒子（小点沿路径）

**效果**：小圆点从左到右移动，多个点错开时间

**原理**：`translateX` 位移 + `opacity` 淡入淡出 + `animation-delay`

```css
@keyframes dot-move {
    0%   { transform: translateX(0);     opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(160px); opacity: 0; }
}
.animate-dot-move { animation: dot-move 2s ease-in-out infinite; }
```

```html
<!-- 多个点通过 animation-delay 错开 -->
<div class="w-2 h-2 rounded-full bg-emerald-400 animate-dot-move"></div>
<div class="w-2 h-2 rounded-full bg-emerald-400 animate-dot-move" style="animation-delay: 0.7s"></div>
<div class="w-2 h-2 rounded-full bg-emerald-400 animate-dot-move" style="animation-delay: 1.4s"></div>
```

**参数调整**：
- `translateX(160px)` → 移动距离，匹配容器宽度
- `animation-delay` → 多个点的间隔时间
- 垂直移动改用 `translateY`

---

### 4. 淡入上浮

**效果**：元素从下方 20px 处淡入到正常位置，依次出现

**原理**：`opacity` + `translateY` + `animation-delay` 递增

```css
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
    opacity: 0; /* 初始不可见 */
}
```

```html
<div class="animate-fade-in-up">第一个</div>
<div class="animate-fade-in-up" style="animation-delay: 0.2s">第二个</div>
<div class="animate-fade-in-up" style="animation-delay: 0.4s">第三个</div>
```

**注意**：`forwards` 关键字让动画结束后保持最终状态（不回弹到 opacity:0）

---

### 5. 悬停卡片交互

**效果**：鼠标移入时卡片上浮、边框变亮、出现渐变背景

**原理**：Tailwind 的 `group` + `group-hover` + `transition`

```html
<div class="group relative bg-gray-900 border border-gray-800 rounded-xl p-6
            transition-all duration-300
            hover:border-emerald-700 
            hover:shadow-lg hover:shadow-emerald-900/20 
            hover:-translate-y-1">
    
    <!-- 渐变遮罩层（悬停时显现） -->
    <div class="absolute inset-0 rounded-xl 
                bg-gradient-to-b from-emerald-500/5 to-transparent 
                opacity-0 group-hover:opacity-100 
                transition-opacity duration-300">
    </div>
    
    <!-- 内容 -->
    <div class="relative z-10">
        <h3 class="text-white">标题</h3>
        <p class="text-gray-400">描述文字</p>
    </div>
</div>
```

**关键点**：
- `group` 放在父容器，`group-hover:*` 放在子元素
- `transition-all duration-300` 让所有属性变化平滑过渡
- `hover:-translate-y-1` 让卡片上浮 4px
- 渐变遮罩用 `absolute inset-0` 覆盖整个卡片

---

### 6. 光线扫过（Shimmer）

**效果**：卡片/区域有一道微光从左到右扫过

**原理**：`linear-gradient` 背景 + `background-position` 动画

```css
@keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
}
.animate-shimmer {
    background: linear-gradient(
        90deg, 
        transparent 0%, 
        rgba(0, 255, 170, 0.08) 50%, 
        transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
}
```

```html
<div class="bg-gray-900 rounded-xl p-8 animate-shimmer">
    <!-- 内容 -->
</div>
```

---

### 7. 慢速旋转

**效果**：图标/齿轮缓慢持续旋转

```css
@keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
.animate-spin-slow {
    animation: spin-slow 8s linear infinite;
}
```

```html
<svg class="w-8 h-8 text-emerald-400 animate-spin-slow">
    <!-- 齿轮/圆形图标 SVG -->
</svg>
```

---

## 设计规范

### 色彩系统

| 用途 | 色值 | Tailwind 类 |
|------|------|-------------|
| 背景 | #030712 | `bg-gray-950` |
| 卡片背景 | #111827 | `bg-gray-900` |
| 边框常态 | #1f2937 | `border-gray-800` |
| 边框高亮 | emerald-700 | `border-emerald-700` |
| 主色（发光/强调） | #00ffaa | `text-emerald-400` |
| 正文 | #9ca3af | `text-gray-400` |
| 标题 | #ffffff | `text-white` |

### 动画时间规范

| 场景 | 推荐时长 | easing |
|------|----------|--------|
| 悬停过渡 | 200-300ms | ease-out |
| 淡入出现 | 600-800ms | ease-out |
| 连续循环（发光） | 2-3s | ease-in-out |
| 连续循环（流动） | 1-2s | linear |
| 慢速旋转 | 6-10s | linear |

### 性能守则

1. **只动画 `transform` 和 `opacity`** — 这两个属性由 GPU 合成层处理，不触发重排
2. **避免动画 `width/height/margin/padding`** — 会触发回流，性能差
3. **`box-shadow` 动画用于小面积** — 大面积 shadow 动画在低端机上可能卡顿
4. **`will-change` 慎用** — 不要全局加，只在确实需要的元素上加
5. **`prefers-reduced-motion` 媒体查询** — 为不想看动画的用户提供选项：

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 在 React 项目中使用

### React + Tailwind

```jsx
// components/FlowLine.tsx
export function FlowLine({ width = 200 }) {
  return (
    <svg width={width} height="4" viewBox={`0 0 ${width} 4`} fill="none">
      <path
        d={`M 0 2 H ${width}`}
        stroke="rgba(0,255,170,0.4)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        className="animate-dash-flow"
      />
    </svg>
  );
}
```

```jsx
// components/GlowNode.tsx
export function GlowNode({ children }) {
  return (
    <div className="w-16 h-16 rounded-xl border-2 border-emerald-500/50 
                    bg-gray-900 flex items-center justify-center animate-pulse-glow">
      {children}
    </div>
  );
}
```

### 更多 React 组件

```tsx
// components/FlowDot.tsx
export function FlowDot({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="w-2 h-2 rounded-full bg-emerald-400 animate-dot-move"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
```

---

## 文件清单

| 文件 | 用途 |
|------|------|
| `demo-animation.html` | 完整可运行的 Demo（浏览器直接打开） |
| `css-animation-guide.md` | 本文档（技术方案 + 复用指南） |

---

## 快速复制模板

如果你在新项目中要快速用上这套动效，最小集合是：

```html
<!-- 1. 引入 Tailwind -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- 2. 在 <style> 中加入这段自定义动画 -->
<style>
@keyframes dash-flow { to { stroke-dashoffset: -20; } }
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 8px rgba(0,255,170,0.3); }
    50% { box-shadow: 0 0 20px rgba(0,255,170,0.6); }
}
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-dash-flow { animation: dash-flow 1.5s linear infinite; }
.animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
</style>

<!-- 3. 开始使用 class -->
<body class="bg-gray-950 text-white">
    <!-- 你的内容 -->
</body>
```

以上就够覆盖 80% 的科技感动效需求了。


---

## 延伸技术方案（进阶）

> 以下技术基于上述基础动效体系延伸，适用于教程站点、产品官网等需要更丰富交互体验的场景。

---

### 8. View Transitions API — 页面间平滑切换

**效果**：在 SPA 或 MPA 页面切换时，旧页面内容平滑过渡到新页面，而非硬切

**原理**：浏览器对旧/新页面做快照，在两者之间插入 CSS 可控的过渡动画

**浏览器支持**：Chrome 111+, Edge 111+, Safari 18+（2024 年起主流浏览器已覆盖）

```css
/* 全局过渡：默认淡入淡出 */
::view-transition-old(root) {
    animation: fade-out 0.3s ease-out forwards;
}
::view-transition-new(root) {
    animation: fade-in 0.3s ease-in forwards;
}

@keyframes fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
}
@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 为特定元素命名，实现跨页面的位置动画 */
.page-title {
    view-transition-name: page-title;
}
.sidebar {
    view-transition-name: sidebar;
}
```

```js
// SPA 路由切换时触发（适用于 React Router / Next.js）
document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    // 检测浏览器支持
    if (!document.startViewTransition) {
        return; // 降级为默认行为
    }

    e.preventDefault();
    const response = await fetch(link.href);
    const html = await response.text();

    document.startViewTransition(() => {
        // 更新 DOM
        document.querySelector('main').innerHTML = 
            new DOMParser().parseFromString(html, 'text/html').querySelector('main').innerHTML;
        window.history.pushState({}, '', link.href);
    });
});
```

**在 Next.js / React Router 中使用**：

```tsx
// app/layout.tsx (Next.js App Router)
'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // 浏览器支持检测
        if (!document.startViewTransition) return;
        // Next.js App Router 自动处理路由切换
        // 只需在 CSS 中添加 view-transition-name
    }, [pathname]);

    return (
        <html lang="zh">
            <body>{children}</body>
        </html>
    );
}
```

```css
/* globals.css 或 layout 样式 */
main {
    view-transition-name: main-content;
}

::view-transition-old(main-content) {
    animation: slide-out-left 0.25s ease-out;
}
::view-transition-new(main-content) {
    animation: slide-in-right 0.25s ease-out;
}

@keyframes slide-out-left {
    to { transform: translateX(-30px); opacity: 0; }
}
@keyframes slide-in-right {
    from { transform: translateX(30px); opacity: 0; }
}
```

**参数调整**：
- 过渡时长建议 200-400ms，超过会让导航感觉迟缓
- 可对不同元素设置不同 `view-transition-name` 实现独立动画
- 不支持的浏览器会自动降级为无过渡切换

---

### 9. Intersection Observer + 动画触发 — 滚动淡入

**效果**：页面元素在滚动到可视区域时才触发入场动画，避免页面加载时所有动画同时播放

**原理**：Intersection Observer API 监听元素进入视口，添加 CSS 类触发动画

```css
/* 初始状态：不可见 */
.scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

/* 进入视口后：可见 */
.scroll-animate.is-visible {
    opacity: 1;
    transform: translateY(0);
}

/* 不同方向变体 */
.scroll-animate-left {
    opacity: 0;
    transform: translateX(-30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.scroll-animate-left.is-visible {
    opacity: 1;
    transform: translateX(0);
}

.scroll-animate-scale {
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.scroll-animate-scale.is-visible {
    opacity: 1;
    transform: scale(1);
}
```

```js
// 通用 Intersection Observer 初始化
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // 只触发一次
        }
    });
}, {
    threshold: 0.15,      // 元素 15% 可见时触发
    rootMargin: '0px 0px -50px 0px'  // 底部留 50px 余量，提前触发
});

// 监听所有带标记的元素
document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-scale')
    .forEach(el => observer.observe(el));
```

**React 组件封装**：

```tsx
// components/ScrollReveal.tsx
'use client';
import { useRef, useEffect, useState, ReactNode } from 'react';

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    threshold?: number;
    className?: string;
}

export function ScrollReveal({ children, delay = 0, threshold = 0.15, className = '' }: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div
            ref={ref}
            className={`scroll-animate ${isVisible ? 'is-visible' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
```

**在页面中使用**：

```tsx
<ScrollReveal>
    <h2>这个标题会在滚动到时淡入</h2>
</ScrollReveal>

<ScrollReveal delay={200}>
    <p>这段内容会延迟 200ms 后淡入。</p>
</ScrollReveal>
```

---

### 10. CSS Scroll-Driven Animations — 阅读进度条

**效果**：页面顶部有一个颜色条，宽度随滚动进度从 0% 到 100% 变化

**原理**：CSS `animation-timeline: scroll()` 将动画进度绑定到滚动位置，无需 JS

**浏览器支持**：Chrome 115+, Edge 115+（Firefox/Safari 逐步支持中）

```css
/* 进度条样式 */
.reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 100%;
    background: linear-gradient(90deg, #00ffaa, #10b981, #059669);
    transform-origin: left;
    transform: scaleX(0);
    z-index: 9999;

    /* 绑定到页面滚动 */
    animation: progress-grow linear;
    animation-timeline: scroll();
}

@keyframes progress-grow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
}

/* 可选：发光效果 */
.reading-progress::after {
    content: '';
    position: absolute;
    right: 0;
    top: -2px;
    width: 80px;
    height: 7px;
    background: radial-gradient(ellipse, rgba(0,255,170,0.6) 0%, transparent 70%);
    filter: blur(2px);
}
```

```html
<!-- 放在页面最顶部 -->
<div class="reading-progress"></div>
```

**带 JS 降级方案（不支持 scroll-timeline 的浏览器）**：

```js
// 降级：用 JS 监听滚动
if (!CSS.supports('animation-timeline', 'scroll()')) {
    const progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
        // 移除 CSS animation-timeline 相关样式
        progressBar.style.animation = 'none';
        
        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollTop / scrollHeight;
            progressBar.style.transform = `scaleX(${progress})`;
        }, { passive: true });
    }
}
```

**React 组件封装**：

```tsx
// components/ReadingProgress.tsx
'use client';
import { useRef, useEffect } from 'react';

export function ReadingProgress() {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;

        // 检测是否支持 CSS scroll-driven animations
        if (CSS.supports('animation-timeline', 'scroll()')) return;

        // 降级：JS 监听滚动
        bar.style.animation = 'none';

        const onScroll = () => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${scrollTop / scrollHeight})`;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return <div className="reading-progress" ref={barRef} />;
}
```

```css
/* 对应 CSS（放在全局样式中） */
.reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 100%;
    background: linear-gradient(90deg, #00ffaa, #10b981, #059669);
    transform-origin: left;
    transform: scaleX(0);
    z-index: 9999;
    animation: progress-grow linear;
    animation-timeline: scroll();
}

@keyframes progress-grow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
}
```

---

### 11. Backdrop Filter（毛玻璃） — 导航栏悬浮效果

**效果**：导航栏半透明，背后的内容呈现模糊磨砂效果，滚动时内容从导航下方穿过

**原理**：`backdrop-filter: blur()` 对元素背后的内容做实时模糊

```css
/* 毛玻璃导航栏 */
.nav-glass {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    
    /* 毛玻璃核心属性 */
    background: rgba(3, 7, 18, 0.75);      /* gray-950 半透明 */
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    
    /* 底部分隔线 */
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    
    /* 过渡效果 */
    transition: background 0.3s ease, backdrop-filter 0.3s ease;
}

/* 滚动后增强模糊 */
.nav-glass.scrolled {
    background: rgba(3, 7, 18, 0.9);
    backdrop-filter: blur(16px) saturate(200%);
}
```

```html
<nav class="nav-glass px-6 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" class="text-emerald-400 font-bold text-lg">Course Hub</a>
        <div class="flex gap-6 text-sm text-gray-300">
            <a href="/ragflow/" class="hover:text-emerald-400 transition-colors">RAGFlow</a>
            <a href="/ollama/" class="hover:text-emerald-400 transition-colors">Ollama</a>
        </div>
    </div>
</nav>
```

```js
// 监听滚动添加 scrolled 类
const nav = document.querySelector('.nav-glass');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });
```

**在 Next.js 中覆盖导航样式**：

```css
/* app/globals.css */
header, nav {
    background: rgba(3, 7, 18, 0.75) !important;
    backdrop-filter: blur(12px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

/* 暗色模式（使用 class 策略或 next-themes） */
.dark header, .dark nav {
    background: rgba(3, 7, 18, 0.8) !important;
}
```

**兼容性**：所有现代浏览器均支持。IE 不支持但无需考虑。

---

### 12. Gradient Border 旋转动画 — 重点内容边框

**效果**：元素边框呈现彩色渐变且持续旋转流动，用于高亮重要内容块

**原理**：利用 `conic-gradient` + 伪元素 + `overflow: hidden` 模拟旋转边框

```css
/* 旋转渐变边框 */
.gradient-border {
    position: relative;
    border-radius: 12px;
    padding: 2px; /* 边框宽度 */
    overflow: hidden;
}

.gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    
    /* 锥形渐变 */
    background: conic-gradient(
        from 0deg,
        #00ffaa,
        #10b981,
        #064e3b,
        #030712,
        #064e3b,
        #10b981,
        #00ffaa
    );
    
    /* 旋转动画 */
    animation: border-rotate 4s linear infinite;
}

.gradient-border > .gradient-border-content {
    position: relative;
    background: #111827; /* gray-900 */
    border-radius: 10px; /* 比外层小 2px（= padding） */
    padding: 24px;
    z-index: 1;
}

@keyframes border-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

**问题**：上面的方法旋转时圆角会有问题。更稳定的方案用放大的伪元素：

```css
/* 改进版：放大伪元素 */
.gradient-border-v2 {
    position: relative;
    border-radius: 12px;
    padding: 2px;
}

.gradient-border-v2::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;        /* 放大确保覆盖 */
    height: 200%;
    transform: translate(-50%, -50%);
    
    background: conic-gradient(
        from 0deg,
        transparent 0%,
        #00ffaa 20%,
        transparent 40%,
        transparent 60%,
        #10b981 80%,
        transparent 100%
    );
    
    animation: border-rotate 3s linear infinite;
    z-index: -1;
}

.gradient-border-v2::after {
    content: '';
    position: absolute;
    inset: 2px; /* 边框厚度 */
    background: #111827;
    border-radius: 10px;
    z-index: -1;
}

@keyframes border-rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

```html
<!-- 使用示例：高亮提示框 -->
<div class="gradient-border-v2 rounded-xl overflow-hidden">
    <div class="relative z-10 bg-gray-900 rounded-[10px] p-6 m-[2px]">
        <h3 class="text-emerald-400 font-semibold mb-2">⚡ 重要提示</h3>
        <p class="text-gray-300 text-sm">这是需要特别关注的内容，旋转边框吸引用户注意力。</p>
    </div>
</div>
```

**Tailwind 版本（更简洁）**：

```html
<!-- 利用 Tailwind 的 bg-gradient + animate -->
<div class="relative p-[2px] rounded-xl overflow-hidden">
    <!-- 旋转背景 -->
    <div class="absolute inset-0 bg-[conic-gradient(from_0deg,#00ffaa,#10b981,#064e3b,#030712,#064e3b,#10b981,#00ffaa)] animate-spin-slow"></div>
    <!-- 内容层 -->
    <div class="relative bg-gray-900 rounded-[10px] p-6">
        <p class="text-gray-300">内容</p>
    </div>
</div>
```

**参数调整**：
- 旋转速度：`3-6s`（太快会眩晕，太慢看不出旋转）
- 颜色：改 `conic-gradient` 里的色值匹配主题
- 边框厚度：改外层 `padding` 和内层 `inset`/`m-[Xpx]` 值
- 只在 hover 时旋转：`animation-play-state: paused` → `:hover { animation-play-state: running }`

---

## 延伸技术组合建议

| 场景 | 推荐技术组合 |
|------|-------------|
| 教程首页 Hero | 虚线流动 + 脉冲发光 + 淡入上浮 + 毛玻璃导航 |
| 架构图 | SVG 动画 + 移动粒子 + 悬停卡片 |
| 教程内容页 | 滚动淡入 + 阅读进度条 + View Transitions |
| 重要提示/警告框 | Gradient Border + 脉冲发光 |
| 代码示例区域 | 光线扫过（Shimmer）+ 悬停高亮 |
| 功能对比/特性展示 | 悬停卡片 + 淡入上浮 + 渐变边框 |
| 页面导航切换 | View Transitions + 毛玻璃导航 |
| 文章进度反馈 | Scroll-Driven 进度条 |

---

## 性能与兼容性总结

| 技术 | Chrome | Firefox | Safari | 性能影响 | 降级方案 |
|------|--------|---------|--------|----------|----------|
| View Transitions | 111+ | ❌ | 18+ | 低 | 无过渡，直接切换 |
| Intersection Observer | 51+ | 55+ | 12.1+ | 极低 | 全部立即可见 |
| Scroll-Driven Animations | 115+ | ❌ | ❌ | 低 | JS scroll 监听 |
| Backdrop Filter | 76+ | 103+ | 9+ | 中 | 纯色半透明背景 |
| Conic Gradient | 69+ | 83+ | 12.1+ | 低 | 纯色边框 |

**性能守则补充**：
1. Backdrop Filter 在大面积使用时可能影响滚动性能 — 只用于导航栏等小面积固定元素
2. Scroll-Driven Animations 是纯 CSS 方案，比 JS scroll 监听性能更好（在主线程外执行）
3. Gradient Border 旋转动画涉及大面积重绘 — 加 `will-change: transform` 且数量控制在每页 2-3 个以内
4. View Transitions 由浏览器原生管理快照和合成 — 几乎无性能代价

---

## 衍生美观场景（基于上述技术组合）

> 以下场景均基于文档中已有的动画技术（keyframes、transform、opacity、SVG stroke、box-shadow、gradient、backdrop-filter 等）进行组合与延伸，可直接复用已有的动画类。

---

### 场景 A：粒子星空背景

**视觉效果**：页面背景布满微小光点，缓慢漂浮闪烁，营造宇宙/深空氛围

**技术组合**：脉冲发光（opacity 闪烁）+ 移动粒子（translateY 缓慢上浮）+ animation-delay 随机化

```css
@keyframes twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
}

@keyframes float-up {
    0% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-20px) translateX(5px); }
    100% { transform: translateY(0) translateX(0); }
}

.star {
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    animation: twinkle 3s ease-in-out infinite, float-up 6s ease-in-out infinite;
}

.star--large {
    width: 3px;
    height: 3px;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
}
```

```html
<div class="relative w-full h-screen bg-gray-950 overflow-hidden">
    <!-- 通过不同 delay 和位置模拟随机分布 -->
    <div class="star" style="top:10%; left:15%; animation-delay:0s"></div>
    <div class="star star--large" style="top:25%; left:40%; animation-delay:1.2s"></div>
    <div class="star" style="top:60%; left:70%; animation-delay:0.5s"></div>
    <div class="star" style="top:35%; left:85%; animation-delay:2.1s"></div>
    <div class="star star--large" style="top:75%; left:25%; animation-delay:0.8s"></div>
    <div class="star" style="top:50%; left:55%; animation-delay:1.7s"></div>
    <div class="star" style="top:85%; left:10%; animation-delay:2.5s"></div>
    <div class="star star--large" style="top:15%; left:90%; animation-delay:0.3s"></div>
    <!-- 可用 JS 批量生成 30-50 个 -->
</div>
```

```js
// JS 批量生成星星
function createStarfield(container, count = 50) {
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = `star ${Math.random() > 0.7 ? 'star--large' : ''}`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.animationDuration = `${2 + Math.random() * 3}s, ${4 + Math.random() * 4}s`;
        container.appendChild(star);
    }
}
```

**适用场景**：Hero 区域、About 页面、加载等待页

---

### 场景 B：霓虹文字发光

**视觉效果**：标题文字呈现霓虹灯管效果，带有呼吸式光晕脉冲

**技术组合**：脉冲发光（text-shadow 替代 box-shadow）+ 渐变色文字

```css
@keyframes neon-pulse {
    0%, 100% {
        text-shadow:
            0 0 4px rgba(0, 255, 170, 0.8),
            0 0 8px rgba(0, 255, 170, 0.5),
            0 0 16px rgba(0, 255, 170, 0.3);
    }
    50% {
        text-shadow:
            0 0 8px rgba(0, 255, 170, 1),
            0 0 20px rgba(0, 255, 170, 0.7),
            0 0 40px rgba(0, 255, 170, 0.4),
            0 0 60px rgba(0, 255, 170, 0.2);
    }
}

.neon-text {
    color: #00ffaa;
    font-weight: 700;
    animation: neon-pulse 2.5s ease-in-out infinite;
}

/* 多色霓虹变体 */
@keyframes neon-rainbow {
    0%, 100% {
        color: #00ffaa;
        text-shadow: 0 0 10px #00ffaa, 0 0 30px #00ffaa;
    }
    33% {
        color: #00aaff;
        text-shadow: 0 0 10px #00aaff, 0 0 30px #00aaff;
    }
    66% {
        color: #ff00aa;
        text-shadow: 0 0 10px #ff00aa, 0 0 30px #ff00aa;
    }
}

.neon-rainbow {
    animation: neon-rainbow 6s ease-in-out infinite;
    font-weight: 700;
}
```

```html
<h1 class="neon-text text-4xl md:text-6xl text-center">
    AI Course Hub
</h1>

<!-- 带闪烁"故障"的霓虹 -->
<h2 class="neon-rainbow text-3xl text-center tracking-wider">
    LEARN × BUILD × SHIP
</h2>
```

**适用场景**：落地页标题、活动页面、品牌展示

---

### 场景 C：渐变色流动文字

**视觉效果**：文字填充色是渐变色，且渐变色持续流动变化

**技术组合**：Shimmer 技术（background-position 动画）+ `background-clip: text`

```css
@keyframes gradient-flow {
    0% { background-position: 0% center; }
    50% { background-position: 100% center; }
    100% { background-position: 0% center; }
}

.gradient-text {
    background: linear-gradient(
        90deg,
        #00ffaa,
        #10b981,
        #06b6d4,
        #3b82f6,
        #00ffaa
    );
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-flow 4s ease-in-out infinite;
}
```

```html
<h1 class="gradient-text text-5xl font-bold">
    下一代 AI 教程平台
</h1>
```

**Tailwind 版本**：

```html
<h1 class="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 
           bg-[length:300%_100%] bg-clip-text text-transparent animate-[gradient-flow_4s_ease-in-out_infinite]">
    下一代 AI 教程平台
</h1>
```

**适用场景**：品牌 slogan、技术名词高亮、CTA 按钮文字

---

### 场景 D：环形进度指示器

**视觉效果**：圆环形状的进度条，带有发光尾迹，从 0% 到 100% 渐进

**技术组合**：SVG stroke-dasharray/dashoffset（虚线流动原理）+ 脉冲发光

```css
@keyframes circle-progress {
    from { stroke-dashoffset: 283; } /* 圆周长 2πr = 2*3.14*45 ≈ 283 */
    to { stroke-dashoffset: 0; }
}

@keyframes circle-glow {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(0, 255, 170, 0.5)); }
    50% { filter: drop-shadow(0 0 8px rgba(0, 255, 170, 0.9)); }
}

.progress-ring {
    transform: rotate(-90deg); /* 从顶部开始 */
}

.progress-ring__circle {
    stroke-dasharray: 283;
    stroke-dashoffset: 283;
    transition: stroke-dashoffset 0.5s ease;
    animation: circle-glow 2s ease-in-out infinite;
}

/* 用 CSS 变量控制进度 */
.progress-ring__circle[data-progress] {
    stroke-dashoffset: calc(283 - (283 * var(--progress)) / 100);
}
```

```html
<div class="relative w-32 h-32">
    <!-- 背景环 -->
    <svg class="progress-ring w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" 
                fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
        <!-- 进度环 -->
        <circle cx="50" cy="50" r="45" 
                fill="none" stroke="#00ffaa" stroke-width="6" 
                stroke-linecap="round"
                class="progress-ring__circle"
                style="--progress: 75; stroke-dashoffset: calc(283 - (283 * 75) / 100)"/>
    </svg>
    <!-- 中心文字 -->
    <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-2xl font-bold text-emerald-400">75%</span>
    </div>
</div>
```

**动画版本（自动从 0 转到目标值）**：

```css
@keyframes fill-progress {
    from { stroke-dashoffset: 283; }
    to { stroke-dashoffset: 71; } /* 283 - 283*0.75 = 71 → 75% */
}

.progress-ring__circle--animated {
    stroke-dasharray: 283;
    animation: fill-progress 2s ease-out forwards, circle-glow 2s ease-in-out infinite;
}
```

**适用场景**：技能熟练度展示、加载状态、数据统计仪表盘

---

### 场景 E：波浪分隔线

**视觉效果**：页面章节之间用波浪形 SVG 分隔，波浪缓慢流动

**技术组合**：SVG path + dash-flow 原理（改为水平偏移整个 path）

```css
@keyframes wave-flow {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.wave-divider {
    position: relative;
    width: 100%;
    height: 60px;
    overflow: hidden;
}

.wave-divider svg {
    position: absolute;
    width: 200%; /* 两倍宽，平移一半形成无缝循环 */
    height: 100%;
    animation: wave-flow 8s linear infinite;
}
```

```html
<div class="wave-divider">
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" fill="none">
        <!-- 两段相同波形拼接，实现无缝循环 -->
        <path d="M0,30 C150,10 300,50 450,30 C600,10 750,50 900,30 
                 C1050,10 1200,50 1350,30 C1500,10 1650,50 1800,30"
              stroke="rgba(0,255,170,0.3)" stroke-width="1.5" />
        <path d="M0,35 C150,55 300,15 450,35 C600,55 750,15 900,35 
                 C1050,55 1200,15 1350,35 C1500,55 1650,15 1800,35"
              stroke="rgba(16,185,129,0.2)" stroke-width="1" />
    </svg>
</div>
```

**填充色波浪（章节背景过渡）**：

```html
<div class="relative">
    <!-- 上方内容区 bg-gray-950 -->
    <section class="bg-gray-950 py-20">...</section>
    
    <!-- 波浪过渡 -->
    <div class="wave-divider bg-gray-900">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,0 C360,60 1080,0 1440,60 L1440,0 L0,0 Z"
                  fill="#030712"/>  <!-- gray-950 色填充 -->
        </svg>
    </div>
    
    <!-- 下方内容区 bg-gray-900 -->
    <section class="bg-gray-900 py-20">...</section>
</div>
```

**适用场景**：章节分隔、Hero 底部过渡、页脚顶部装饰

---

### 场景 F：3D 卡片翻转

**视觉效果**：鼠标悬停时卡片翻转 180°，展示背面内容（如技术细节、代码片段）

**技术组合**：CSS perspective + rotateY + backface-visibility（基于 transform 体系）

```css
.flip-card {
    perspective: 1000px;
    width: 280px;
    height: 360px;
}

.flip-card__inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s ease;
    transform-style: preserve-3d;
}

.flip-card:hover .flip-card__inner {
    transform: rotateY(180deg);
}

.flip-card__front,
.flip-card__back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.flip-card__front {
    background: #111827;
    border: 1px solid rgba(255,255,255,0.08);
}

.flip-card__back {
    background: linear-gradient(135deg, #064e3b, #111827);
    border: 1px solid rgba(0, 255, 170, 0.3);
    transform: rotateY(180deg);
}
```

```html
<div class="flip-card">
    <div class="flip-card__inner">
        <!-- 正面 -->
        <div class="flip-card__front">
            <svg class="w-12 h-12 text-emerald-400 mb-4"><!-- 图标 --></svg>
            <h3 class="text-white text-lg font-semibold">RAGFlow</h3>
            <p class="text-gray-400 text-sm text-center mt-2">基于深度文档理解的 RAG 引擎</p>
        </div>
        <!-- 背面 -->
        <div class="flip-card__back">
            <h3 class="text-emerald-400 font-semibold mb-3">技术栈</h3>
            <ul class="text-gray-300 text-sm space-y-1">
                <li>• Document Parsing</li>
                <li>• Vector Search</li>
                <li>• Knowledge Graph</li>
                <li>• LLM Orchestration</li>
            </ul>
        </div>
    </div>
</div>
```

**适用场景**：团队成员展示、技术栈介绍、课程模块卡片

---

### 场景 G：打字机效果

**视觉效果**：文字逐字出现，末尾有闪烁光标，模拟终端输入

**技术组合**：`width` 从 0 到 100%（或 steps() 步进）+ 光标用 border-right 闪烁

```css
@keyframes typing {
    from { width: 0; }
    to { width: 100%; }
}

@keyframes blink-cursor {
    0%, 100% { border-color: #00ffaa; }
    50% { border-color: transparent; }
}

.typewriter {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    border-right: 2px solid #00ffaa;
    width: 0;
    animation: 
        typing 2.5s steps(30, end) forwards,
        blink-cursor 0.8s step-end infinite;
}

/* 多行打字机：逐行出现 */
.typewriter-line {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    animation: typing 1.5s steps(20, end) forwards;
}

.typewriter-line:nth-child(2) { animation-delay: 1.5s; }
.typewriter-line:nth-child(3) { animation-delay: 3s; }
.typewriter-line:nth-child(4) { animation-delay: 4.5s; }
```

```html
<!-- 单行打字机 -->
<div class="bg-gray-900 rounded-lg p-6 font-mono">
    <span class="text-gray-500">$ </span>
    <span class="typewriter text-emerald-400">pip install ragflow-sdk --upgrade</span>
</div>

<!-- 多行终端效果 -->
<div class="bg-gray-900 rounded-lg p-6 font-mono text-sm space-y-1">
    <span class="typewriter-line text-gray-500">$ docker compose up -d</span>
    <span class="typewriter-line text-emerald-400">✓ Container ragflow-server started</span>
    <span class="typewriter-line text-emerald-400">✓ Container ragflow-mysql started</span>
    <span class="typewriter-line text-cyan-400">⚡ All services running on port 9380</span>
</div>
```

**适用场景**：终端命令演示、代码示例引入、教程步骤展示、AI 对话模拟

---

### 场景 H：数据流拓扑图

**视觉效果**：多个节点（卡片）之间有 SVG 连接线，线上有流动粒子，展示数据流向

**技术组合**：SVG path + 虚线流动 + 移动粒子 + 脉冲发光节点

```html
<div class="relative w-full max-w-4xl mx-auto h-[300px]">
    <!-- SVG 连接线层 -->
    <svg class="absolute inset-0 w-full h-full" fill="none">
        <!-- 连接线 1: 节点 A → 节点 B -->
        <path d="M 120 80 C 200 80, 280 150, 360 150" 
              stroke="rgba(0,255,170,0.3)" stroke-width="1.5"
              stroke-dasharray="6 4" class="animate-dash-flow"/>
        
        <!-- 连接线 2: 节点 B → 节点 C -->
        <path d="M 420 150 C 500 150, 560 80, 640 80" 
              stroke="rgba(0,255,170,0.3)" stroke-width="1.5"
              stroke-dasharray="6 4" class="animate-dash-flow"
              style="animation-delay: 0.5s"/>
        
        <!-- 流动粒子（沿路径移动） -->
        <circle r="3" fill="#00ffaa" filter="url(#glow)">
            <animateMotion dur="2s" repeatCount="indefinite"
                path="M 120 80 C 200 80, 280 150, 360 150"/>
        </circle>
        <circle r="3" fill="#10b981" filter="url(#glow)">
            <animateMotion dur="2s" repeatCount="indefinite" begin="1s"
                path="M 420 150 C 500 150, 560 80, 640 80"/>
        </circle>
        
        <!-- 发光滤镜 -->
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
    </svg>
    
    <!-- 节点 A -->
    <div class="absolute top-[50px] left-[40px] w-28 h-16 rounded-xl border-2 
                border-emerald-500/50 bg-gray-900 flex items-center justify-center
                animate-pulse-glow">
        <span class="text-emerald-400 text-xs font-medium">文档上传</span>
    </div>
    
    <!-- 节点 B -->
    <div class="absolute top-[120px] left-[310px] w-28 h-16 rounded-xl border-2 
                border-cyan-500/50 bg-gray-900 flex items-center justify-center
                animate-pulse-glow" style="animation-delay: 0.8s">
        <span class="text-cyan-400 text-xs font-medium">向量化</span>
    </div>
    
    <!-- 节点 C -->
    <div class="absolute top-[50px] left-[590px] w-28 h-16 rounded-xl border-2 
                border-blue-500/50 bg-gray-900 flex items-center justify-center
                animate-pulse-glow" style="animation-delay: 1.6s">
        <span class="text-blue-400 text-xs font-medium">检索回答</span>
    </div>
</div>
```

**适用场景**：架构图、数据管线展示、微服务拓扑、AI 工作流可视化

---

### 场景 I：Morphing 有机形状（液态斑点）

**视觉效果**：背景中有柔和的彩色斑点，形状持续缓慢变形，类似 lava lamp 效果

**技术组合**：border-radius 多值动画 + scale + 慢速旋转

```css
@keyframes morph {
    0% {
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        transform: rotate(0deg) scale(1);
    }
    25% {
        border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    }
    50% {
        border-radius: 50% 60% 30% 60% / 30% 50% 70% 50%;
        transform: rotate(180deg) scale(1.05);
    }
    75% {
        border-radius: 60% 30% 50% 40% / 60% 40% 60% 30%;
    }
    100% {
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        transform: rotate(360deg) scale(1);
    }
}

.blob {
    width: 300px;
    height: 300px;
    animation: morph 12s ease-in-out infinite;
    opacity: 0.15;
    filter: blur(40px);
}

.blob--green {
    background: #00ffaa;
}
.blob--blue {
    background: #3b82f6;
    animation-delay: -4s;
    animation-duration: 15s;
}
.blob--purple {
    background: #8b5cf6;
    animation-delay: -8s;
    animation-duration: 18s;
}
```

```html
<!-- 放在页面背景层 -->
<div class="fixed inset-0 -z-10 overflow-hidden">
    <div class="blob blob--green absolute top-[10%] left-[20%]"></div>
    <div class="blob blob--blue absolute top-[50%] right-[15%]"></div>
    <div class="blob blob--purple absolute bottom-[20%] left-[40%]"></div>
</div>

<!-- 前景内容 -->
<main class="relative z-10">
    <!-- 你的页面内容 -->
</main>
```

**适用场景**：落地页背景、登录页面、品牌主页、创意展示页

---

### 场景 J：时间轴滚动动画

**视觉效果**：垂直时间轴，随滚动逐步展开，每个节点带淡入 + 连接线延伸

**技术组合**：Intersection Observer 触发 + 淡入上浮 + SVG stroke-dashoffset（线条延伸）

```css
/* 时间轴主线 */
.timeline-line {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(0, 255, 170, 0.1);
    transform: translateX(-50%);
}

/* 已激活的线段（滚动触发） */
.timeline-line__fill {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 0;
    background: linear-gradient(180deg, #00ffaa, #10b981);
    transition: height 0.8s ease-out;
    box-shadow: 0 0 8px rgba(0, 255, 170, 0.4);
}

/* 时间轴节点 */
.timeline-node {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #030712;
    border: 2px solid rgba(0, 255, 170, 0.3);
    position: absolute;
    left: 50%;
    transform: translateX(-50%) scale(0);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), /* 弹性 */
                border-color 0.3s ease,
                box-shadow 0.3s ease;
}

.timeline-node.is-active {
    transform: translateX(-50%) scale(1);
    border-color: #00ffaa;
    box-shadow: 0 0 12px rgba(0, 255, 170, 0.5);
}

/* 时间轴内容卡片 */
.timeline-card {
    opacity: 0;
    transform: translateX(-30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.timeline-card--right {
    transform: translateX(30px);
}

.timeline-card.is-visible {
    opacity: 1;
    transform: translateX(0);
}
```

```html
<div class="relative max-w-3xl mx-auto py-20">
    <!-- 中轴线 -->
    <div class="timeline-line">
        <div class="timeline-line__fill" id="timeline-fill"></div>
    </div>
    
    <!-- 节点 1 -->
    <div class="relative flex items-center mb-16" data-timeline-item>
        <div class="timeline-card w-5/12 pr-8 text-right">
            <h3 class="text-white font-semibold">环境搭建</h3>
            <p class="text-gray-400 text-sm mt-1">安装 Docker, 拉取镜像, 启动服务</p>
        </div>
        <div class="timeline-node" data-timeline-node></div>
        <div class="w-5/12 pl-8"></div>
    </div>
    
    <!-- 节点 2 -->
    <div class="relative flex items-center mb-16" data-timeline-item>
        <div class="w-5/12 pr-8"></div>
        <div class="timeline-node" data-timeline-node></div>
        <div class="timeline-card timeline-card--right w-5/12 pl-8">
            <h3 class="text-white font-semibold">数据导入</h3>
            <p class="text-gray-400 text-sm mt-1">上传文档, 配置解析策略, 构建知识库</p>
        </div>
    </div>
    
    <!-- 节点 3 -->
    <div class="relative flex items-center mb-16" data-timeline-item>
        <div class="timeline-card w-5/12 pr-8 text-right">
            <h3 class="text-white font-semibold">模型对接</h3>
            <p class="text-gray-400 text-sm mt-1">接入 LLM API, 配置 Prompt 模板</p>
        </div>
        <div class="timeline-node" data-timeline-node></div>
        <div class="w-5/12 pl-8"></div>
    </div>
</div>
```

```js
// 时间轴滚动驱动
const fill = document.getElementById('timeline-fill');
const items = document.querySelectorAll('[data-timeline-item]');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target.querySelector('.timeline-card');
            const node = entry.target.querySelector('[data-timeline-node]');
            card?.classList.add('is-visible');
            node?.classList.add('is-active');
        }
    });
}, { threshold: 0.3 });

items.forEach(item => observer.observe(item));

// 中轴线延伸跟随滚动
window.addEventListener('scroll', () => {
    const timeline = fill.parentElement;
    const rect = timeline.getBoundingClientRect();
    const scrolled = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
    fill.style.height = `${scrolled * 100}%`;
}, { passive: true });
```

**适用场景**：学习路线图、产品发展历程、教程步骤导航、版本更新日志

---

### 场景 K：鼠标跟踪聚光灯

**视觉效果**：鼠标移动时，卡片/区域上有一个柔和的光圈跟随鼠标，形成聚光灯效果

**技术组合**：CSS 自定义属性 + radial-gradient + 微量 JS（仅传递坐标）

```css
.spotlight-card {
    --mouse-x: 50%;
    --mouse-y: 50%;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.spotlight-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        400px circle at var(--mouse-x) var(--mouse-y),
        rgba(0, 255, 170, 0.08) 0%,
        transparent 60%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.spotlight-card:hover::before {
    opacity: 1;
}

/* 边框也跟随发光 */
.spotlight-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: radial-gradient(
        300px circle at var(--mouse-x) var(--mouse-y),
        rgba(0, 255, 170, 0.2) 0%,
        transparent 50%
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    padding: 1px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.spotlight-card:hover::after {
    opacity: 1;
}
```

```js
// 仅传递坐标，动画由 CSS 处理（性能最优）
document.querySelectorAll('.spotlight-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
});
```

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
    <div class="spotlight-card p-6">
        <h3 class="text-white font-semibold mb-2">RAGFlow</h3>
        <p class="text-gray-400 text-sm">深度文档理解 + 检索增强生成</p>
    </div>
    <div class="spotlight-card p-6">
        <h3 class="text-white font-semibold mb-2">Ollama</h3>
        <p class="text-gray-400 text-sm">本地运行大语言模型</p>
    </div>
    <div class="spotlight-card p-6">
        <h3 class="text-white font-semibold mb-2">LangChain</h3>
        <p class="text-gray-400 text-sm">LLM 应用编排框架</p>
    </div>
</div>
```

**适用场景**：功能特性网格、定价卡片、团队成员列表、产品对比

---

### 场景 L：数字计数器滚动

**视觉效果**：数字从 0 快速滚动到目标值，用于展示统计数据

**技术组合**：CSS @property（自定义属性动画）或 JS requestAnimationFrame + 淡入上浮

```css
/* 纯 CSS 方案（Chrome 85+, Safari 15.4+）*/
@property --num {
    syntax: '<integer>';
    initial-value: 0;
    inherits: false;
}

@keyframes count-up {
    from { --num: 0; }
    to { --num: var(--target); }
}

.counter {
    animation: count-up 2s ease-out forwards;
    counter-reset: num var(--num);
    font-variant-numeric: tabular-nums;
}

.counter::after {
    content: counter(num);
}
```

```html
<div class="grid grid-cols-3 gap-8 text-center">
    <div>
        <div class="counter text-4xl font-bold text-emerald-400" style="--target: 150"></div>
        <p class="text-gray-400 text-sm mt-2">教程章节</p>
    </div>
    <div>
        <div class="counter text-4xl font-bold text-cyan-400" style="--target: 42"></div>
        <p class="text-gray-400 text-sm mt-2">开源项目</p>
    </div>
    <div>
        <div class="counter text-4xl font-bold text-blue-400" style="--target: 8600"></div>
        <p class="text-gray-400 text-sm mt-2">学习者</p>
    </div>
</div>
```

**JS 降级方案（兼容所有浏览器）**：

```js
function animateCounter(element, target, duration = 2000) {
    const start = performance.now();
    
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased).toLocaleString();
        
        if (progress < 1) requestAnimationFrame(update);
    }
    
    requestAnimationFrame(update);
}

// 结合 Intersection Observer，滚动到时触发
const counters = document.querySelectorAll('[data-count-to]');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.countTo);
            animateCounter(entry.target, target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));
```

**适用场景**：数据统计区、关于页面成就展示、产品用量指标

---

## 场景适配速查表

| 页面类型 | 推荐衍生场景组合 |
|---------|----------------|
| 产品首页 Hero | 粒子星空 + 霓虹文字 + 渐变流动文字 + Morphing 背景 |
| 功能特性展示 | 鼠标聚光灯卡片 + 3D 翻转 + 数据流拓扑 |
| 教程/文档站 | 打字机效果 + 时间轴 + 滚动淡入 + 进度条 |
| 数据看板 | 环形进度 + 数字计数器 + 脉冲发光节点 |
| About/关于 | 时间轴 + 数字计数器 + 粒子星空背景 |
| 博客/文章 | 波浪分隔线 + 阅读进度条 + 滚动淡入 |
| 落地页/活动页 | 霓虹文字 + Morphing 背景 + 渐变边框 + 3D 翻转 |

---

## 性能注意事项（衍生场景）

| 场景 | 性能影响 | 优化建议 |
|------|----------|----------|
| 粒子星空 | 中 | 控制粒子数量 30-60 个，用 `will-change: transform` |
| 霓虹文字 | 低 | text-shadow 层数控制在 3 层以内 |
| 渐变流动文字 | 低 | 仅 background-position 变化，GPU 友好 |
| 环形进度 | 低 | SVG 元素轻量，数量不限 |
| 波浪分隔线 | 低 | 仅 translateX，GPU 合成层 |
| 3D 翻转 | 低 | 仅 hover 触发，非持续动画 |
| 打字机 | 低 | steps() 无中间帧，性能极好 |
| 数据流拓扑 | 中 | SVG animateMotion 性能好于 JS，控制粒子数 |
| Morphing 斑点 | 中 | filter:blur 开销大，控制在 3 个以内 + 降低 blur 值 |
| 时间轴 | 低 | Intersection Observer 无持续计算 |
| 鼠标聚光灯 | 低 | CSS 变量 + radial-gradient 由 GPU 渲染 |
| 数字计数器 | 低 | 仅文字内容变化，不触发重排（使用 tabular-nums）|

---

## 衍生美观场景 · 第二辑（2025-2026 趋势）

> 基于网络调研及 2025-2026 年 Web 设计趋势，以下场景在 SaaS 官网、产品 Landing Page、创意工作室等领域广泛使用。
> 参考来源：[Frontend Masters Blog](https://frontendmasters.com/blog/)、[Smashing Magazine](https://www.smashingmagazine.com/)、[CSS-Tricks](https://css-tricks.com/)

---

### 场景 M：无限滚动 Logo 墙（Marquee）

**视觉效果**：一排合作伙伴/技术栈 Logo 无缝循环水平滚动，hover 暂停

**技术组合**：translateX 动画 + 内容复制（无缝拼接）+ `animation-play-state`

**流行度**：几乎所有 B2B SaaS 官网标配，如 Vercel、Linear、Stripe

```css
@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); } /* 移动一半宽度（因为内容重复了一次） */
}

.marquee-container {
    overflow: hidden;
    position: relative;
    /* 两侧淡出遮罩 */
    mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 10%,
        black 90%,
        transparent 100%
    );
    -webkit-mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 10%,
        black 90%,
        transparent 100%
    );
}

.marquee-track {
    display: flex;
    gap: 3rem;
    width: max-content;
    animation: marquee 30s linear infinite;
}

.marquee-container:hover .marquee-track {
    animation-play-state: paused;
}

/* 反向滚动变体 */
.marquee-track--reverse {
    animation-direction: reverse;
}

/* 速度变体 */
.marquee-track--fast { animation-duration: 15s; }
.marquee-track--slow { animation-duration: 45s; }
```

```html
<div class="marquee-container py-8">
    <div class="marquee-track">
        <!-- 第一组 Logo -->
        <div class="flex items-center gap-12 shrink-0">
            <img src="/logos/docker.svg" alt="Docker" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/python.svg" alt="Python" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/pytorch.svg" alt="PyTorch" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/ollama.svg" alt="Ollama" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/langchain.svg" alt="LangChain" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/nextjs.svg" alt="Next.js" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
        </div>
        <!-- 第二组（重复，实现无缝） -->
        <div class="flex items-center gap-12 shrink-0">
            <img src="/logos/docker.svg" alt="Docker" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/python.svg" alt="Python" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/pytorch.svg" alt="PyTorch" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/ollama.svg" alt="Ollama" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/langchain.svg" alt="LangChain" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/logos/nextjs.svg" alt="Next.js" class="h-8 opacity-50 hover:opacity-100 transition-opacity">
        </div>
    </div>
</div>
```

**React 组件封装**：

```tsx
// components/LogoMarquee.tsx
'use client';
import { useState, ReactNode } from 'react';

interface LogoMarqueeProps {
    children: ReactNode;
    duration?: number;
}

export function LogoMarquee({ children, duration = 30 }: LogoMarqueeProps) {
    const [paused, setPaused] = useState(false);

    return (
        <div
            className="marquee-container py-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div
                className="marquee-track"
                style={{
                    animationDuration: `${duration}s`,
                    animationPlayState: paused ? 'paused' : 'running',
                }}
            >
                <div className="flex items-center gap-12 shrink-0">{children}</div>
                <div className="flex items-center gap-12 shrink-0">{children}</div>
            </div>
        </div>
    );
}
```

**关键细节**：
- `translateX(-50%)` + 内容重复一次 → 无缝循环的核心
- `mask-image` 边缘淡出 → 避免内容硬切，视觉更优雅
- Logo 用 SVG 格式 + `opacity` 控制 → 灰色未激活态，hover 高亮

**适用场景**：技术栈展示、合作伙伴展示、客户评价滚动、标签云

---

### 场景 N：极光背景（Aurora / Northern Lights）

**视觉效果**：页面背景有柔和的彩色光带缓慢飘动，如同北极光

**技术组合**：多个大面积 div + filter:blur + 渐变色 + 慢速位移/旋转动画

**流行度**：Vercel、shadcn/ui、Tailwind UI 等现代设计系统广泛使用

```css
@keyframes aurora-1 {
    0% { transform: translate(0, 0) rotate(0deg) scale(1); }
    33% { transform: translate(30px, -20px) rotate(5deg) scale(1.05); }
    66% { transform: translate(-20px, 10px) rotate(-3deg) scale(0.97); }
    100% { transform: translate(0, 0) rotate(0deg) scale(1); }
}

@keyframes aurora-2 {
    0% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(-40px, 20px) rotate(-5deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes aurora-3 {
    0% { transform: translate(0, 0) scale(1); }
    40% { transform: translate(20px, -30px) scale(1.1); }
    80% { transform: translate(-10px, 15px) scale(0.95); }
    100% { transform: translate(0, 0) scale(1); }
}

.aurora-bg {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: -1;
    background: #030712; /* gray-950 */
}

.aurora-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    mix-blend-mode: screen;
}

.aurora-blob--1 {
    width: 600px;
    height: 300px;
    background: linear-gradient(135deg, #00ffaa, #10b981);
    top: -10%;
    left: 20%;
    animation: aurora-1 15s ease-in-out infinite;
}

.aurora-blob--2 {
    width: 500px;
    height: 400px;
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    top: 30%;
    right: 10%;
    animation: aurora-2 18s ease-in-out infinite;
    animation-delay: -5s;
}

.aurora-blob--3 {
    width: 700px;
    height: 250px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    bottom: 10%;
    left: 10%;
    animation: aurora-3 20s ease-in-out infinite;
    animation-delay: -10s;
}
```

```html
<!-- 极光背景层 -->
<div class="aurora-bg">
    <div class="aurora-blob aurora-blob--1"></div>
    <div class="aurora-blob aurora-blob--2"></div>
    <div class="aurora-blob aurora-blob--3"></div>
</div>

<!-- 前景内容 -->
<main class="relative z-10">
    <section class="min-h-screen flex items-center justify-center">
        <h1 class="text-5xl font-bold text-white">Your Content Here</h1>
    </section>
</main>
```

**性能优化版（降低 GPU 负载）**：

```css
/* 使用 opacity 动画替代 transform，减少合成层数量 */
@keyframes aurora-breathe {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.4; }
}

/* 减少 blur 值 */
.aurora-blob--light {
    filter: blur(60px);
    animation: aurora-breathe 8s ease-in-out infinite;
}
```

**Tailwind 版本**：

```html
<div class="fixed inset-0 -z-10 bg-gray-950 overflow-hidden">
    <div class="absolute -top-[10%] left-[20%] w-[600px] h-[300px] rounded-full
                bg-gradient-to-br from-emerald-400 to-teal-600
                blur-[80px] opacity-30 mix-blend-screen
                animate-[aurora-1_15s_ease-in-out_infinite]"></div>
    <div class="absolute top-[30%] right-[10%] w-[500px] h-[400px] rounded-full
                bg-gradient-to-br from-cyan-400 to-blue-600
                blur-[80px] opacity-30 mix-blend-screen
                animate-[aurora-2_18s_ease-in-out_infinite] [animation-delay:-5s]"></div>
    <div class="absolute bottom-[10%] left-[10%] w-[700px] h-[250px] rounded-full
                bg-gradient-to-br from-violet-500 to-pink-500
                blur-[80px] opacity-25 mix-blend-screen
                animate-[aurora-3_20s_ease-in-out_infinite] [animation-delay:-10s]"></div>
</div>
```

**与场景 I（Morphing 斑点）的区别**：
- 极光用椭圆形、更大面积、更低 opacity、带 `mix-blend-mode: screen`
- Morphing 斑点用不规则形状（border-radius 变化），面积较小
- 极光色彩更丰富（3-4 色），适合全屏背景；斑点适合局部装饰

**适用场景**：首页 Hero、登录/注册页、应用启动画面、404 页面

---

### 场景 O：文字逐字拆分入场（Split Text Reveal）

**视觉效果**：标题文字被拆分为单个字符，每个字符依次从下方/模糊状态入场

**技术组合**：轻量 JS 拆分字符 + CSS animation-delay 递增 + fade-in-up 变体

**流行度**：高端品牌官网、创意工作室、产品发布页的标配 Hero 效果

```css
@keyframes char-reveal {
    0% {
        opacity: 0;
        transform: translateY(40px) rotateX(-10deg);
        filter: blur(4px);
    }
    100% {
        opacity: 1;
        transform: translateY(0) rotateX(0deg);
        filter: blur(0);
    }
}

.split-text .char {
    display: inline-block;
    opacity: 0;
    animation: char-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 空格保留 */
.split-text .char--space {
    width: 0.3em;
}

/* 变体：从顶部落下 */
@keyframes char-drop {
    0% {
        opacity: 0;
        transform: translateY(-30px) scale(0.8);
    }
    60% {
        transform: translateY(5px) scale(1.02);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.split-text--drop .char {
    animation-name: char-drop;
    animation-duration: 0.7s;
    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性 */
}

/* 变体：水平滑入 */
@keyframes char-slide {
    0% {
        opacity: 0;
        transform: translateX(-20px);
    }
    100% {
        opacity: 1;
        transform: translateX(0);
    }
}

.split-text--slide .char {
    animation-name: char-slide;
}
```

```js
// 文字拆分函数（轻量，无依赖）
function splitText(element, delayPerChar = 0.04) {
    const text = element.textContent;
    element.textContent = '';
    element.classList.add('split-text');
    
    let charIndex = 0;
    for (const char of text) {
        const span = document.createElement('span');
        if (char === ' ') {
            span.className = 'char char--space';
            span.innerHTML = '&nbsp;';
        } else {
            span.className = 'char';
            span.textContent = char;
        }
        span.style.animationDelay = `${charIndex * delayPerChar}s`;
        element.appendChild(span);
        charIndex++;
    }
}

// 使用
document.querySelectorAll('[data-split-text]').forEach(el => {
    splitText(el, parseFloat(el.dataset.splitDelay || '0.04'));
});
```

```html
<!-- 基础用法 -->
<h1 data-split-text data-split-delay="0.03" class="text-5xl font-bold text-white">
    Welcome to AI Course
</h1>

<!-- 配合 Intersection Observer（滚动到时才触发） -->
<h2 data-split-text data-split-trigger="scroll" class="text-3xl font-semibold text-white">
    Build Something Amazing
</h2>
```

```js
// 结合滚动触发
function initScrollSplitText() {
    const elements = document.querySelectorAll('[data-split-trigger="scroll"]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                splitText(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    elements.forEach(el => observer.observe(el));
}
```

**React 组件封装**：

```tsx
// components/SplitText.tsx
'use client';
import { useMemo } from 'react';

interface SplitTextProps {
    text: string;
    as?: keyof JSX.IntrinsicElements;
    delay?: number;
    variant?: 'default' | 'drop' | 'slide';
    className?: string;
}

export function SplitText({
    text,
    as: Tag = 'h1',
    delay = 0.04,
    variant = 'default',
    className = '',
}: SplitTextProps) {
    const chars = useMemo(() => [...text], [text]);
    const variantClass = variant !== 'default' ? `split-text--${variant}` : '';

    return (
        <Tag className={`split-text ${variantClass} ${className}`}>
            {chars.map((char, i) => (
                <span
                    key={i}
                    className={`char ${char === ' ' ? 'char--space' : ''}`}
                    style={{ animationDelay: `${i * delay}s` }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </Tag>
    );
}
```

**使用方式**：

```tsx
<SplitText text="Welcome to AI Course" className="text-5xl font-bold text-white" />
<SplitText text="Build Something Amazing" as="h2" variant="drop" delay={0.05} />
```

**适用场景**：Hero 大标题、章节标题、品牌名称展示、"Coming Soon" 页面

---

### 场景 P：磁吸按钮（Magnetic Button）

**视觉效果**：鼠标靠近按钮时，按钮微微向光标方向偏移，产生"被吸引"的物理感

**技术组合**：transform: translate + CSS 自定义属性（坐标）+ 微量 JS

**流行度**：Awwwards 获奖网站高频出现，Apple 官网部分交互也有类似效果

```css
.magnetic-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #00ffaa, #10b981);
    color: #030712;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1),
                box-shadow 0.3s ease;
    transform: translate(
        calc(var(--magnet-x, 0) * 1px),
        calc(var(--magnet-y, 0) * 1px)
    );
}

.magnetic-btn:hover {
    box-shadow: 0 10px 40px rgba(0, 255, 170, 0.3),
                0 0 20px rgba(0, 255, 170, 0.2);
}

/* 按钮内文字可做更大偏移（视差层） */
.magnetic-btn__text {
    display: inline-block;
    transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    transform: translate(
        calc(var(--magnet-x, 0) * 0.5px),
        calc(var(--magnet-y, 0) * 0.5px)
    );
}
```

```js
// 磁吸效果核心逻辑
class MagneticButton {
    constructor(element, options = {}) {
        this.el = element;
        this.strength = options.strength || 25;  // 吸引强度（像素）
        this.textStrength = options.textStrength || 15;
        this.threshold = options.threshold || 100; // 触发距离
        
        this.bound = {
            onMove: this.onMouseMove.bind(this),
            onLeave: this.onMouseLeave.bind(this)
        };
        
        this.el.addEventListener('mousemove', this.bound.onMove);
        this.el.addEventListener('mouseleave', this.bound.onLeave);
    }
    
    onMouseMove(e) {
        const rect = this.el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        
        // 计算偏移（映射到 -strength ~ +strength）
        const moveX = (deltaX / (rect.width / 2)) * this.strength;
        const moveY = (deltaY / (rect.height / 2)) * this.strength;
        
        this.el.style.setProperty('--magnet-x', moveX);
        this.el.style.setProperty('--magnet-y', moveY);
    }
    
    onMouseLeave() {
        this.el.style.setProperty('--magnet-x', 0);
        this.el.style.setProperty('--magnet-y', 0);
    }
    
    destroy() {
        this.el.removeEventListener('mousemove', this.bound.onMove);
        this.el.removeEventListener('mouseleave', this.bound.onLeave);
    }
}

// 初始化所有磁吸按钮
document.querySelectorAll('.magnetic-btn').forEach(btn => {
    new MagneticButton(btn);
});
```

```html
<button class="magnetic-btn">
    <span class="magnetic-btn__text">开始学习 →</span>
</button>

<!-- 变体：幽灵按钮 -->
<button class="magnetic-btn" style="background: transparent; border: 1px solid #00ffaa; color: #00ffaa;">
    <span class="magnetic-btn__text">查看文档</span>
</button>
```

**纯 CSS 方案（简化版，无 JS）**：

```css
/* 利用 hover 区域 + 子元素的4个象限检测 */
.magnetic-btn-css {
    position: relative;
    padding: 16px 32px;
    transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.magnetic-btn-css:hover {
    transform: scale(1.05);
}

/* 简化效果：hover 时轻微上浮 + 发光 */
.magnetic-btn-css:active {
    transform: scale(0.97);
    transition-duration: 0.1s;
}
```

**适用场景**：CTA 主按钮、导航菜单项、社交媒体图标

---

### 场景 Q：骨架屏 Shimmer 加载（Skeleton Loading）

**视觉效果**：内容加载前显示灰色占位块，一道光线从左到右反复扫过

**技术组合**：Shimmer 动画（已有基础）+ 形状占位（圆/矩形）+ 延时消失

**流行度**：Facebook、YouTube、LinkedIn、GitHub 等所有主流平台标配

```css
@keyframes skeleton-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.skeleton {
    background-color: #1f2937; /* gray-800 */
    background-image: linear-gradient(
        90deg,
        #1f2937 0%,
        #374151 40%,
        #1f2937 80%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
}

/* 形状变体 */
.skeleton--text {
    height: 16px;
    margin-bottom: 8px;
}

.skeleton--title {
    height: 24px;
    width: 60%;
    margin-bottom: 12px;
}

.skeleton--avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
}

.skeleton--image {
    width: 100%;
    height: 200px;
    border-radius: 8px;
}

.skeleton--button {
    width: 120px;
    height: 40px;
    border-radius: 6px;
}

/* 深色主题优化 */
.dark .skeleton {
    background-color: #111827;
    background-image: linear-gradient(
        90deg,
        #111827 0%,
        #1f2937 40%,
        #111827 80%
    );
}
```

```html
<!-- 卡片骨架屏 -->
<div class="bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-800">
    <div class="flex items-center gap-3">
        <div class="skeleton skeleton--avatar"></div>
        <div class="flex-1">
            <div class="skeleton skeleton--title"></div>
            <div class="skeleton skeleton--text w-[80%]"></div>
        </div>
    </div>
    <div class="skeleton skeleton--image"></div>
    <div class="space-y-2">
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text w-[90%]"></div>
        <div class="skeleton skeleton--text w-[70%]"></div>
    </div>
    <div class="skeleton skeleton--button"></div>
</div>

<!-- 列表骨架屏（React JSX 写法见下方组件） -->
<div class="space-y-4">
    <!-- 重复 5 次 -->
    <div class="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
        <div class="skeleton skeleton--avatar"></div>
        <div class="flex-1 space-y-2">
            <div class="skeleton skeleton--text w-[40%]"></div>
            <div class="skeleton skeleton--text w-[70%]"></div>
        </div>
    </div>
    <!-- ... 重复4次 -->
</div>
```

**Tailwind 纯类实现（无自定义 CSS）**：

```html
<div class="animate-pulse space-y-4">
    <div class="h-6 bg-gray-800 rounded w-3/4"></div>
    <div class="h-4 bg-gray-800 rounded w-full"></div>
    <div class="h-4 bg-gray-800 rounded w-5/6"></div>
    <div class="h-48 bg-gray-800 rounded-lg"></div>
</div>
```

> 注：Tailwind 内置的 `animate-pulse` 是 opacity 脉冲，视觉效果弱于自定义 shimmer。推荐用自定义版本。

**React 组件（通用骨架屏）**：

```tsx
// components/Skeleton.tsx
interface SkeletonProps {
    width?: string;
    height?: string;
    shape?: 'text' | 'avatar' | 'image' | 'button';
    className?: string;
}

export function Skeleton({ width = '100%', height = '16px', shape = 'text', className = '' }: SkeletonProps) {
    const style = {
        width,
        height: shape === 'avatar' ? width : height,
    };

    return <div className={`skeleton skeleton--${shape} ${className}`} style={style} />;
}

// 卡片骨架屏预设
export function SkeletonCard() {
    return (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-800">
            <div className="flex items-center gap-3">
                <Skeleton shape="avatar" width="48px" />
                <div className="flex-1 space-y-2">
                    <Skeleton shape="text" width="60%" height="20px" />
                    <Skeleton shape="text" width="80%" />
                </div>
            </div>
            <Skeleton shape="image" height="200px" />
            <div className="space-y-2">
                <Skeleton />
                <Skeleton width="90%" />
                <Skeleton width="70%" />
            </div>
        </div>
    );
}
```

**适用场景**：任何异步加载内容、API 数据列表、图片瀑布流、仪表盘组件

---

### 场景 R：Noise 噪点纹理叠加（Film Grain）

**视觉效果**：页面/卡片上叠加一层微弱的噪点纹理，增加质感和深度

**技术组合**：SVG `feTurbulence` 滤镜 + CSS 混合模式 + 可选动画

**流行度**：Awwwards 获奖站点高频使用，为扁平设计增加有机质感

```css
/* 方案一：SVG 滤镜（推荐，性能好） */
.noise-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
    opacity: 0.03;  /* 非常微弱，只增加质感 */
    mix-blend-mode: overlay;
}

/* 方案二：CSS 动画噪点（有轻微闪烁） */
@keyframes grain-shift {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-2%, -3%); }
    20% { transform: translate(3%, 1%); }
    30% { transform: translate(-1%, 3%); }
    40% { transform: translate(2%, -2%); }
    50% { transform: translate(-3%, 1%); }
    60% { transform: translate(1%, -1%); }
    70% { transform: translate(-2%, 3%); }
    80% { transform: translate(3%, -3%); }
    90% { transform: translate(-1%, 2%); }
}

.noise-animated {
    position: fixed;
    inset: -20%; /* 放大避免边缘露出 */
    z-index: 9998;
    pointer-events: none;
    opacity: 0.04;
    mix-blend-mode: overlay;
    animation: grain-shift 0.5s steps(10) infinite;
}
```

```html
<!-- 方案一：SVG 内联滤镜 -->
<svg class="noise-overlay" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise-filter">
        <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.7" 
            numOctaves="4" 
            stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#noise-filter)"/>
</svg>

<!-- 方案二：带动画（更有电影质感） -->
<svg class="noise-animated" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise-filter-animated">
        <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.8" 
            numOctaves="3" 
            seed="1"
            stitchTiles="stitch"
        />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise-filter-animated)"/>
</svg>
```

**参数说明**：
- `baseFrequency`: 0.5-1.0 细密，0.1-0.3 粗犷
- `numOctaves`: 层数，越高越细腻（但性能开销也越大），推荐 3-4
- `opacity`: 0.02-0.05 微妙质感，0.08-0.15 明显纹理
- `mix-blend-mode`: `overlay` 最自然，`soft-light` 更柔和

**仅对特定元素加噪点**：

```css
.card-with-noise {
    position: relative;
}

.card-with-noise::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.04;
    mix-blend-mode: overlay;
    pointer-events: none;
}
```

**适用场景**：全局背景质感、Hero 区域、渐变背景叠加、摄影/艺术类网站

---

### 场景 S：纯 CSS 视差滚动（Parallax）

**视觉效果**：滚动时背景层和前景层以不同速度移动，产生深度感

**技术组合**：CSS `perspective` + `translateZ` + `overflow-y: auto`（纯 CSS，无 JS）

**原理**：容器设置 perspective 后，子元素通过 translateZ 控制"远近"，近处元素滚动快、远处慢

```css
/* 视差容器 */
.parallax-container {
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
    perspective: 1px;           /* 关键属性 */
    perspective-origin: center center;
}

/* 视差分组 */
.parallax-group {
    position: relative;
    height: 100vh;
    transform-style: preserve-3d;
}

/* 背景层（慢速） */
.parallax-bg {
    position: absolute;
    inset: 0;
    transform: translateZ(-2px) scale(3);  /* 远处 + 放大补偿 */
    z-index: -1;
}

/* 中间层 */
.parallax-mid {
    position: absolute;
    inset: 0;
    transform: translateZ(-1px) scale(2);
    z-index: 0;
}

/* 前景层（正常速度） */
.parallax-fg {
    position: relative;
    transform: translateZ(0);
    z-index: 1;
}
```

```html
<div class="parallax-container">
    <!-- 第一屏 -->
    <section class="parallax-group">
        <!-- 背景：星星/图案（移动慢） -->
        <div class="parallax-bg">
            <div class="w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,170,0.05),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        </div>
        <!-- 前景：内容（正常速度） -->
        <div class="parallax-fg flex items-center justify-center h-full">
            <div class="text-center">
                <h1 class="text-5xl font-bold text-white mb-4">视差滚动示例</h1>
                <p class="text-gray-400">往下滚动，观察背景和前景的速度差</p>
            </div>
        </div>
    </section>
    
    <!-- 第二屏 -->
    <section class="parallax-group">
        <div class="parallax-bg">
            <img src="/images/bg-pattern.svg" alt="" class="w-full h-full object-cover opacity-10">
        </div>
        <div class="parallax-fg flex items-center justify-center h-full">
            <div class="max-w-2xl text-center">
                <h2 class="text-3xl font-bold text-white mb-6">层次感 = 高级感</h2>
                <p class="text-gray-400">不需要 JS 库，纯 CSS 实现的视差效果</p>
            </div>
        </div>
    </section>
    
    <!-- 更多章节... -->
</div>
```

**简化版：background-attachment（兼容性更好）**：

```css
/* 更简单但效果有限 */
.parallax-simple {
    background-image: url('/images/hero-bg.jpg');
    background-attachment: fixed;
    background-size: cover;
    background-position: center;
    min-height: 60vh;
}
```

> 注意：`background-attachment: fixed` 在 iOS Safari 上不支持。translateZ 方案兼容性更好。

**参数调整**：
- `perspective: 1px` → 值越小，视差效果越强
- `translateZ(-2px) scale(3)` → Z 值越负，移动越慢；scale 需要补偿缩小
- scale 公式：`scale = 1 + (|translateZ| / perspective)`

**适用场景**：产品官网首页、作品集、故事叙述型页面、教程引导页

---

### 场景 T：Clip-path 遮罩揭示动画

**视觉效果**：内容通过几何形状（圆形扩展、对角线划过等）被逐渐"揭开"

**技术组合**：CSS `clip-path` + `transition` 或 `@keyframes`

**流行度**：页面切换、图片展示、悬停效果中的高级手法

```css
/* 圆形扩展揭示 */
@keyframes circle-reveal {
    from { clip-path: circle(0% at 50% 50%); }
    to { clip-path: circle(75% at 50% 50%); }
}

.reveal-circle {
    clip-path: circle(0% at 50% 50%);
    animation: circle-reveal 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 从左到右划开 */
@keyframes wipe-right {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
}

.reveal-wipe-right {
    clip-path: inset(0 100% 0 0);
    animation: wipe-right 0.8s ease-out forwards;
}

/* 对角线揭示 */
@keyframes diagonal-reveal {
    from { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
    to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}

.reveal-diagonal {
    clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
    animation: diagonal-reveal 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

/* 菱形展开 */
@keyframes diamond-reveal {
    from { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
    to { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
}

.reveal-diamond {
    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%);
    animation: diamond-reveal 0.6s ease-out forwards;
}

/* Hover 触发版本 */
.hover-reveal {
    clip-path: circle(0% at 50% 50%);
    transition: clip-path 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.group:hover .hover-reveal {
    clip-path: circle(75% at 50% 50%);
}
```

```html
<!-- 图片揭示效果 -->
<div class="relative overflow-hidden rounded-xl">
    <img src="/images/hero.jpg" alt="Hero" 
         class="reveal-circle w-full h-[400px] object-cover"
         style="animation-delay: 0.3s">
</div>

<!-- 悬停图片揭示 -->
<div class="group relative w-80 h-80 cursor-pointer overflow-hidden rounded-xl">
    <!-- 底层：原始图片（灰度） -->
    <img src="/images/project.jpg" class="w-full h-full object-cover grayscale">
    <!-- 顶层：彩色版本（揭示） -->
    <img src="/images/project.jpg" 
         class="hover-reveal absolute inset-0 w-full h-full object-cover">
    <!-- 文字 -->
    <div class="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 class="font-semibold">项目名称</h3>
        <p class="text-sm text-gray-300">RAGFlow 部署实战</p>
    </div>
</div>

<!-- 区块对角线揭示（配合滚动触发） -->
<section class="reveal-diagonal" data-scroll-reveal>
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 p-12 rounded-xl">
        <h2 class="text-3xl font-bold text-white">功能特性</h2>
        <p class="text-gray-400 mt-4">这段内容通过对角线方式揭示</p>
    </div>
</section>
```

**多形状切换（高级用法）**：

```css
/* 多边形变形过渡 */
.shape-morph {
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); /* 菱形 */
    transition: clip-path 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.shape-morph:hover {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); /* 变为矩形 */
}
```

**适用场景**：图片画廊悬停、页面切换过渡、章节入场、作品集展示、Before/After 对比

---

## 场景适配速查表（完整版）

| 页面类型 | 推荐场景组合 |
|---------|-------------|
| 产品首页 Hero | 极光背景(N) + 文字拆分入场(O) + 渐变流动文字(C) + Logo 墙(M) |
| 功能特性展示 | 鼠标聚光灯(K) + 3D 翻转(F) + Clip-path 揭示(T) |
| 教程/文档站 | 打字机(G) + 时间轴(J) + 骨架屏(Q) + 阅读进度条 |
| 数据看板 | 环形进度(D) + 数字计数器(L) + 脉冲发光 + 数据流拓扑(H) |
| 品牌/About | 视差滚动(S) + 文字拆分(O) + 噪点纹理(R) + 星空背景(A) |
| 博客/文章 | 波浪分隔线(E) + 滚动淡入 + 进度条 + 骨架屏(Q) |
| 落地页/活动 | 极光(N) + 霓虹文字(B) + 磁吸按钮(P) + Logo 墙(M) |
| 作品集/画廊 | Clip-path 揭示(T) + 视差(S) + 3D 翻转(F) + 噪点(R) |
| SaaS 定价页 | Logo 墙(M) + 磁吸按钮(P) + 数字计数器(L) + 悬停卡片 |
| AI/技术产品 | 数据流拓扑(H) + 打字机(G) + 极光(N) + 粒子星空(A) |

---

## 性能注意事项（第二辑）

| 场景 | 性能影响 | 优化建议 |
|------|----------|----------|
| 无限 Marquee(M) | 低 | 仅 translateX，GPU 友好。内容别太多（避免 DOM 过重） |
| 极光背景(N) | 中-高 | `filter: blur(80px)` 开销大。blob 数量 ≤ 3，移动端考虑降低 blur 或禁用 |
| 文字拆分(O) | 低 | 大量 span 可能影响 DOM 性能，长文本控制在 50 字符内 |
| 磁吸按钮(P) | 极低 | 仅 CSS transform，mousemove 事件用 rAF 节流 |
| 骨架屏(Q) | 低 | 与 Shimmer 相同原理，background-position 动画 |
| 噪点纹理(R) | 低-中 | SVG filter 由 GPU 渲染。固定大小 rect 性能好于百分比 |
| 视差滚动(S) | 低 | 纯 CSS perspective 方案不触发 JS，性能极优 |
| Clip-path 揭示(T) | 低 | clip-path 由合成层处理，不触发重排 |

**总体建议**：
1. 移动端禁用或简化极光背景 — 使用 `@media (max-width: 768px)` 降级为静态渐变
2. `prefers-reduced-motion` 媒体查询始终保留 — 所有新增场景都应尊重此设置
3. 页面中同时运行的持续动画控制在 5-8 个以内 — 过多会导致 GPU 内存压力
4. 测试工具：Chrome DevTools → Performance → 录制滚动，确保帧率 ≥ 55fps

```css
/* 移动端降级示例 */
@media (max-width: 768px) {
    .aurora-blob { display: none; }
    .aurora-bg { background: linear-gradient(135deg, #030712, #0a1628); }
    
    .noise-overlay { display: none; }
    
    .parallax-bg { transform: none !important; }
    .parallax-container { perspective: none; }
}

/* 尊重用户动画偏好 */
@media (prefers-reduced-motion: reduce) {
    .marquee-track { animation: none; }
    .aurora-blob { animation: none; }
    .split-text .char { animation: none; opacity: 1; }
    .reveal-circle, .reveal-wipe-right, .reveal-diagonal {
        clip-path: none;
        animation: none;
    }
}
```
