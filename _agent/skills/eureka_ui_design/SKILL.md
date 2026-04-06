---
name: eureka_ui_design
description: Apply the Eureka "Slim & Professional" UI/UX design system to any component.
---

# Eureka UI/UX Design System

Use this skill to apply the official EUREKA design principles to React/Tailwind components. This system focuses on high efficiency, professional density, and strict brand alignment.

## 1. Brand Identity (Color Palette)
- **Primary Navy**: `#0D2D5A` (Headers, main text, primary buttons)
- **Secondary Blue**: `#1A6CC8` (Highlights, icons, secondary touches, primary chart lines)
- **Accent Gold**: `#F5A623` (Awards, badges, status indicators, secondary chart lines)
- **Neutral Background**: `bg-white` (Page) or `bg-slate-50/50` (Section backgrounds)
- **Borders**: Thin `border-slate-100` or `border-slate-200`. Avoid heavy shadows.

## 2. Layout Principles (Slim & Full)
- **Max Width**: Use `w-full` for all main containers (no `max-w-6xl` or `mx-auto`).
- **Density**: Reduce paddings (`p-2` or `p-3`) and margins (`m-0` or `m-1`).
- **Gaps**: Use small gaps (`gap-2`, `gap-3`, or `space-y-4`).
- **Cards**: Use flat components with thin borders. Avoid heavy shadows.
- **Header**: Use slim headers (`pb-3`, `h-8` for buttons).
- **Sidebar**: Fixed width `w-72` (288px). Main content must use `ml-72` to avoid overlap.

## 3. Typography & Hierarchy
- **Font**: Use standard sans-serif (Inter/Roboto) with strict weight hierarchy.
- **Section Titles**: Use `font-black`, `uppercase`, and `text-[10px]` or `text-xs`.
- **Primary Data**: Use `font-black` and `tracking-tight`.
- **Secondary Data**: Use `font-bold` and `text-slate-400`.
- **Case**: Use `uppercase` for technical labels and status indicators.

## 4. Components & Content
- **Icons**: Use fine-stroked icons (Lucide-React) with brand colors.
- **Charts**: Use `LineChart` (Recharts) with `strokeWidth={3}` and no area fills.
- **Buttons**: Use flat brand colors (Navy/Blue/Gold) with minimal padding.
- **Status Badges**: Use small, high-contrast badges (e.g., Gold background for "Premium").

## 5. Implementation Checklist
- [ ] Container is `w-full`.
- [ ] Background is `bg-white`.
- [ ] No heavy shadows (`shadow-none`).
- [ ] Colors use `#0D2D5A`, `#1A6CC8`, or `#F5A623`.
- [ ] Logic/Actions occupy minimal vertical space.
