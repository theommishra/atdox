import React from 'react';
import FeatureIcon from './FeatureIcon';

type FeatureProps = {
  title: string;
  description: string;
  icon: string;
};

const FeatureCard = ({ title, description, icon }: FeatureProps) => (
  <div className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:-translate-y-1 h-full flex flex-col">
    {/* Background gradient on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        <FeatureIcon type={icon as 'editor' | 'collaboration' | 'structure'} />
      </div>
      
      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex-shrink-0">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 flex-grow">
        {description}
      </p>
    </div>
  </div>
);

export default FeatureCard;
