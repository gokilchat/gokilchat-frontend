import React from "react";
import clsx from "clsx";

const SidebarSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-2xl bg-elevated/30 animate-pulse"
        >
          {/* Avatar Skeleton */}
          <div className="w-12 h-12 rounded-2xl bg-white/5 shrink-0" />
          
          {/* Text Skeleton */}
          <div className="flex-1 space-y-2 py-1">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-white/10 rounded-lg" />
              <div className="h-3 w-8 bg-white/5 rounded-lg" />
            </div>
            <div className="h-3 w-32 bg-white/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SidebarSkeleton;
