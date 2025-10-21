import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ProfileTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Coming soon - Manage your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Profile management will be available soon.</p>
      </CardContent>
    </Card>
  );
}
