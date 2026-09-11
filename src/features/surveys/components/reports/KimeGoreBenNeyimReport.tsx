import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { KimeGoreBenNeyimResultRenderer } from '../renderers/KimeGoreBenNeyimResultRenderer';

interface Props {
  application: SurveyApplicationDto;
}

export const KimeGoreBenNeyimReport: React.FC<Props> = ({ application }) => {
  return (
    <div className="max-w-5xl mx-auto py-4">
      <KimeGoreBenNeyimResultRenderer application={application} />
    </div>
  );
};
