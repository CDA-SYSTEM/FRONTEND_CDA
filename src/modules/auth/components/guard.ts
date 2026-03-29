export function getGuardRedirect(isAuthenticated: boolean) {
  return isAuthenticated ? null : '/login'
}
