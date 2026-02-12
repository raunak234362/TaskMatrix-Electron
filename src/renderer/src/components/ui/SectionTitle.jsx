const SectionTitle = ({ title, className = "" }) => (
  <div className={`flex items-center gap-3 mb-8 ${className}`}>
    <div className="w-1.5 h-6 bg-green-600 rounded-full" />
    <h2 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight uppercase">
      {title}
    </h2>
  </div>
);
export default SectionTitle;
