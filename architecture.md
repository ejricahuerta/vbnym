# Architecture Guide → Next.js App Router + shadcn/ui

> Single source of truth for project structure, patterns, and conventions.  
> Every file, component, and data-flow decision should be traceable back to this document.

In this monorepo, the live Next.js application root is **`web/`** (not `src/` at repo root). Treat paths below as living under `web/` when you read `app/`, `server/`, `components/`, etc.

---

## Table of contents

1. [Guiding principles](#1-guiding-principles)
2. [Folder structure](#2-folder-structure)
3. [Layer responsibilities](#3-layer-responsibilities)
4. [Component patterns](#4-component-patterns)
5. [Data fetching & mutations](#5-data-fetching--mutations)
6. [TypeScript conventions](#6-typescript-conventions)
7. [shadcn/ui conventions](#7-shadcnui-conventions)
8. [State management](#8-state-management)
9. [Routing & layouts](#9-routing--layouts)
10. [Error handling](#10-error-handling)
11. [Testing strategy](#11-testing-strategy)
12. [Naming conventions](#12-naming-conventions)

---

## 1. Guiding principles

| Principle | What it means in practice |
|---|---|
| **Server-first** | Default to React Server Components. Add `'use client'` only when the component needs browser APIs, event handlers, or local state. |
| **Thin routes** | `page.tsx` files should import/render one feature component (or redirect/notFound only). `layout.tsx` should stay mostly compositional and may load lightweight shell/session data needed for shared chrome. |
| **Co-locate by feature** | A feature's component, hook, schema, and action live in the same folder → not scattered across top-level directories by file type. |
| **Zod as source of truth** | Every shape that crosses a boundary (form → action, API → component) is defined once as a Zod schema. TypeScript types are derived from it → never written by hand. |
| **Separation of concerns** | Reads (queries), writes (actions), presentation (components), and logic (hooks) are distinct files with single responsibilities. |
| **No premature abstraction** | Don't generalise until a pattern appears twice. Duplicate once, abstract the second time. |

---

## 2. Folder structure

```
src/
├── app/                          # Routing layer ONLY → no business logic
│   ├── (auth)/                   # Route group → no URL segment
│   │   ├── login/
│   │   │   ├── page.tsx          # Imports <LoginPage /> → nothing else
│   │   │   └── loading.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── layout.tsx
│   ├── api/                      # Route handlers → keep minimal
│   │   └── webhooks/
│   │       └── route.ts
│   ├── globals.css               # Design tokens & Tailwind base → only file allowed to define CSS vars
│   ├── layout.tsx                # Root layout
│   └── page.tsx
│
├── components/
│   ├── ui/                       # shadcn primitives → NEVER edit directly
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── features/                 # Domain-specific composed components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── useLoginForm.ts   # Hook co-located with feature
│   │   ├── dashboard/
│   │   └── settings/
│   └── shared/                   # Reusable across multiple features
│       ├── PageHeader.tsx
│       ├── DataTable/
│       │   ├── index.tsx
│       │   └── columns.tsx
│       └── AppButton.tsx
│
├── server/
│   ├── actions/                  # Server actions → mutations only
│   │   ├── users.ts
│   │   └── posts.ts
│   └── queries/                  # Data fetching → reads only
│       ├── users.ts
│       └── posts.ts
│
├── lib/
│   ├── db.ts                     # Database client singleton
│   ├── auth.ts                   # Auth configuration & helpers
│   └── utils.ts                  # cn(), formatters, shared pure functions
│
├── hooks/                        # Client-side hooks NOT tied to a single feature
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
│
├── stores/                       # Global client state (Zustand / Jotai)
│   └── ui.store.ts
│
└── types/
    ├── schemas/                  # Zod schemas + inferred types
    │   ├── user.ts
    │   └── post.ts
    └── index.ts                  # Re-exports for clean imports
```

### Rules

- **`app/`** contains only route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`). No reusable components, hooks, or utilities live here.
- **Route thinness:** keep business/domain logic in feature components, server queries, and server actions. `page.tsx` should generally delegate; `layout.tsx` may perform minimal shared-shell reads (for nav/auth chrome).
- **`components/ui/`** is treated as a vendored dependency. Run `npx shadcn@latest add` to populate it; never modify files inside it by hand.
- **`components/features/`** groups files by domain. A feature folder owns its own hook, schema, and action imports → it does not import from another feature folder.
- **`server/`** is server-only. Nothing in this directory may be imported by a client component. Mark files with `import 'server-only'` from the `server-only` package.
- **`hooks/`** at root level is for hooks shared across features. Feature-specific hooks live in their feature folder.

---

## 3. Layer responsibilities

```
┌─────────────────────────────────────────────────────┐
│                     Route files                      │  app/ → routing only
│               page.tsx  layout.tsx                   │
└───────────────────────┬─────────────────────────────┘
                        │ imports
┌───────────────────────▼─────────────────────────────┐
│               Feature / Page components              │  components/features/
│           LoginPage  DashboardPage  etc.             │
│  (RSC → composes server queries + client sub-trees)  │
└───────────┬───────────────────────┬─────────────────┘
            │ calls                 │ renders
┌───────────▼──────────┐  ┌────────▼────────────────┐
│   server/queries/    │  │  Client sub-components  │  'use client'
│   getUserById()      │  │  Forms, Dropdowns, etc. │
│   getPosts()         │  └────────────┬────────────┘
└──────────────────────┘               │ calls
                            ┌──────────▼──────────────┐
                            │   server/actions/        │  'use server'
                            │   updateUser()           │
                            │   createPost()           │
                            └──────────────────────────┘
```

### Server queries (`server/queries/`)

- **Purpose:** Read data. Return typed values. No side effects.
- **Rules:**
  - Always wrap with `react`'s `cache()` to deduplicate within a request.
  - Return `null` or an empty array on not-found → never throw for empty data.
  - Accept only plain, serialisable arguments.

```ts
// server/queries/users.ts
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import type { User } from '@/types'

export const getUserById = cache(async (id: string): Promise<User | null> => {
  return db.user.findUnique({ where: { id } })
})

export const getUsers = cache(async (): Promise<User[]> => {
  return db.user.findMany({ orderBy: { createdAt: 'desc' } })
})
```

### Server actions (`server/actions/`)

- **Purpose:** Mutate data. Validate input. Revalidate cache. Return a typed result.
- **Rules:**
  - Always validate with Zod before touching the database.
  - Always return a typed `ActionResult<T>` → never throw to the client.
  - Call `revalidatePath()` or `revalidateTag()` after successful mutation.
  - Check authentication/authorisation at the top of every action.

```ts
// server/actions/users.ts
'use server'

import { userUpdateSchema } from '@/types/schemas/user'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function updateUser(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getAuthSession()
  if (!session) return { ok: false, error: 'Unauthorised' }

  const parsed = userUpdateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  try {
    const user = await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    })
    revalidatePath('/settings')
    return { ok: true, data: { id: user.id } }
  } catch {
    return { ok: false, error: 'Update failed. Please try again.' }
  }
}
```

---

## 4. Component patterns

### 4.1 Page components (RSC)

Page-level components are always React Server Components unless there is a specific reason for them to be client-side (rare). They fetch data and compose the page from smaller components.

```tsx
// components/features/settings/SettingsPage.tsx
import { getUser } from '@/server/queries/users'
import { SettingsForm } from './SettingsForm'
import { PageHeader } from '@/components/shared/PageHeader'

export async function SettingsPage() {
  const user = await getUser()

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <PageHeader title="Settings" description="Manage your account" />
      <SettingsForm user={user} />
    </div>
  )
}
```

### 4.2 Form components (client)

Forms are always client components. They receive initial data as props from a server parent and call server actions.

```tsx
// components/features/settings/SettingsForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userUpdateSchema, type UserUpdate } from '@/types/schemas/user'
import { updateUser } from '@/server/actions/users'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AppButton } from '@/components/shared/AppButton'
import type { User } from '@/types'

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const form = useForm<UserUpdate>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: { name: user.name, email: user.email },
  })

  async function onSubmit(data: UserUpdate) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.append(k, v))
    const result = await updateUser(formData)
    if (!result.ok) form.setError('root', { message: result.error })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AppButton type="submit" isLoading={form.formState.isSubmitting}>
          Save changes
        </AppButton>
      </form>
    </Form>
  )
}
```

### 4.3 Compound components

Use when a component has multiple named sub-parts that need to be composed flexibly by the caller.

```tsx
// components/shared/Card/index.tsx
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}
      {...props}
    />
  )
}

function Header({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mb-4 font-medium', className)} {...props} />
}

function Body({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('text-sm text-muted-foreground', className)} {...props} />
}

Card.Header = Header
Card.Body = Body

export { Card }
```

### 4.4 Generic list component

Prefer generic render-prop components over duplicating list markup.

```tsx
// components/shared/List.tsx
interface ListProps<T> {
  items: T[]
  render: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  empty?: React.ReactNode
  className?: string
}

export function List<T>({
  items,
  render,
  keyExtractor,
  empty = <p className="text-muted-foreground text-sm">No items found.</p>,
  className,
}: ListProps<T>) {
  if (!items.length) return <>{empty}</>

  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{render(item, i)}</li>
      ))}
    </ul>
  )
}
```

### 4.5 Custom hooks

Extract all non-trivial logic from components into named hooks. A component should be almost entirely declarative JSX.

```ts
// hooks/useAsyncAction.ts
'use client'

import { useState, useTransition } from 'react'
import type { ActionResult } from '@/types'

export function useAsyncAction<T>(
  action: (...args: unknown[]) => Promise<ActionResult<T>>
) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult<T> | null>(null)

  function execute(...args: unknown[]) {
    startTransition(async () => {
      const res = await action(...args)
      setResult(res)
    })
  }

  return { execute, isPending, result }
}
```

---

## 5. Data fetching & mutations

### 5.1 Server-side (RSC)

```tsx
// Parallel fetches → never sequential when data is independent
export async function DashboardPage() {
  const [user, stats, posts] = await Promise.all([
    getUser(),
    getDashboardStats(),
    getRecentPosts(),
  ])

  return <Dashboard user={user} stats={stats} posts={posts} />
}
```

### 5.2 Streaming with Suspense

```tsx
// app/(dashboard)/page.tsx
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <SlowDataComponent />  {/* fetches its own data */}
      </Suspense>
    </div>
  )
}
```

### 5.3 Client-side fetching (TanStack Query)

Use TanStack Query for client-side data that needs to be refetched, paginated, or kept fresh.

```ts
// hooks/useUsers.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((r) => r.json()),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

### 5.4 Optimistic updates

```tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleLike } from '@/server/actions/posts'

export function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [count, addOptimistic] = useOptimistic(
    initialCount,
    (state: number, delta: number) => state + delta
  )

  function handleClick() {
    startTransition(async () => {
      addOptimistic(1)
      await toggleLike(postId)
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {count} likes
    </button>
  )
}
```

---

## 6. TypeScript conventions

### 6.1 Schemas as source of truth

```ts
// types/schemas/user.ts
import { z } from 'zod'

export const userSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  role:      z.enum(['admin', 'member', 'viewer']),
  createdAt: z.coerce.date(),
})

export const userUpdateSchema = userSchema
  .pick({ name: true, email: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'At least one field required')

// Derive types → never write them by hand
export type User       = z.infer<typeof userSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
```

### 6.2 ActionResult type

```ts
// types/index.ts
export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

export type AsyncActionResult<T = void> = Promise<ActionResult<T>>
```

### 6.3 Extending HTML elements

```ts
// Extend native elements → preserve all native props
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?:   'default' | 'ghost' | 'destructive'
  isLoading?: boolean
}

// Forwarding refs correctly
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('...', className)} {...props} />
))
Input.displayName = 'Input'
```

### 6.4 Discriminated unions for UI state

```ts
// Model every possible state explicitly
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error';   message: string }

// TypeScript enforces exhaustive handling
function renderState<T>(state: FetchState<T>) {
  switch (state.status) {
    case 'idle':    return <Idle />
    case 'loading': return <Skeleton />
    case 'success': return <Content data={state.data} />
    case 'error':   return <ErrorState message={state.message} />
  }
}
```

### 6.5 Path aliases

Always use path aliases → never relative `../../` imports.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 7. shadcn/ui conventions

### 7.1 Never modify `components/ui/`

The `ui/` folder is treated as a vendored dependency. Upgrade via the CLI:

```bash
npx shadcn@latest add button   # initial install
npx shadcn@latest diff         # check for upstream changes
```

### 7.2 Extend via wrapper components

```tsx
// components/shared/AppButton.tsx
import { Button, type ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppButtonProps extends ButtonProps {
  isLoading?: boolean
}

export function AppButton({
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: AppButtonProps) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn(className)}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      )}
      {children}
    </Button>
  )
}
```

### 7.3 The `cn()` utility

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Always use cn() → never template literals for conditional Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 7.4 Theming

All design tokens live in `globals.css` only. Never use hard-coded hex values or arbitrary Tailwind values (`text-[#ff0000]`) in component files.

```css
/* app/globals.css */
@layer base {
  :root {
    --background:           0 0% 100%;
    --foreground:           240 10% 3.9%;
    --primary:              240 5.9% 10%;
    --primary-foreground:   0 0% 98%;
    --muted:                240 4.8% 95.9%;
    --muted-foreground:     240 3.8% 46.1%;
    --radius:               0.5rem;
  }
  .dark {
    --background:           240 10% 3.9%;
    --foreground:           0 0% 98%;
    --primary:              0 0% 98%;
    --primary-foreground:   240 5.9% 10%;
  }
}
```

---

## 8. State management

### Decision tree

```
Is the state needed in > 1 unrelated component?
│
├── No  → Local useState / useReducer in the component (or its hook)
│
└── Yes → Is it server state (data from API/DB)?
           │
           ├── Yes → TanStack Query (useQuery / useMutation)
           │
           └── No  → Is it UI state (sidebar open, theme, etc.)?
                      │
                      └── Yes → Zustand store in stores/
```

### Zustand store pattern

```ts
// stores/ui.store.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

---

## 9. Routing & layouts

### Route groups

Use route groups `(name)` to share layouts without adding URL segments.

```
app/
├── (auth)/          # Unauthenticated layout (centered card)
│   ├── login/
│   └── register/
└── (dashboard)/     # Authenticated layout (sidebar + topbar)
    ├── settings/
    └── profile/
```

### Edge route guard (`proxy.ts` / `middleware.ts`)

Auth protection must be centralized at the edge guard layer → not duplicated in individual pages.  
In this codebase, the guard currently lives in `proxy.ts`.

```ts
// proxy.ts (current project pattern)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthorizedAdmin } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // ... session lookup omitted
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    // ... redirect unauthenticated/unauthorized users
  }
  return NextResponse.next();
}
```

If the project later migrates to `middleware.ts`, keep the same principle: one centralized edge guard with explicit public/private matcher rules.

---

## 10. Error handling

### 10.1 Route segment error boundaries

Every route segment that fetches data should have an `error.tsx` sibling.

```tsx
// app/(dashboard)/settings/error.tsx
'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SettingsError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button onClick={reset} className="text-sm underline">
        Try again
      </button>
    </div>
  )
}
```

### 10.2 Action error handling

```tsx
// In a client component calling a server action
const result = await updateUser(formData)

if (!result.ok) {
  toast.error(result.error)
  return
}

toast.success('Saved!')
```

### 10.3 Not found

```tsx
// app/(dashboard)/settings/page.tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id)
  if (!user) notFound()

  return <SettingsPage user={user} />
}
```

---

## 11. Testing strategy

| Layer | Tool | What to test |
|---|---|---|
| Schemas | Vitest | Valid input, invalid input, edge cases |
| Server actions | Vitest + mock DB | Happy path, validation errors, auth checks |
| Server queries | Vitest + mock DB | Returns correct shape, handles null |
| Components | Testing Library | Renders, user interactions, accessibility |
| E2E flows | Playwright | Critical paths (login, checkout, etc.) |

```ts
// Example: schema test
import { describe, it, expect } from 'vitest'
import { userUpdateSchema } from '@/types/schemas/user'

describe('userUpdateSchema', () => {
  it('accepts valid partial updates', () => {
    expect(userUpdateSchema.safeParse({ name: 'Alice' }).success).toBe(true)
  })

  it('rejects empty object', () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(userUpdateSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})
```

---

## 12. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserCard.tsx`, `LoginForm.tsx` |
| Hooks | camelCase, `use` prefix | `useLoginForm.ts`, `useUsers.ts` |
| Server actions | camelCase verb | `createUser`, `deletePost` |
| Server queries | camelCase noun/verb | `getUser`, `listPosts` |
| Zod schemas | camelCase, `Schema` suffix | `userSchema`, `postCreateSchema` |
| Inferred types | PascalCase | `User`, `PostCreate` |
| Store files | camelCase, `.store.ts` suffix | `ui.store.ts`, `auth.store.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `API_BASE_URL` |
| Route files | lowercase (Next.js convention) | `page.tsx`, `layout.tsx` |
| CSS classes | kebab-case (Tailwind handles it) | → |
| Feature folders | kebab-case | `components/features/user-profile/` |

---

*Last updated: see git history.*  
*Owner: keep this document updated whenever a structural decision is made.*
