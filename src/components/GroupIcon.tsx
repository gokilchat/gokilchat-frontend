import { HiMiniUserGroup } from "react-icons/hi2";
import clsx from "clsx";

interface GroupIconProps {
  className?: string;
}

export default function GroupIcon({ className }: GroupIconProps) {
  return (
    <HiMiniUserGroup className={clsx("w-6 h-6", className)} />
  );
}
