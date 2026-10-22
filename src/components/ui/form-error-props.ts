import { isApiError } from '@/lib/api-error'
export function fieldErrorProps(error: unknown, field: string, prefix: string) {
  const invalid = isApiError(error) && !!error.fieldMessage(field)
  return {
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? prefix + '-' + field : undefined,
  }
}
