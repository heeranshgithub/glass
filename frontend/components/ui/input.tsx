import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-border focus-visible:border-input aria-invalid:border-destructive h-10 rounded-xl border bg-transparent px-3.5 py-2 text-sm transition-colors file:h-7 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground/85 w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
