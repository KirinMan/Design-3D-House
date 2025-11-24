# 3D House Design Application

A modern web-based 3D house design application built with Next.js, React Three Fiber, and TypeScript. Create, edit, and visualize house layouts with an intuitive interface and powerful 3D tools.

## Features

### 🏗️ 3D Design Tools

- **Wall Creation**: Click and drag to draw walls with adjustable height and thickness
- **Door & Window Placement**: Click on walls to add doors and windows with customizable dimensions
- **Object Selection**: Multi-select objects with Ctrl/Cmd + click
- **Real-time 3D Visualization**: Interactive 3D viewport with camera controls

### 🎨 Materials & Lighting

- **Material System**: Apply and customize materials with color, roughness, and metalness properties
- **Realistic Lighting**: Dynamic lighting with shadows and time-of-day simulation
- **Multiple Lighting Modes**: Basic, realistic, studio, and outdoor lighting presets

### 💾 Project Management

- **Save & Load**: Local storage-based project persistence
- **Auto-save**: Automatic saving with unsaved changes detection
- **Project Thumbnails**: Visual project previews

### 📤 Export Options

- **3D Model Export**: Export to OBJ and GLTF formats with materials
- **Screenshot Export**: High-quality PNG screenshots from multiple viewpoints
- **Batch Export**: Export all architectural views at once

### 📱 Responsive Design

- **Desktop Layout**: Full-featured interface with collapsible sidebars
- **Mobile Layout**: Touch-optimized interface with bottom navigation
- **Adaptive UI**: Automatically switches based on screen size

## Keyboard Shortcuts

### Tools

- `S` - Select tool
- `W` - Wall tool
- `D` - Door tool
- `N` - Window tool
- `R` - Room tool

### View Controls

- `Ctrl + R` - Reset camera view
- `Alt + F` - Toggle fullscreen viewport
- `Alt + 1` - Toggle left panel
- `Alt + 2` - Toggle right panel
- `Esc` - Exit fullscreen

### Project Management

- `Ctrl + S` - Quick save project
- `Ctrl + Shift + Delete` - Clear scene (with confirmation)

### Help

- `?` or `F1` - Show keyboard shortcuts help

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/Design-3D-House.git
cd Design-3D-House
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage Guide

### Creating Your First Design

1. **Start with Walls**: Select the Wall tool (W) and click-drag to draw walls
2. **Add Openings**: Use Door (D) or Window (N) tools to click on walls and add openings
3. **Customize Properties**: Select objects and use the Properties panel to adjust dimensions and materials
4. **Apply Materials**: Use the Materials panel to create and apply custom materials
5. **Adjust Lighting**: Use the Lighting panel to set time of day and lighting conditions
6. **Save Your Work**: Use Ctrl+S or the Projects button to save your design

### Navigation Controls

- **Rotate**: Click and drag to orbit around your model
- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Right-click and drag to pan the view
- **Reset**: Ctrl+R to return to default view

## Architecture

### Technology Stack

- **Frontend**: Next.js 14 with App Router
- **3D Rendering**: React Three Fiber + Three.js
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Storage**: Browser LocalStorage + IndexedDB

### Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── 3DViewport.tsx  # Main 3D rendering viewport
│   ├── MainLayout.tsx  # Desktop layout
│   ├── MobileLayout.tsx # Mobile layout
│   ├── ToolPanel.tsx   # Tool selection panel
│   └── ...
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for 3D rendering
- [Three.js](https://threejs.org/) for 3D graphics
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Tailwind CSS](https://tailwindcss.com/) for styling
