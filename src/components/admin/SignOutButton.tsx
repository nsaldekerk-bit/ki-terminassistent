"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
    >
      Abmelden
    </button>
  );
}
