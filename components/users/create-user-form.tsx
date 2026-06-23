"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Role } from "@/generated/prisma"
import { createUserAction } from "@/actions/users"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be less than 32 characters"),
  role: z.nativeEnum(Role),
})

export function CreateUserForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: Role.user,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    try {
      const formData = new FormData()
      formData.append("email", values.email)
      formData.append("password", values.password)
      formData.append("role", values.role)

      const result = await createUserAction(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("User created successfully")
        router.push("/dashboard/users")
      }
    } catch (error) {
      toast.error("Failed to create user")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full max-w-md flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="admin@spinzopay.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={Role.admin}>Admin</SelectItem>
                  <SelectItem value={Role.gic}>GIC</SelectItem>
                  <SelectItem value={Role.lotto}>Lotto</SelectItem>
                  <SelectItem value={Role.arca}>Arca</SelectItem>
                  <SelectItem value={Role.user}>User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
