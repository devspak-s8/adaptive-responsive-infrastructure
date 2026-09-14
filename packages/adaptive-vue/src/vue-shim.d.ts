declare module 'vue' {
  export function onMounted(callback: () => void): void;
  export function onBeforeUnmount(callback: () => void): void;
}
