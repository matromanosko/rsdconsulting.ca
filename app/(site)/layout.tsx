import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

// Site chrome for the public pages; the root layout only sets fonts and theme.
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
