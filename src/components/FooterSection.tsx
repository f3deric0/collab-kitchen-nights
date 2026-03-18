import { Mail, Instagram } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-primary py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="font-display text-2xl font-bold text-primary-foreground mb-3">
          Collab @ Milestone Lombos
        </h3>
        <p className="font-body text-sm text-primary-foreground/50 mb-8 max-w-md mx-auto">
          Questo non è il sito ufficiale di Milestone. È un progetto personale
          nato dalla passione per il buon cibo e la buona compagnia.
        </p>
        <div className="flex items-center justify-center gap-6 mb-8">
          <a
            href="mailto:hello@collablombos.com"
            className="flex items-center gap-2 text-primary-foreground/70 hover:text-accent transition-colors font-body text-sm"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-foreground/70 hover:text-accent transition-colors font-body text-sm"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </a>
        </div>
        <div className="border-t border-primary-foreground/10 pt-6">
          <p className="font-body text-xs text-primary-foreground/30">
            © {new Date().getFullYear()} Collab @ Milestone Lombos. Tutti i
            diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
