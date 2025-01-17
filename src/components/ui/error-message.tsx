import * as React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  error: string | null
  className?: string
}

export function ErrorMessage({ error, className }: ErrorMessageProps) {
  if (!error) return null

  return (
    <Alert variant="destructive" className={cn("text-sm", className)}>
      <XCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
} 