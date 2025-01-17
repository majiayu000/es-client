import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LogViewerProps {
  logs: string[]
  title?: string
  className?: string
  maxHeight?: string | number
}

export function LogViewer({ 
  logs, 
  title = "日志", 
  className = "", 
  maxHeight = "300px" 
}: LogViewerProps) {
  if (logs.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-full" style={{ maxHeight }}>
          <div className="space-y-1 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap text-muted-foreground">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 