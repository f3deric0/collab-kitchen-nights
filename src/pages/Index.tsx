import HeroSection from "@/components/HeroSection";
import WhatIsCollab from "@/components/WhatIsCollab";
import BookingSection from "@/components/BookingSection";
import RecipesSection from "@/components/RecipesSection";
import PantrySection from "@/components/PantrySection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <WhatIsCollab />
      <BookingSection />
      <RecipesSection />
      <PantrySection />
      <FooterSection />
    </main>
  );
};

export default Index;
