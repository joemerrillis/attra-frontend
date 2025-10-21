import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function BillingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>Coming soon - Manage your subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Billing management will be available soon.</p>
      </CardContent>
    </Card>
  );
}
