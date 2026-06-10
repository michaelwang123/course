# Web 3D 技术方案指南

本文档总结了可用于 Web 页面的 3D 效果技术方案，帮助你根据项目需求选择合适的实现方式。

## 纯 CSS 3D

利用 CSS 原生的 3D 变换能力，无需任何第三方库。

**核心属性：**
- `transform: rotateX() / rotateY() / rotateZ()`
- `perspective`
- `transform-style: preserve-3d`

**适用场景：**
- 卡片翻转效果
- 3D 轮播
- 立方体导航
- 视差滚动效果

**优点：** 零依赖、性能好、适合轻量交互

---

## Three.js（WebGL）

最主流的 Web 3D 库，功能全面。

**官网：** https://threejs.org/

**核心能力：**
- 3D 场景搭建（Scene、Camera、Light、Renderer）
- 几何体创建（立方体、球体、自定义几何体）
- 材质与纹理（PBR 材质、环境贴图）
- 动画循环（requestAnimationFrame）
- 模型加载（GLTF / GLB 格式）
- 粒子系统
- 后处理效果（Bloom、SSAO）
- 交互（Raycaster 点击、OrbitControls）

**安装：**
```bash
npm install three
```

**基础示例：**
```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

---

## React Three Fiber (R3F)

Three.js 的 React 声明式封装，适合 React 项目。

**核心包：**
| 包名 | 用途 |
|------|------|
| `@react-three/fiber` | 核心渲染 |
| `@react-three/drei` | 常用工具（OrbitControls、Text3D、Environment 等） |
| `@react-three/postprocessing` | 后处理效果 |

**安装：**
```bash
npm install @react-three/fiber @react-three/drei three
```

**基础示例：**
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function RotatingBox() {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <RotatingBox />
      <OrbitControls />
    </Canvas>
  );
}
```

---

## 其他 3D 库对比

| 库 | 适用场景 | 复杂度 |
|---|---|---|
| **Babylon.js** | 重量级 3D / 游戏引擎 | 高 |
| **A-Frame** | 声明式 WebVR / AR | 中 |
| **Spline（嵌入）** | 设计师友好的 3D 场景嵌入 | 低 |
| **Zdog** | 伪 3D 扁平风格插画 | 低 |
| **CSS + SVG** | 等距视角（isometric）图形 | 低 |
| **GSAP + ScrollTrigger** | 滚动驱动的 3D 动画 | 中 |
| **Lottie (3D 导出)** | After Effects 3D 动画导出到 Web | 低 |

---

## 方案选择建议

根据不同需求选择合适的技术：

| 需求 | 推荐方案 |
|------|----------|
| 轻量装饰性 3D 效果 | 纯 CSS 3D transform |
| 交互式 3D 演示/可视化 | Three.js |
| React 项目集成 3D | React Three Fiber |
| VR / AR 体验 | A-Frame 或 Babylon.js |
| 设计师主导的 3D 资产 | Spline 嵌入 |
| 滚动驱动动画 | GSAP + ScrollTrigger |
| 扁平风 3D 插画 | Zdog |

---

## 参考资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber/)
- [Babylon.js 官网](https://www.babylonjs.com/)
- [A-Frame 官网](https://aframe.io/)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Zdog](https://zzz.dog/)
- [Spline](https://spline.design/)
