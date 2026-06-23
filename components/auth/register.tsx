"use client";

import { useState } from "react";
import { registerAction } from "@/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Register() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    
    const result = await registerAction(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.success) {
      // Auto sign-in after successful registration
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Failed to sign in automatically.");
      } else {
        router.push("/dashboard");
      }
    }
    setIsLoading(false);
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
