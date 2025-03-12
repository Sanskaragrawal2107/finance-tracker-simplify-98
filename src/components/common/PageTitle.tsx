
import React from 'react';

export interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
};

export default PageTitle;
