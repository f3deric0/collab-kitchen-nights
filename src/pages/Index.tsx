import HeroSection from "@/components/HeroSection";
import WhatIsCollab from "@/components/WhatIsCollab";
import CollabBoard from "@/components/CollabBoard";
import BookingSection from "@/components/BookingSection";
import HistoricalCollab from "@/components/HistoricalCollab";
import RecipesSection from "@/components/RecipesSection";
import PantrySection from "@/components/PantrySection";
import DishwasherShowcase from "@/components/DishwasherShowcase";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <WhatIsCollab />
      <CollabBoard />
      <BookingSection />
      <HistoricalCollab />
      <RecipesSection />
      <PantrySection />
      <DishwasherShowcase />
      <FooterSection />
    </main>
  );
};

export default Index;
