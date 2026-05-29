import clsx from "clsx";

// Static string literals so Tailwind CSS v4 static analyzer extracts them flawlessly 🗿🔥
const SKELETON_BUBBLE_CLASSES = {
  rightEven: "w-[35vw] md:w-48 h-10 md:h-12 rounded-tr-sm",
  rightOdd: "w-[58vw] md:w-64 h-14 md:h-16 rounded-tr-sm",
  leftEven: "w-[52vw] md:w-72 h-12 md:h-14 rounded-tl-sm",
  leftOdd: "w-[28vw] md:w-40 h-10 md:h-12 rounded-tl-sm",
};

export default function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header Skeleton */}
      <div className="h-16 md:h-20 px-3 md:px-6 flex items-center gap-2.5 md:gap-4 bg-primary/50 border-b border-border-divider/50">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-elevated animate-pulse" />
        <div className="space-y-2">
          <div className="w-24 md:w-32 h-3 bg-elevated rounded-full animate-pulse" />
          <div className="w-16 md:w-20 h-2 bg-elevated rounded-full animate-pulse" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 px-3 py-4 md:p-6 space-y-8 md:space-y-10 overflow-hidden bg-[url('/images/chat-bg.png')] bg-fixed opacity-95">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const isRight = i % 3 === 0;
          const isEven = i % 2 === 0;
          
          const bubbleClass = isRight
            ? (isEven ? SKELETON_BUBBLE_CLASSES.rightEven : SKELETON_BUBBLE_CLASSES.rightOdd)
            : (isEven ? SKELETON_BUBBLE_CLASSES.leftEven : SKELETON_BUBBLE_CLASSES.leftOdd);

          return (
            <div
              key={i}
              className={clsx(
                "flex gap-2.5 md:gap-4",
                isRight ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isRight && (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-elevated shrink-0 animate-pulse" />
              )}
              <div className={clsx(
                "flex flex-col gap-2 max-w-[70%] md:max-w-[65%]",
                isRight ? "items-end" : "items-start"
              )}>
                <div 
                  className={clsx(
                    "bg-elevated rounded-2xl animate-pulse",
                    bubbleClass
                  )} 
                />
                <div className="w-12 md:w-16 h-2 bg-elevated/50 rounded-full animate-pulse" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
