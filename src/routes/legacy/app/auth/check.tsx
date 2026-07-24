import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/legacy/app/auth/check')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/legacy/app/auth/check"!</div>
}
