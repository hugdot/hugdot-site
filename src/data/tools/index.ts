// src/data/tools/index.ts

import { textTools } from './text';
import { imageTools } from './image';
import { pdfTools } from './pdf';
import { generatorTools } from './generator';
import { calculatorTools } from './calculator';
import { snsTools } from './sns';

export type ToolCategory = 'text' | 'image' | 'pdf' | 'generator' | 'file' | 'sns' | 'calculator';

export interface Tool {
  id: string;
  category: ToolCategory;
  slug: string;
  icon: string;
  available: boolean;
  label: string;
}

// 모든 도구를 하나의 배열로 합체
export const tools: Tool[] = [
  ...textTools,
  ...imageTools,
  ...pdfTools,
  ...generatorTools,
  ...calculatorTools,
  ...snsTools,
];

// 헬퍼 함수들 (기존 로직 유지)
export const getToolById = (id: string) => tools.find((t) => t.id === id);
export const getToolsByCategory = (category: ToolCategory) =>
  tools.filter((t) => t.category === category && t.available);
export const availableTools = tools.filter((t) => t.available);
export const getToolHref = (category: ToolCategory, slug: string): string => {
  return `/tools/${category}/${slug}`;
};