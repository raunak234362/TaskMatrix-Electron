const InfoRow = ({ label, value, href }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-black/5 last:border-0">
    <span className="text-black font-bold uppercase text-xs tracking-wider">{label}</span>
    {href ? (
      <a href={href} className="text-black text-sm font-bold hover:underline">
        {value}
      </a>
    ) : (
      <span className="text-black text-sm font-bold">{value}</span>
    )}
  </div>
);

export default InfoRow;
