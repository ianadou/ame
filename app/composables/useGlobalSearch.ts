export function useGlobalSearch() {
  const open = useState<boolean>('global-search-open', () => false)
  return {
    open,
    openSearch: () => {
      open.value = true
    },
    closeSearch: () => {
      open.value = false
    },
    toggleSearch: () => {
      open.value = !open.value
    },
  }
}
