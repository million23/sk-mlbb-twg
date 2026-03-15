import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/auth/check')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/auth/check"!</div>
}
