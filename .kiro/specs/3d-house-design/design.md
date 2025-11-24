# Design Document

## Overview

3D 住宅設計アプリケーションは、React Three Fiber を中核とした 3D レンダリングエンジンと、Zustand による状態管理を組み合わせたモダンな Web アプリケーションです。ユーザーは直感的なツールを使用して住宅の 3D モデルを作成・編集し、リアルタイムでビジュアライゼーションできます。

## Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│              Next.js App                │
├─────────────────────────────────────────┤
│  Pages/Components Layer                 │
│  ├── 3D Viewport (React Three Fiber)   │
│  ├── Tool Panels                       │
│  ├── Property Editors                  │
│  └── File Management UI                │
├─────────────────────────────────────────┤
│  Business Logic Layer                  │
│  ├── 3D Scene Manager                  │
│  ├── Geometry Operations               │
│  ├── Material System                   │
│  └── Export/Import Handlers            │
├─────────────────────────────────────────┤
│  State Management (Zustand)            │
│  ├── Scene State                       │
│  ├── Tool State                        │
│  ├── Camera State                      │
│  └── Project State                     │
├─────────────────────────────────────────┤
│  Storage Layer                         │
│  ├── Local Storage (Browser)           │
│  ├── IndexedDB (Large Projects)        │
│  └── File System API (Export)          │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **3D Rendering**: React Three Fiber + Three.js
- **State Management**: Zustand
- **UI Components**: Tailwind CSS + Headless UI
- **Storage**: Browser LocalStorage + IndexedDB
- **Build Tool**: Next.js built-in bundler

## Components and Interfaces

### Core Components

#### 1. 3DViewport Component

```typescript
interface ViewportProps {
  scene: SceneState;
  onObjectSelect: (object: Object3D) => void;
  onObjectModify: (
    object: Object3D,
    changes: Partial<ObjectProperties>
  ) => void;
}
```

#### 2. ToolPanel Component

```typescript
interface ToolPanelProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  toolSettings: ToolSettings;
}

type ToolType = "select" | "wall" | "door" | "window" | "room";
```

#### 3. PropertyEditor Component

```typescript
interface PropertyEditorProps {
  selectedObject: SceneObject | null;
  onPropertyChange: (property: string, value: any) => void;
}
```

### Data Interfaces

#### Scene Object Model

```typescript
interface SceneObject {
  id: string;
  type: "wall" | "door" | "window" | "room" | "furniture";
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  properties: ObjectProperties;
  material: MaterialProperties;
}

interface WallObject extends SceneObject {
  type: "wall";
  startPoint: Vector2;
  endPoint: Vector2;
  height: number;
  thickness: number;
  openings: Opening[];
}

interface Opening {
  id: string;
  type: "door" | "window";
  position: number; // position along wall (0-1)
  width: number;
  height: number;
  properties: OpeningProperties;
}
```

#### Material System

```typescript
interface MaterialProperties {
  id: string;
  name: string;
  diffuseMap?: string;
  normalMap?: string;
  roughness: number;
  metalness: number;
  color: string;
}
```

## Data Models

### State Management Structure

#### Scene Store (Zustand)

```typescript
interface SceneStore {
  // Scene data
  objects: Map<string, SceneObject>;
  selectedObjects: string[];

  // Actions
  addObject: (object: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, changes: Partial<SceneObject>) => void;
  selectObjects: (ids: string[]) => void;

  // Scene operations
  clearScene: () => void;
  loadScene: (sceneData: SceneData) => void;
  exportScene: () => SceneData;
}
```

#### Tool Store

```typescript
interface ToolStore {
  activeTool: ToolType;
  toolSettings: Record<ToolType, ToolSettings>;

  setActiveTool: (tool: ToolType) => void;
  updateToolSettings: (tool: ToolType, settings: Partial<ToolSettings>) => void;
}
```

#### Camera Store

```typescript
interface CameraStore {
  position: Vector3;
  target: Vector3;

  setCamera: (position: Vector3, target: Vector3) => void;
  resetCamera: () => void;
}
```

### Persistence Model

```typescript
interface ProjectData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  sceneData: SceneData;
  thumbnail?: string;
}

interface SceneData {
  objects: SceneObject[];
  materials: MaterialProperties[];
  settings: SceneSettings;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  SCENE_LOAD_ERROR = "SCENE_LOAD_ERROR",
  EXPORT_ERROR = "EXPORT_ERROR",
  GEOMETRY_ERROR = "GEOMETRY_ERROR",
  MATERIAL_ERROR = "MATERIAL_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}
```

### Error Handling Strategy

1. **Graceful Degradation**: アプリケーションは部分的な機能失敗でも動作継続
2. **User Feedback**: エラー発生時は明確なメッセージとリカバリオプションを提供
3. **Logging**: 開発環境では詳細なエラーログ、本番環境では最小限の情報
4. **Retry Mechanisms**: ネットワークエラーや一時的な問題に対する自動リトライ

### Error Boundaries

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}
```

## Testing Strategy

### Unit Testing

- **Components**: React Testing Library + Jest
- **Business Logic**: Jest
- **3D Operations**: Three.js test utilities
- **State Management**: Zustand testing utilities

### Integration Testing

- **3D Scene Operations**: End-to-end 3D interaction testing
- **File Operations**: Save/Load functionality testing
- **Tool Integration**: Tool switching and property editing

### Performance Testing

- **3D Rendering Performance**: FPS monitoring and optimization
- **Memory Usage**: 3D object lifecycle and cleanup
- **Large Scene Handling**: Stress testing with complex models

### Testing Structure

```
tests/
├── unit/
│   ├── components/
│   ├── stores/
│   └── utils/
├── integration/
│   ├── 3d-operations/
│   ├── file-management/
│   └── tool-workflows/
└── performance/
    ├── rendering/
    └── memory/
```

### Key Testing Scenarios

1. **3D Object Creation**: Wall, door, window placement and modification
2. **Scene Navigation**: Camera controls and viewport interaction
3. **Project Management**: Save, load, export operations
4. **Material Application**: Texture and material property changes
5. **Error Recovery**: Invalid geometry handling and user error scenarios
