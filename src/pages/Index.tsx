import HeroSection from "@/components/HeroSection";
import WhatIsCollab from "@/components/WhatIsCollab";
import CollabBoard from "@/components/CollabBoard";
import BookingSection from "@/components/BookingSection";
import RecipesSection from "@/components/RecipesSection";
import PantrySection from "@/components/PantrySection";
import HistoricalCollab from "@/components/HistoricalCollab";
import DishwasherShowcase from "@/components/DishwasherShowcase";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <WhatIsCollab />
      <CollabBoard />
      <BookingSection />
      <RecipesSection />
      <PantrySection />
      <HistoricalCollab />
      <DishwasherShowcase />
      <FooterSection />
    </main>
  );
};

export default Index;
