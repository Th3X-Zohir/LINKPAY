import { Card, CardContent } from '@/components/ui/card'
import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FailPageProps {
  params: Promise<{ shareUrl: string }>
}

export default async function PaymentFailPage({ params }: FailPageProps) {
  const { shareUrl } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50/50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-red-100 shadow-xl shadow-red-200/30 overflow-hidden">
        <CardContent className="py-12 px-8">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200/50">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
          <p className="text-slate-600 mb-8">
            The payment could not be processed. Please try again or contact support.
          </p>
          <div className="space-y-3">
            <Link href={`/pay/${shareUrl}`}>
              <Button variant="outline" className="w-full h-11 gap-2">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full text-slate-500">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
