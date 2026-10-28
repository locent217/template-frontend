import { reactive } from 'vue'

type ConfirmOptions = { title?: string; message: string; confirmText?: string; color?: string }
let settle: ((confirmed: boolean) => void) | null = null
export const confirmState = reactive({ open: false, title: '', message: '', confirmText: 'Confirm', color: 'error' })
export function closeConfirm(confirmed: boolean): void {
  confirmState.open = false
  const callback = settle
  settle = null
  callback?.(confirmed)
}
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    if (settle) closeConfirm(false)
    Object.assign(confirmState, { open: true, title: options.title ?? 'Confirm action', message: options.message, confirmText: options.confirmText ?? 'Confirm', color: options.color ?? 'error' })
    return new Promise<boolean>((resolve) => { settle = resolve })
  }
  return { confirm }
}
