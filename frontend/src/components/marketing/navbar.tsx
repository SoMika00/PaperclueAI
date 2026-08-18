"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Gift,
  Crown,
  Menu,
  Sparkles,
  User,
  X,
  Zap,
  Shield,
  LogOut,
  Coins,
  Badge,
  TrendingUp,
  MoreHorizontal,
  ChevronDown,
  BookOpen,
} from "lucide-react";
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
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getUserById,
  logout as logoutApi,
  getCreditUsageByUserId,
} from "@/services/user";
import type { CreditUsageListResponse } from "@/services/user/api";
import { useToast } from "@/hooks/use-toast";
import { PromoCodeDialog } from "./promo-code-dialog";
import { useQuery } from "@tanstack/react-query";
import { removeAccessToken, getAccessToken } from "@/utils/cookies";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "../ui/progress";

export function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useAtom(userAtom);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const { t } = useTranslation();
  const isLoggedIn = !!getAccessToken();
  const pathname = usePathname();

  // Track window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    data: currentUserData,
    isLoading: userLoading,
    refetch: refetchCurrentUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: () => getCurrentUser(),
    enabled: !!isLoggedIn && currentUser.id > 0,
  });

  useEffect(() => {
    if (currentUserData?.data) {
      setCurrentUser(currentUserData.data);
    }
  }, [currentUserData]);

  const userCredits = {
    current: currentUser.free_credits - (currentUser?.current_credits || 0),
    total: currentUser.free_credits, // You may want to fetch this from user or plan info
    plan: currentUser.subscription_type || "Free",
    // dailyUsed: creditUsage.usages.filter((u: any) => new Date(u.created_at).toDateString() === new Date().toDateString()).length,
    dailyLimit: 100, // You may want to fetch this from plan info
    totalUsed: currentUser.current_credits,
  };

  const creditPercentage = (userCredits.current / userCredits.total) * 100;
  // const dailyPercentage = (userCredits.dailyUsed / userCredits.dailyLimit) * 100

  const getCreditColor = () => {
    if (creditPercentage > 50) return "from-green-500 to-emerald-500";
    if (creditPercentage > 25) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const getCreditTextColor = () => {
    if (creditPercentage > 50) return "text-green-600";
    if (creditPercentage > 25) return "text-yellow-600";
    return "text-red-600";
  };

  // console.log("userPersistence", userPersistence)
  const logout = async () => {
    try {
      // console.log("userPersistence ----------->", userPersistence);
      const response = await logoutApi();
      if (response.success) {
        // Clear all user data
        setCurrentUser({
          id: 0,
          email: "",
          first_name: "",
          last_name: "",
          role: "",
          team_id: null,
          status: "",
          avatar: null,
          is_verified: false,
          subscription_id: "",
          subscription_type: "",
          subscription_status: "",
          subscription_start_date: null,
          subscription_end_date: null,
          free_credits: 0,
          verification_token: null,
          reset_token: null,
          reset_token_expires: null,
          last_login: null,
          promo_code_requested: false,
          promo_code_usage: false,
          promo_code_available: false,
          created_at: "",
          updated_at: "",
        });

        removeAccessToken();

        toast({
          title: "Success",
          description: "Logged out successfully",
        });

        router.push("/login");
      } else {
        toast({
          title: "Error",
          description: "Failed to logout",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
      });
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[99] bg-white/80 dark:bg-slate-900 border-b dark:border-slate-800">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {currentUser.role == "admin" && (
            <Link
              href="/admin"
              className={`relative text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                isActive("/admin")
                  ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                  : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
              }`}
            >
              {t("nav.admin")}
            </Link>
          )}
          {currentUser.first_name ? (
            <>
              <Link
                href="/login"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/proofreader")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className={`h-4 w-4 mr-1 ${isActive("/proofreader") ? "text-theme_primary" : ""}`} />
                {t("nav.proofreader")}
              </Link>
              <Link
                href="/login"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/mind-map")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <Zap className={`h-4 w-4 mr-1 ${isActive("/mind-map") ? "text-theme_primary" : ""}`} />
                {t("nav.mindMap")}
              </Link>
              <Link
                href="/login"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/paper-insights")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <TrendingUp className={`h-4 w-4 mr-1 ${isActive("/paper-insights") ? "text-theme_primary" : ""}`} />
                {t("nav.paperInsights")}
              </Link>
              <Link
                href="/login"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/journal-formatting")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <BookOpen className={`h-4 w-4 mr-1 ${isActive("/journal-formatting") ? "text-theme_primary" : ""}`} />
                {t("nav.journalFormatting")}
              </Link>
            </>
          ) : null}
          {currentUser.role == "team-manager" && (
            <Link
              href="/login"
              className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                isActive("/team-manage")
                  ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                  : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
              }`}
            >
              <User className={`h-4 w-4 mr-1 ${isActive("/team-manage") ? "text-theme_primary" : ""}`} />
              {t("nav.myTeam")}
            </Link>
          )}

          {/* Show about, pricing, blog directly on larger screens */}
          {currentUser.first_name ? null : windowWidth >= 1068 ? (
            <>
              <Link
                href="/about-us"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/about-us")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <Shield className={`h-4 w-4 mr-1 ${isActive("/about-us") ? "text-theme_primary" : ""}`} />
                {t("home.footer.companyItems.about")}
              </Link>
              <Link
                href="/pricing"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/pricing")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <Coins className={`h-4 w-4 mr-1 ${isActive("/pricing") ? "text-theme_primary" : ""}`} />
                {t("nav.pricing")}
              </Link>
              <Link
                href="/blog"
                className={`relative flex items-center text-sm font-medium text-nowrap transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/blog")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
              >
                <Badge className={`h-4 w-4 mr-1 ${isActive("/blog") ? "text-theme_primary" : ""}`} />
                {t("nav.blog")}
              </Link>
            </>
          ) : (
            /* More dropdown for smaller screens */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-sm font-medium hover:text-theme_primary transition-colors dark:text-slate-200 dark:hover:text-theme_primary"
                >
                  {/* <MoreHorizontal className="h-4 w-4 mr-1" /> */}
                  More
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 dark:bg-slate-900 dark:border-slate-700"
              >
                <DropdownMenuItem className={`flex items-center gap-2 ${isActive("/about-us") ? "text-theme_primary bg-theme_primary/10" : "dark:text-slate-300 dark:focus:text-white"}`}>
                  <Shield className={`h-4 w-4 ${isActive("/about-us") ? "text-theme_primary" : ""}`} />
                  <Link href="/about-us" className="flex-1">
                    {t("home.footer.companyItems.about")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className={`flex items-center gap-2 ${isActive("/pricing") ? "text-theme_primary bg-theme_primary/10" : "dark:text-slate-300 dark:focus:text-white"}`}>
                  <Coins className={`h-4 w-4 ${isActive("/pricing") ? "text-theme_primary" : ""}`} />
                  <Link href="/pricing" className="flex-1">
                    {t("nav.pricing")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className={`flex items-center gap-2 ${isActive("/blog") ? "text-theme_primary bg-theme_primary/10" : "dark:text-slate-300 dark:focus:text-white"}`}>
                  <Badge className={`h-4 w-4 ${isActive("/blog") ? "text-theme_primary" : ""}`} />
                  <Link href="/blog" className="flex-1">
                    {t("nav.blog")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Promo Code Button */}
          <div className="flex justify-end items-center">
            {currentUser.first_name &&
            currentUser.subscription_type == "free" &&
            currentUser.promo_code_available &&
            currentUser?.role !== "team-member" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPromoOpen(true)}
                className="ml-2 text-green-600 bg-green-50 hover:text-green-700 dark:bg-green-700/20 dark:hover:text-green-400 transition-all duration-200"
              >
                <Gift className="h-4 w-4 mr-2" />
                Promo Code
              </Button>
            ) : null}

            {/* Upgrade to Premium Button */}
            {currentUser.first_name &&
            currentUser.subscription_type == "free" &&
            !currentUser.promo_code_available &&
            currentUser.free_credits == 0 &&
            (currentUser?.role !== "team-member" && currentUser?.role !== "team-manager" && currentUser?.role !== "admin") ? (
              <Button
                asChild
                className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 relative overflow-hidden group"
              >
                <Link href="/pricing">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <Crown className="h-4 w-4 mr-1 relative z-10" />
                  <span className="relative z-10 font-semibold">Upgrade</span>
                  <Sparkles className="h-3 w-3 ml-1 relative z-10 animate-pulse" />
                </Link>
              </Button>
            ) : null}

            {/* Credits Display */}
            {currentUser.first_name &&
            (currentUser?.role !== "team-member" && currentUser?.role !== "team-manager" && currentUser?.role !== "admin") &&
            currentUser.subscription_type == "free" && currentUser.free_credits != 0 ? (
              <div className="relative ml-1 group">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div
                    className={`p-1.5 rounded-full bg-gradient-to-r ${getCreditColor()}`}
                  >
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-1">
                      <span
                        className={`text-sm font-bold ${getCreditTextColor()}`}
                      >
                        {userCredits.current.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">credits</span>
                    </div>
                    <div className="w-16 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getCreditColor()} transition-all duration-300`}
                        style={{ width: `${creditPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Credits Tooltip */}
                {/* <div className="absolute top-full right-0 mt-2 w-72 group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 !z-[999]">
                <Card className="shadow-xl border-2 border-slate-200 dark:border-slate-700 z-[99]">
                  <CardContent className="p-4 space-y-4 z-[99]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${getCreditColor()}`}>
                          <Coins className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {userCredits.plan} Plan
                          </div>
                          <div className="text-xs text-slate-500">Credits Overview</div>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">Active</Badge>
                    </div>

                    <div className="space-y-3">
                      Total Credits
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Credits</span>
                          <span className="text-sm font-bold">
                            {userCredits.current.toLocaleString()} / {userCredits.total.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={creditPercentage} className="h-2" />
                        <div className="text-xs text-slate-500 text-center">
                          {creditPercentage.toFixed(1)}% remaining
                        </div>
                      </div>

                      Daily Usage
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Today's Usage</span>
                          <span className="text-sm font-bold">
                            {userCredits.dailyUsed} / {userCredits.dailyLimit}
                          </span>
                        </div>
                        <Progress value={dailyPercentage} className="h-2" />
                        <div className="text-xs text-slate-500 text-center">
                          {userCredits.dailyLimit - userCredits.dailyUsed} credits left today
                        </div>
                      </div>

                      Usage Stats
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          <div className="text-xs text-slate-500">This Week</div>
                          <div className="font-bold text-theme_primary">{creditUsage.total_credits}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          <div className="text-xs text-slate-500">This Month</div>
                          <div className="font-bold text-green-600">{creditUsage.total_credits}</div>
                        </div>
                      </div>

                      Action Buttons
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Buy More
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          View History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div> */}
              </div>
            ) : null}
            <div className="mx-2 w-px h-6 bg-slate-300 dark:bg-slate-600" />

            {/* Desktop Navigation */}
            <div className="items-center">
              {currentUser.first_name ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <div className="w-10 h-10 rounded-full bg-gray-300">
                        {currentUser.avatar ? (
                          <Image
                            src={currentUser.avatar}
                            alt="avatar"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-theme_primary flex items-center justify-center text-md font-medium text-white">
                            {currentUser.first_name.toUpperCase().charAt(0)}
                          </div>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 dark:bg-slate-900 dark:border-slate-700 z-[999]"
                  >
                    <div className="px-2 py-1.5 border-b dark:border-slate-700">
                      <p className="text-lg font-medium text-slate-900 dark:text-white">
                        {currentUser.first_name} {currentUser.last_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <DropdownMenuItem className="flex items-center gap-2 dark:text-slate-300 dark:focus:text-white">
                      <User className="h-4 w-4" />
                      <Link href="/profile" className="flex-1">
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>
                    {currentUser.role == "admin" && (
                      <DropdownMenuItem className="flex items-center gap-2 dark:text-slate-300 dark:focus:text-white">
                        <Shield className="h-4 w-4" />
                        <Link href="/admin" className="flex-1">
                          {t("nav.admin")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {/* {currentUser.role != "team-manager" ? 
                    <DropdownMenuItem className="flex items-center gap-2 dark:text-slate-300 dark:focus:text-white">
                      <Crown className="h-4 w-4" />
                      <Link href="/subscription" className="flex-1">
                        {t("nav.manageSubscription")}
                      </Link>
                    </DropdownMenuItem> : null} */}
                    <DropdownMenuItem
                      className="flex items-center gap-2 dark:focus:text-white cursor-pointer text-red-600 dark:text-red-400"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="flex-1">{t("nav.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium hover:text-theme_primary transition-colors dark:text-slate-200 dark:hover:text-theme_primary"
                >
                  {t("nav.login")}
                </Link>
              )}
            </div>
            {/* <div className="mx-2 w-px h-6 bg-slate-300 dark:bg-slate-600" /> */}
            <div className="flex items-center mx-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 lg:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-slate-900 border-b dark:border-slate-800">
          <div className="container mx-auto py-4 px-4 space-y-4">
            {/* Admin Link */}
            {currentUser.role == "admin" && (
              <Link
                href="/admin"
                className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/admin")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.admin")}
              </Link>
            )}

            {/* User-specific navigation items */}
            {currentUser.first_name ? (
              <>
                <Link
                  href="/login"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/proofreader")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Sparkles className={`h-4 w-4 inline mr-2 ${isActive("/proofreader") ? "text-theme_primary" : ""}`} />
                  {t("nav.proofreader")}
                </Link>
                <Link
                  href="/login"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/mind-map")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Zap className={`h-4 w-4 inline mr-2 ${isActive("/mind-map") ? "text-theme_primary" : ""}`} />
                  {t("nav.mindMap")}
                </Link>
                <Link
                  href="/login"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/paper-insights")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <TrendingUp className={`h-4 w-4 inline mr-2 ${isActive("/paper-insights") ? "text-theme_primary" : ""}`} />
                  {t("nav.paperInsights")}
                </Link>
                <Link
                  href="/login"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/journal-formatting")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BookOpen className={`h-4 w-4 inline mr-2 ${isActive("/journal-formatting") ? "text-theme_primary" : ""}`} />
                  {t("nav.journalFormatting")}
                </Link>
              </>
            ) : null}

            {/* Team Manager Link */}
            {currentUser.role == "team-manager" && (
              <Link
                href="/login"
                className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                  isActive("/team-manage")
                    ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                    : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <User className={`h-4 w-4 inline mr-2 ${isActive("/team-manage") ? "text-theme_primary" : ""}`} />
                {t("nav.myTeam")}
              </Link>
            )}

            {/* About, Pricing, Blog Links */}
            {currentUser.first_name ? null : (
              <>
                <Link
                  href="/about-us"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/about-us")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className={`h-4 w-4 inline mr-2 ${isActive("/about-us") ? "text-theme_primary" : ""}`} />
                  {t("home.footer.companyItems.about")}
                </Link>
                <Link
                  href="/pricing"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/pricing")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Coins className={`h-4 w-4 inline mr-2 ${isActive("/pricing") ? "text-theme_primary" : ""}`} />
                  {t("nav.pricing")}
                </Link>
                <Link
                  href="/blog"
                  className={`block text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive("/blog")
                      ? "text-theme_primary bg-theme_primary/10 dark:bg-theme_primary/20"
                      : "text-slate-700 hover:text-theme_primary hover:bg-slate-100 dark:text-slate-200 dark:hover:text-theme_primary dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Badge className={`h-4 w-4 inline mr-2 ${isActive("/blog") ? "text-theme_primary" : ""}`} />
                  {t("nav.blog")}
                </Link>
              </>
            )}
            {currentUser.first_name ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <div className="w-10 h-10 rounded-full bg-gray-300">
                      {currentUser.avatar ? (
                        <Image
                          src={currentUser.avatar}
                          alt="avatar"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-theme_primary flex items-center justify-center text-md font-medium text-white">
                          {currentUser.first_name.toUpperCase().charAt(0)}
                        </div>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 dark:bg-slate-900 dark:border-slate-700"
                >
                  <div className="px-2 py-1.5 border-b dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <DropdownMenuItem className="flex items-center gap-2 dark:text-slate-300 dark:focus:text-white">
                    <User className="h-4 w-4" />
                    <Link href="/profile" className="flex-1">
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  {currentUser.role == "admin" && (
                    <DropdownMenuItem className="flex items-center gap-2 dark:text-slate-300 dark:focus:text-white">
                      <Shield className="h-4 w-4" />
                      <Link href="/admin" className="flex-1">
                        {t("nav.admin")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="flex items-center gap-2 dark:focus:text-white cursor-pointer text-red-600 dark:text-red-400"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="flex-1">{t("nav.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="block text-sm font-medium hover:text-theme_primary transition-colors dark:text-slate-200 dark:hover:text-theme_primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
      <PromoCodeDialog open={isPromoOpen} onOpenChange={setIsPromoOpen} />
    </nav>
  );
}
