const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-2xl font-bold">
          <span className="text-gradient">Studio</span>
        </div>
        <p className="text-muted-foreground text-sm">
          © 2025 Studio. Todos os direitos reservados.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Twitter
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Instagram
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
