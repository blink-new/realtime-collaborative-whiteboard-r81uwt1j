import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

import { PresenceUser } from '../types'

interface UserPresenceProps {
  users: PresenceUser[]
}

const UserPresence = ({ users }: UserPresenceProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {users.slice(0, 5).map((user) => (
          <Tooltip key={user.userId}>
            <TooltipTrigger>
              <div className="relative">
                <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                  <AvatarImage src={user.metadata?.avatar} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user.metadata?.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                
                {/* Tool indicator */}
                {user.metadata?.tool && (
                  <div 
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: user.metadata.color || '#000' }}
                    title={`Using ${user.metadata.tool}`}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">{user.metadata?.name || 'Anonymous'}</p>
                {user.metadata?.tool && (
                  <p className="text-xs text-gray-500">
                    Using {user.metadata.tool}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            +{users.length - 5}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default UserPresence