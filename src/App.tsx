import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import Whiteboard from './components/Whiteboard'
import Toolbar from './components/Toolbar'
import UserPresence from './components/UserPresence'
import { Button } from './components/ui/button'
import toast from 'react-hot-toast'
import { Save, Users, Loader2 } from 'lucide-react'
import { DrawingTool, StrokeData, User, PresenceUser } from './types'

function App() {
  const [currentTool, setCurrentTool] = useState<DrawingTool>('marker')
  const [currentColor, setCurrentColor] = useState('#2563eb')
  const [currentSize, setCurrentSize] = useState(8)
  const [strokes, setStrokes] = useState<StrokeData[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = blink.auth.onAuthStateChanged(async (authState) => {
      if (authState && authState.user) {
        setUser(authState.user)
        setAuthChecked(true)
        setLoading(false)
      } else if (authState && !authState.user) {
        // No user logged in
        setUser(null)
        setAuthChecked(true)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
    }
  }, [])

  // Set up realtime subscriptions after user is authenticated
  useEffect(() => {
    if (!user) return

    let unsubscribeRealtime: (() => void) | null = null
    let channel: ReturnType<typeof blink.realtime.channel> | null = null

    const setupRealtime = async () => {
      try {
        // Subscribe to real-time updates
        unsubscribeRealtime = await blink.realtime.subscribe('whiteboard-main', (message) => {
          if (message.type === 'stroke') {
            setStrokes(prev => {
              const existing = prev.find(s => s.id === message.data.id)
              if (existing) return prev
              return [...prev, message.data]
            })
          } else if (message.type === 'clear') {
            setStrokes([])
          }
        })

        // Subscribe to presence
        channel = blink.realtime.channel('whiteboard-main')
        
        await channel.subscribe({
          userId: user.id,
          metadata: { 
            name: user.display_name || user.email?.split('@')[0] || 'Anonymous',
            avatar: user.avatar_url,
            tool: currentTool,
            color: currentColor
          }
        })

        channel.onPresence((users: PresenceUser[]) => {
          setOnlineUsers(users)
        })

        // Get initial presence state
        const initialUsers = await channel.getPresence()
        setOnlineUsers(initialUsers)

      } catch (error) {
        console.error('Error setting up realtime:', error)
        toast.error('Failed to connect to realtime features')
      }
    }

    setupRealtime()

    // Cleanup function
    return () => {
      if (unsubscribeRealtime) {
        unsubscribeRealtime()
      }
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [user, currentTool, currentColor])

  const handleStrokeComplete = async (stroke: StrokeData) => {
    if (!user) return
    
    setStrokes(prev => [...prev, stroke])
    
    // Broadcast to other users
    try {
      await blink.realtime.publish('whiteboard-main', 'stroke', stroke)
    } catch (error) {
      console.error('Error publishing stroke:', error)
    }
  }

  const handleClearCanvas = async () => {
    setStrokes([])
    try {
      await blink.realtime.publish('whiteboard-main', 'clear', {})
      toast.success('Canvas cleared!')
    } catch (error) {
      console.error('Error clearing canvas:', error)
      toast.error('Failed to clear canvas for others')
    }
  }

  const handleSaveToDatabase = async () => {
    if (strokes.length === 0) {
      toast.error('Nothing to save!')
      return
    }

    if (!user) {
      toast.error('Please sign in to save')
      return
    }

    setSaving(true)
    try {
      // Save the current whiteboard state to database
      await blink.db.whiteboards.create({
        name: `Whiteboard ${new Date().toLocaleString()}`,
        strokes: JSON.stringify(strokes),
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      
      toast.success('Whiteboard saved to database!')
    } catch (error) {
      console.error('Error saving whiteboard:', error)
      toast.error('Failed to save whiteboard')
    } finally {
      setSaving(false)
    }
  }

  // Show loading state while checking auth
  if (loading || !authChecked) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    )
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Collaborative Whiteboard</h1>
          <p className="text-gray-600 mb-6">Sign in to start collaborating with others in real-time</p>
          <Button 
            onClick={() => blink.auth.login()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Collaborative Whiteboard</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{onlineUsers.length} online</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <UserPresence users={onlineUsers} />
          <Button
            onClick={handleSaveToDatabase}
            disabled={saving || strokes.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save to Database'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Toolbar */}
        <Toolbar
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          currentSize={currentSize}
          setCurrentSize={setCurrentSize}
          onClear={handleClearCanvas}
        />

        {/* Whiteboard */}
        <div className="flex-1 p-4">
          <Whiteboard
            tool={currentTool}
            color={currentColor}
            size={currentSize}
            strokes={strokes}
            onStrokeComplete={handleStrokeComplete}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}

export default App