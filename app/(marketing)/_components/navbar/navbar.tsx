import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import ThemeToggle from "../theme-toggle";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav 
      className="container w-[90%] sm:w-auto  mx-auto sticky top-0 z-50 h-16 border-b border-accent backdrop-blur supports-backdrop-filter:bg-background/30 mt-5 rounded-2xl"
    >
      <div className="h-full flex items-center justify-between max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6">
        <Logo />
        <NavMenu className="hidden md:block" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/dashboard">ورود</Link>
          </Button>
          <Button asChild className="inline-flex">
            <Link href="/demo">درخواست دمو</Link>
          </Button>
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;