import { FC } from 'react';

const LoadingSpinner: FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );
};

export default LoadingSpinner; 