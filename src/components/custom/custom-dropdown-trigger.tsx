import { MoreVertical } from 'lucide-react';
import { DropdownMenuTrigger } from '../ui/dropdown-menu';

export function CustomDropdownTrigger() {
  return (
    <DropdownMenuTrigger asChild>
      <button type="button" className="border-none outline-none cursor-pointer">
        <MoreVertical className="size-4 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
  );
}
