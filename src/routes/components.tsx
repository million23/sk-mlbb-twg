import { createFileRoute } from '@tanstack/react-router'
import {
  getTournamentStatusLabel,
  type TournamentStatus,
} from '@/lib/tournament-status'
import { Bell, Info, ShieldCheck, Users } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FxDemoSkeletonCard } from '@/lib/loading-placeholders'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const Route = createFileRoute('/components')({
  component: ComponentsPage,
})

interface ShowcaseSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function ShowcaseSection({
  title,
  description,
  children,
}: ShowcaseSectionProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ComponentsPage() {
  return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="flex flex-col gap-4">
            <Badge variant="outline">UI Components</Badge>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Components showcase
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                A simple page to preview the shared components without the app
                navbar, footer, or extra layout chrome.
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ShowcaseSection
              title="Buttons and badges"
              description="Basic actions and status chips."
            >
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              <Separator className="my-5" />

              <div className="flex flex-wrap gap-2">
                <Badge>Live</Badge>
                <Badge variant="secondary">Draft</Badge>
                <Badge variant="outline">Upcoming</Badge>
                <Badge variant="destructive">Cancelled</Badge>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              title="Form controls"
              description="Inputs for common page and admin form states."
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="component-title">Tournament title</Label>
                  <Input
                    id="component-title"
                    placeholder="Barangay MLBB Invitational"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="component-notes">Notes</Label>
                  <Textarea
                    id="component-notes"
                    placeholder="Add instructions, schedule notes, or reminders."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Bracket format</Label>
                  <RadioGroup defaultValue="single" className="gap-3">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="single" value="single" />
                      <Label htmlFor="single">Single elimination</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="double" value="double" />
                      <Label htmlFor="double">Double elimination</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select defaultValue="upcoming">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a status">
                        {(value) =>
                          value != null && value !== ""
                            ? getTournamentStatusLabel(value as TournamentStatus)
                            : null
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Event status</SelectLabel>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <Label className="gap-3">
                    <Checkbox defaultChecked />
                    Featured event
                  </Label>
                  <Label className="gap-3">
                    <Switch defaultChecked />
                    Public listing enabled
                  </Label>
                </div>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              title="Tabs and alerts"
              description="Useful for page sections and callout states."
            >
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="teams">Teams</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="pt-4">
                  <Alert>
                    <Info className="size-4" />
                    <AlertTitle>Setup reminder</AlertTitle>
                    <AlertDescription>
                      Keep component examples lightweight so they are easy to
                      scan while building new pages.
                    </AlertDescription>
                    <AlertAction>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </AlertAction>
                  </Alert>
                </TabsContent>
                <TabsContent value="teams" className="pt-4">
                  <Alert>
                    <Users className="size-4" />
                    <AlertTitle>Team slots</AlertTitle>
                    <AlertDescription>
                      12 registered teams, 3 pending confirmations, 1 waitlist.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                <TabsContent value="schedule" className="pt-4">
                  <Alert variant="destructive">
                    <Bell className="size-4" />
                    <AlertTitle>Conflict detected</AlertTitle>
                    <AlertDescription>
                      Two matches are currently assigned to the same start time.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </ShowcaseSection>

            <ShowcaseSection
              title="Accordion and progress"
              description="Good for compact details and completion states."
            >
              <div className="grid gap-5">
                <Accordion defaultValue={['requirements']} className="w-full">
                  <AccordionItem value="requirements">
                    <AccordionTrigger>Requirements</AccordionTrigger>
                    <AccordionContent>
                      Teams must have five starters and one optional backup
                      player before final lock-in.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="check-in">
                    <AccordionTrigger>Check-in window</AccordionTrigger>
                    <AccordionContent>
                      Online check-in opens two hours before the first match and
                      closes thirty minutes before bracket start.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="grid gap-3">
                  <Progress value={72}>
                    <ProgressLabel>Registration progress</ProgressLabel>
                    <ProgressValue>72%</ProgressValue>
                  </Progress>
                  <Progress value={45}>
                    <ProgressLabel>Venue preparation</ProgressLabel>
                    <ProgressValue>45%</ProgressValue>
                  </Progress>
                </div>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              title="Avatars and loading states"
              description="Small identity and skeleton patterns."
            >
              <div className="grid gap-5">
                <AvatarGroup>
                  <Avatar>
                    <AvatarFallback>AL</AvatarFallback>
                    <AvatarBadge />
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>BK</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>CR</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+4</AvatarGroupCount>
                </AvatarGroup>

                <Skeleton
                  aria-hidden
                  className="block bg-transparent p-0 shadow-none ring-0"
                >
                  <FxDemoSkeletonCard />
                </Skeleton>
                <span className="sr-only">Skeleton layout preview</span>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              title="Table"
              description="Compact data preview for admin screens."
            >
              <Table>
                <TableCaption>Sample tournament entries</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Lagoon Esports</TableCell>
                    <TableCell>Checked in</TableCell>
                    <TableCell>#1</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Palm Five</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>#4</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Barangay Rivals</TableCell>
                    <TableCell>Approved</TableCell>
                    <TableCell>#7</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ShowcaseSection>
          </section>

          <section>
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Helpful interactions</CardTitle>
                <CardDescription>
                  A couple of small interactive examples for hover and status
                  feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <Tooltip>
                  <TooltipTrigger render={<Button variant="outline" />}>
                    Hover for tooltip
                  </TooltipTrigger>
                  <TooltipContent>
                    Use this page as a quick visual reference while building.
                  </TooltipContent>
                </Tooltip>

                <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <ShieldCheck className="size-4 text-primary" />
                  Components are mounted without the site navbar.
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Route: /components
              </CardFooter>
            </Card>
          </section>
        </div>
      </main>
  )
}
