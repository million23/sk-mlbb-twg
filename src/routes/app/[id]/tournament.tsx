import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/id/tournament')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/tournament"!</div>
}
