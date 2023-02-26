import type { electronApiInterface } from '../electron/ipc/preload'

declare global {
  interface Window {
    electronAPI: electronApiInterface;
  }
}

declare global{
  interface EventTarget{
    tagName:string
  }
}