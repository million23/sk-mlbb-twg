import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/id/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/id/"!</div>
}
