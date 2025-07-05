import { DrawingTool } from '../types'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { Slider } from './ui/slider'
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  Trash2,
  Circle
} from 'lucide-react'

interface ToolbarProps {
  currentTool: DrawingTool
  setCurrentTool: (tool: DrawingTool) => void
  currentColor: string
  setCurrentColor: (color: string) => void
  currentSize: number
  setCurrentSize: (size: number) => void
  onClear: () => void
}

const colors = [
  '#000000', // Black
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ca8a04', // Yellow
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#be185d', // Pink
  '#374151', // Gray
]

const Toolbar = ({
  currentTool,
  setCurrentTool,
  currentColor,
  setCurrentColor,
  currentSize,
  setCurrentSize,
  onClear
}: ToolbarProps) => {
  return (
    <div className="w-20 md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col space-y-6">
      {/* Tools */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm hidden md:block">Drawing Tools</h3>
        
        <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
          <Button
            variant={currentTool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('pen')}
            className="flex-1 md:w-full justify-start"
          >
            <PenTool className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Pen</span>
          </Button>
          
          <Button
            variant={currentTool === 'marker' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('marker')}
            className="flex-1 md:w-full justify-start"
          >
            <Highlighter className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Marker</span>
          </Button>
          
          <Button
            variant={currentTool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('eraser')}
            className="flex-1 md:w-full justify-start"
          >
            <Eraser className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Eraser</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm hidden md:block">Colors</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                currentColor === color 
                  ? 'border-gray-800 scale-110 shadow-lg' 
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            >
              {currentColor === color && (
                <Circle className="w-3 h-3 text-white mx-auto" fill="currentColor" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Size */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm hidden md:block">
          Brush Size: {currentSize}px
        </h3>
        
        <div className="px-2">
          <Slider
            value={[currentSize]}
            onValueChange={(value) => setCurrentSize(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Size preview */}
        <div className="flex justify-center py-2">
          <div
            className="rounded-full border border-gray-300"
            style={{
              width: `${Math.min(currentSize, 30)}px`,
              height: `${Math.min(currentSize, 30)}px`,
              backgroundColor: currentTool === 'eraser' ? '#f3f4f6' : currentColor,
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-3 mt-auto">
        <Button
          variant="destructive"
          size="sm"
          onClick={onClear}
          className="w-full justify-start"
        >
          <Trash2 className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Clear All</span>
        </Button>
      </div>
    </div>
  )
}

export default Toolbar