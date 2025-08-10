import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { User } from '../types';
import { Check, ChevronDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserSelector({ value, onValueChange, placeholder = "Select user...", disabled }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock function to search users - replace with actual API call
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];
    
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock users data - replace with actual API call
      const mockUsers: User[] = [
        {
          id: 'user1',
          email: 'john.doe@example.com',
          name: 'John Doe',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
        },
        {
          id: 'user2',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'
        },
        {
          id: 'user3',
          email: 'bob.wilson@example.com',
          name: 'Bob Wilson',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
        },
      ];
      
      // Filter users based on search term
      return mockUsers.filter(user =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase())
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers(searchTerm).then(setUsers);
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const selectedUser = users.find(user => user.email === value);

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
              {selectedUser.avatar && (
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.name} 
                  className="h-5 w-5 rounded-full"
                />
              )}
              <span>{selectedUser.name || selectedUser.email}</span>
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
            ) : users.length > 0 ? (
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.email}
                    onSelect={(currentValue: string) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === user.email ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      {user.avatar && (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="h-5 w-5 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : searchTerm.length >= 2 ? (
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
                    <div className="text-sm text-muted-foreground">Send invitation to new user</div>
                  </div>
                </CommandItem>
              </CommandGroup>
            ) : (
              <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
