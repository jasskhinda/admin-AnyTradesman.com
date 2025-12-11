import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access the admin panel. This area is restricted to administrators only.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://anytradesman.com'}>
              <Button variant="outline">Go to Main Site</Button>
            </a>
            <a href="/login">
              <Button>Try Another Account</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
