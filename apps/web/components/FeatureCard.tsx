import React from 'react';
import FeatureIcon from './FeatureIcon';

type FeatureProps = {
  title: string;
  description: string;
  icon: string;
};

const FeatureCard = ({ title, description, icon }: FeatureProps) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-md transition">
    <div className="text-blue-600 dark:text-blue-400 mb-4">
      <FeatureIcon type={icon as 'editor' | 'collaboration' | 'structure'} />
    </div>
    <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

export default FeatureCard;
