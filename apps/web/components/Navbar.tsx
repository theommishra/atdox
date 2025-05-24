import Button from "../../../packages/ui/src/button";
import Link from "next/link";

const Navbar = () => (
  <header className="flex justify-between items-center p-6 border-b">
    <h1 className="text-2xl font-bold">NotionClone</h1>
    <div className="space-x-4">
      <Link href="/auth?mode=login">
        <Button variant="secondary">Login</Button>
      </Link>
      <Link href="/auth?mode=signup">
        <Button variant="primary" size="sm">Get Started</Button>
      </Link>
    </div>
  </header>
);

export default Navbar;
