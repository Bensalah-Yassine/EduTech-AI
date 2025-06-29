'use client';
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const NavItems = () => {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();
    
    const authenticatedNavItems = [
        {label: 'Home', href: '/'}, 
        {label: 'Companions', href: '/companions'} ,
        {label: 'My Journey' , href : '/my-journey'}
    ];
    
    const publicNavItems = [
        {label: 'Home', href: '/'}, 
        {label: 'Sign In', href: '/sign-in'}
    ];
    
    const navItems = isSignedIn ? authenticatedNavItems : publicNavItems;
    
    return (
        <nav className="flex items-center gap-4">
            {navItems.map(({label , href }) => (
                <Link 
                    href={href}
                    key={label}
                    className={cn(pathname === href && 'text-primary font-semibold')}
                >
                    {label}
                </Link>
            ))}
        </nav>
    )
}

export default NavItems