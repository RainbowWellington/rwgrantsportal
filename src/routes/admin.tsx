import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useIdentity } from "../lib/identity-context.js";
import {
  autoRegisterFirstAdmin,
  isUserAdmin,
} from "../server/admin-users.js";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  CircleDollarSign,
  BookOpen,
  TableProperties,
} from "lucide-react";
import { useState } from "react";

const getAdminAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { auth } = await import('@clerk/tanstack-react-start/server')
  const { createClerkClient } = await import('@clerk/backend')

  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult?.userId ?? null
  } catch {
    return null
  }

  if (!userId) return null

  const clerkClient = createClerkClient({
    secretKey
