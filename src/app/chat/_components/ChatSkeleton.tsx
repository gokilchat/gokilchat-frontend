import clsx from "clsx";

export default function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header Skeleton */}
      <div className="h-16 px-6 flex items-center gap-4 bg-primary/50 border-b border-border-divider/50">
        <div className="w-10 h-10 rounded-full bg-elevated animate-pulse" />
        <div className="space-y-2">
          <div className="w-32 h-3 bg-elevated rounded-full animate-pulse" />
          <div className="w-20 h-2 bg-elevated rounded-full animate-pulse" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 p-6 space-y-10 overflow-hidden bg-[url('/images/chat-bg.png')] bg-fixed opacity-95">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className={clsx(
              "flex gap-4",
              i % 3 === 0 ? "flex-row-reverse" : "flex-row"
            )}
          >
            {i % 3 !== 0 && (
              <div className="w-10 h-10 rounded-full bg-elevated shrink-0 animate-pulse" />
            )}
            <div className={clsx(
              "flex flex-col gap-2",
              i % 3 === 0 ? "items-end" : "items-start"
            )}>
              <div 
                className={clsx(
                  "bg-elevated rounded-2xl animate-pulse",
                  i % 3 === 0 
                    ? (i % 2 === 0 ? "w-48 h-12 rounded-tr-sm" : "w-64 h-16 rounded-tr-sm")
                    : (i % 2 === 0 ? "w-72 h-14 rounded-tl-sm" : "w-40 h-12 rounded-tl-sm")
                )} 
              />
              <div className="w-16 h-2 bg-elevated/50 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
