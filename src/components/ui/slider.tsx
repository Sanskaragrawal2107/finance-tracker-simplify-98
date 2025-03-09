
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// Modified component that just renders a simple div
// This prevents the slider from being used while maintaining the interface
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <div 
    className={cn("w-full", className)}
    {...props}
  >
    <div className="text-xs text-muted-foreground">Slider component is disabled</div>
  </div>
))
Slider.displayName = "DisabledSlider"

export { Slider }
