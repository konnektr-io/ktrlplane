import { useState } from "react";
import { useSearchUsers } from "../hooks/useAccessApi";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserSelector({
  value,
  onValueChange,
  placeholder = "Select user...",
  disabled,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading } = useSearchUsers(searchTerm);

  // Remove legacy effect, use React Query result

  // Match selected user strictly by id
  const selectedUser = users.find((user) => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <span>
                {selectedUser.name || selectedUser.email || selectedUser.id}
              </span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{value} (new user)</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search users by email or name..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : (
              <>
                {users.length > 0 && (
                  <CommandGroup>
                    {users.map((user, uIdx) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.email}${uIdx}`}
                        onSelect={() => {
                          onValueChange(user.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === `${user.email}${uIdx}`
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.id}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchTerm.length >= 2 && users.length === 0 && (
                  <CommandGroup>
                    <CommandItem
                      value={searchTerm}
                      onSelect={() => {
                        onValueChange(searchTerm);
                        setOpen(false);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Invite {searchTerm}</div>
                        <div className="text-sm text-muted-foreground">
                          Send invitation to new user
                        </div>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}
                {searchTerm.length < 2 && users.length === 0 && (
                  <CommandEmpty>
                    Type at least 2 characters to search...
                  </CommandEmpty>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
