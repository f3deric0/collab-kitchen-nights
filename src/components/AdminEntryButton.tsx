import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminEntryButton = () => {
  return (
    <Button
      asChild
      variant="outline"
      className="rounded-full border-border bg-card/80 px-4 font-body text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-sm backdrop-blur-sm"
    >
      <Link to="/admin">
        <Shield className="h-4 w-4" />
        Admin
      </Link>
    </Button>
  );
};

export default AdminEntryButton;
