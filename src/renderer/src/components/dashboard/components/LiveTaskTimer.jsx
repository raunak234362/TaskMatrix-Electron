import { useLiveTimer } from '../hooks/useLiveTimer';
import { Timer } from 'lucide-react';

const LiveTaskTimer = ({ task, className = "" }) => {
    const { formattedTime, isActive } = useLiveTimer(task);

    if (!task) return null;

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} border ${isActive ? 'border-green-200' : 'border-amber-200'} transition-all duration-300 ${className}`}>
            <Timer className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
            <span className="text-md font-black font-mono tracking-tight uppercase">
                {formattedTime}
            </span>
        </div>
    );
};

export default LiveTaskTimer;
