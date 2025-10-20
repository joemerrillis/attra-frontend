import { Shield, Eye, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PrivacyNotice() {
  return (
    <Card className="border-blue-100 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">
              Your privacy matters
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                We only collect what you provide
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Your data is never sold or shared
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
