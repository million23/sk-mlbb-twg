import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmins } from "@/hooks/use-admins";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/$id/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  const { data: admins, isLoading } = useAdmins();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
        <p className="text-muted-foreground">
          Admin accounts with access to the tournament management system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin accounts</CardTitle>
          <CardDescription>
            {admins?.length ?? 0} admins with access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !admins?.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No admins</EmptyTitle>
                <EmptyDescription>
                  Admin accounts will appear here when configured
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.email ?? "-"}</TableCell>
                    <TableCell>{a.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.role ?? "staff"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.isActive ? "default" : "secondary"}>
                        {a.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
