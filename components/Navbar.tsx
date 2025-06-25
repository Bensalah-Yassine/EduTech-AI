import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";

const Navbar = () => {
    return(
        <nav className="navbar">
            <Link href="/">
                <div className="flex item-center gap-2.5 cursor-pionter">
                    <Image src="/images/logo.svg" alt="logo" width={46} height={44}/>
                </div>
            </Link>
            <div className="flex item-center gap-8">
                <NavItems/>
                <p>Sign in</p>
            </div>
        </nav>
    )
}
export default Navbar