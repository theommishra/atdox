import FeatureCard from "../components/FeatureCard";
import { features } from "./data/features";
import Button from "../../../packages/ui/src/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
      <section className="text-center py-20 px-6">
        <h2 className="text-5xl font-extrabold leading-tight mb-6">
          Your Notes, Organized <br /> and Always with You
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          A modern workspace where you can write, plan, and collaborate. All in one place.
        </p>

        <Link href="/editor">
          <Button variant="primary" size="lg">
            Create your first File
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-16 max-w-6xl mx-auto">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>
    </main>
  );
}
