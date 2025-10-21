import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function BrandingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Settings</CardTitle>
        <CardDescription>Coming soon - Customize your brand appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Branding customization will be available soon.</p>
      </CardContent>
    </Card>
  );
}
