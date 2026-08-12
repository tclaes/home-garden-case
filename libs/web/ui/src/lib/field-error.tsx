import { type HTMLAttributes } from 'react';
import { cn } from './cn.js';

export function FieldError({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p role="alert" className={cn('text-sm text-red-600', className)} {...props}>
      {children}
    </p>
  );
}
