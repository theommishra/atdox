type FeatureProps = {
  title: string;
  description: string;
};

const FeatureCard = ({ title, description }: FeatureProps) => (
  <div className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-md transition">
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default FeatureCard;
