"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Lock } from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
})

export function ForgotPasswordCard() {
  const { resetPassword, error, clearError } = useFirebaseAuth() as any
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "" },
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setSuccessMessage(null)
    clearError()
    setSubmitting(true)
    const res = await resetPassword?.(data.email)
    setSubmitting(false)
    if (res?.success) setSuccessMessage("Password reset email sent. Please check your inbox.")
  }

  return (
    <Card className="flex w-full max-w-[440px] shadow-none flex-col gap-6 p-5 md:p-8">
      <CardHeader className="flex flex-col items-center gap-2">
        <div className="relative flex size-[68px] shrink-0 items-center justify-center rounded-full backdrop-blur-xl md:size-24 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-orange-500 before:to-transparent before:opacity-10">
          <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-background dark:bg-muted/80 shadow-xs ring-1 ring-inset ring-border md:size-16">
            <Lock className="size-6 text-muted-foreground/80 md:size-8" />
          </div>
        </div>

        <div className="flex flex-col space-y-1.5 text-center">
          <CardTitle className="md:text-xl font-medium">Forgot your password?</CardTitle>
          <CardDescription className="tracking-[-0.006em]">
            Enter your email address to reset your password.
          </CardDescription>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="name@domain.com" className="rounded-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={submitting}>
              {submitting ? "Sending..." : "Continue"}
            </Button>

            <p className="text-muted-foreground text-xs">
              Please enter the email address associated with your account. You will receive an email with instructions
              on how to reset your password.
            </p>

            <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800 font-medium">
                Tip: If you don't see the email, please check your Spam or Junk folder.
              </p>
            </div>

            
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}


