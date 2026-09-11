import React from 'react';
import { Network, Info } from 'lucide-react';
import {
  HollandHexagonNodeHighlight,
  HOLLAND_HEXAGON_DESCRIPTION_TEXT,
  generateHollandHexagonSvg
} from '../../../../../shared/hollandHexagonSvg';

export interface HollandTypeHexagonProps {
  highlights?: Record<string, HollandHexagonNodeHighlight>;
  width?: number;
  height?: number;
  showCardWrapper?: boolean;
  className?: string;
}

export const HollandTypeHexagon: React.FC<HollandTypeHexagonProps> = ({
  highlights = {},
  width = 320,
  height = 265,
  showCardWrapper = true,
  className = ''
}) => {
  const svgMarkup = generateHollandHexagonSvg({
    width,
    height,
    highlights
  });

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="w-full flex items-center justify-center overflow-hidden py-1"
        dangerouslySetInnerHTML={{ __html: svgMarkup }} 
      />
      <div className="flex items-start gap-1.5 mt-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] text-slate-500 leading-tight">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>{HOLLAND_HEXAGON_DESCRIPTION_TEXT}</span>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shadow-2xs">
            <Network className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Holland Kişilik Tipleri İlişki Haritası
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Altı Holland kişilik tipinin birbirleriyle olan ilişkilerini gösteren kaynak temelli şema.
            </p>
          </div>
        </div>
      </div>
      {content}
    </div>
  );
};
