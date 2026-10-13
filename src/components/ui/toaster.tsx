import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  const icons = {
    success: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />,
    danger: <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />,
    destructive: <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />,
    warning: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />,
    info: <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />,
    default: <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />,
  } as const

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex min-w-0 items-start gap-3">
              {icons[props.variant ?? "default"] ?? icons.default}
              <div className="grid min-w-0 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
