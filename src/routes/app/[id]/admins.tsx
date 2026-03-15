import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/id/admins')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/admins"!</div>
}
