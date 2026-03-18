const FooterSection = () => {
  return (
    <footer className="bg-primary px-6 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h3 className="mb-3 font-display text-2xl font-bold text-primary-foreground">
          Collab @ Milestone Lombos
        </h3>
        <p className="mx-auto mb-8 max-w-xl font-body text-sm text-primary-foreground/60">
          Questo non è il sito ufficiale di Milestone. Però se senti partire la
          lavastoviglie, probabilmente la serata è andata bene.
        </p>
        <div className="border-t border-primary-foreground/10 pt-6">
          <p className="font-body text-xs text-primary-foreground/35">
            © 2026 Collab @ Milestone Lombos. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
