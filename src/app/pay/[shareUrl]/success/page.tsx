import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SuccessPageProps {
  params: Promise<{ shareUrl: string }>
}

export default async function PaymentSuccessPage({ params }: SuccessPageProps) {
  await params // Await params to satisfy TypeScript


  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 mb-8">
            Your payment has been processed successfully. The recipient will be notified.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              A confirmation email has been sent to your email address.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
