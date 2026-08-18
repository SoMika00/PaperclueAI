"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/etc/theme-toggle";
import { LanguageSwitcher } from "@/components/providers/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTranslation } from "react-i18next";
import { Logo } from "./logo";
import { useAtom } from "jotai";
import { userAtom } from "@/atoms/user";

export function UnauthorizedNavbar() {
  const [currentUser, setCurrentUser] = useAtom(userAtom);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900 border-b dark:border-slate-800">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Logo />
        <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
      </div>
    </nav>
  );
}
