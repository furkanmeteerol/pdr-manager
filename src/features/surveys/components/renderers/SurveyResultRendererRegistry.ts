import React from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { GenericSurveyResultRenderer } from './GenericSurveyResultRenderer';
import { DevamsizlikNedenleriResultRenderer } from './DevamsizlikNedenleriResultRenderer';

export interface SurveyResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

/**
 * Registry mapping rendererType strings to dedicated Presentation Components.
 */
const RENDERER_REGISTRY: Record<string, React.FC<SurveyResultRendererProps>> = {
  'meb_devamsizlik': DevamsizlikNedenleriResultRenderer,
  'devamsizlik-nedenleri-anketi': DevamsizlikNedenleriResultRenderer,
  'generic': GenericSurveyResultRenderer
};

/**
 * Resolves the appropriate Result Renderer component based on the immutable
 * resultPresentation configuration stored in the application / snapshot.
 *
 * Scoring type alone DOES NOT dictate the UI presentation; the renderer
 * is strictly resolved from `resultPresentation.rendererType` with a safe generic fallback.
 */
export function getSurveyResultRenderer(
  rendererType?: string
): React.FC<SurveyResultRendererProps> {
  if (rendererType && RENDERER_REGISTRY[rendererType]) {
    return RENDERER_REGISTRY[rendererType];
  }
  return GenericSurveyResultRenderer;
}

/**
 * Allows registering additional custom survey renderers at runtime or module init.
 */
export function registerSurveyResultRenderer(
  rendererType: string,
  component: React.FC<SurveyResultRendererProps>
): void {
  RENDERER_REGISTRY[rendererType] = component;
}
