import { useRef, useEffect, useState, useCallback } from 'react'
import { DrawingTool, StrokeData, User } from '../types'

interface WhiteboardProps {
  tool: DrawingTool
  color: string
  size: number
  strokes: StrokeData[]
  onStrokeComplete: (stroke: StrokeData) => void
  user: User | null
}

const Whiteboard = ({ tool, color, size, strokes, onStrokeComplete, user }: WhiteboardProps) => {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  const drawBackground = useCallback(() => {
    const canvas = backgroundCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with whiteboard background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add subtle grid lines for realistic whiteboard look
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    const gridSize = 20
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }, [])

  // Set up canvas
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current
    const container = containerRef.current
    if (!drawingCanvas || !backgroundCanvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      drawingCanvas.width = rect.width
      drawingCanvas.height = rect.height
      backgroundCanvas.width = rect.width
      backgroundCanvas.height = rect.height
      drawBackground()
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawBackground])

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke)
    })
  }, [strokes])

  // Draw individual stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: StrokeData) => {
    if (stroke.points.length < 2) return

    ctx.save()
    
    // Set tool properties
    if (stroke.tool === 'marker') {
      ctx.globalCompositeOperation = 'multiply'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 0.8
    } else if (stroke.tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 1
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    ctx.strokeStyle = stroke.tool === 'eraser' ? '#000000' : stroke.color // Eraser color doesn't matter with destination-out
    ctx.lineWidth = stroke.size

    // Draw smooth line through points
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const cp1x = (stroke.points[i].x + stroke.points[i + 1].x) / 2
      const cp1y = (stroke.points[i].y + stroke.points[i + 1].y) / 2
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, cp1x, cp1y)
    }
    
    if (stroke.points.length > 1) {
      const lastPoint = stroke.points[stroke.points.length - 1]
      ctx.lineTo(lastPoint.x, lastPoint.y)
    }
    
    ctx.stroke()
    ctx.restore()
  }

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getMousePos(e)
    setIsDrawing(true)
    setCurrentPath([pos])
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return

    const pos = getMousePos(e)
    const newPath = [...currentPath, pos]
    setCurrentPath(newPath)

    // Draw current stroke in real-time
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Don't redraw all for performance, just draw the new segment
    // But for eraser, we need to redraw all
    if (tool === 'eraser') {
        redrawCanvas()
    }

    // Draw current path
    if (newPath.length > 1) {
      const tempStroke: StrokeData = {
        id: 'temp',
        tool,
        color,
        size,
        points: newPath,
        userId: user?.id || 'anonymous',
        timestamp: Date.now()
      }
      drawStroke(ctx, tempStroke)
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || currentPath.length < 2) {
        setIsDrawing(false)
        setCurrentPath([])
        return
    }

    setIsDrawing(false)

    // Create final stroke
    const stroke: StrokeData = {
      id: `${user?.id || 'anonymous'}-${Date.now()}-${Math.random()}`,
      tool,
      color,
      size,
      points: currentPath,
      userId: user?.id || 'anonymous',
      timestamp: Date.now()
    }

    onStrokeComplete(stroke)
    setCurrentPath([])
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-white rounded-lg shadow-lg border-2 border-gray-200 h-full overflow-hidden"
      style={{ 
        background: '#fff',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <canvas
        ref={backgroundCanvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      <canvas
        ref={drawingCanvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ 
          cursor: tool === 'eraser' ? 'grab' : 'crosshair',
          touchAction: 'none'
        }}
      />
      
      {/* Realistic whiteboard edge effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-100 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 to-transparent opacity-50" />
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-gray-100 to-transparent opacity-50" />
        <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-gray-100 to-transparent opacity-50" />
      </div>
    </div>
  )
}

export default Whiteboard