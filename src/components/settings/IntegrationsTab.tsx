import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function IntegrationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Coming soon - Connect third-party services</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Integrations will be available soon.</p>
      </CardContent>
    </Card>
  );
}
