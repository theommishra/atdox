import Button from "../../../packages/ui/src/button";

const Navbar = () => (
  <header className="flex justify-between items-center p-6 border-b">
    <h1 className="text-2xl font-bold">NotionClone</h1>
    <div className="space-x-4">
      <Button variant="secondary">Login</Button>
      <Button variant="primary" size="sm">Get Started</Button>
    </div>
  </header>
);

export default Navbar;
