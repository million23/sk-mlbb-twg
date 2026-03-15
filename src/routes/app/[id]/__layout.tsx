import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/id/__layout')({
  component: RouteComponent,
  beforeLoad: async () => {
    console.log('check auth')
  }
})

function RouteComponent() {
  return <div>Hello "/app/id/__layout"!</div>
}
