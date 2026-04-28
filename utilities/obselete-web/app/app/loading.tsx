import { GamesHomeSkeleton } from "@/components/games/GameSkeletons";

export default function AppHomeLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GamesHomeSkeleton />
    </div>
  );
}
