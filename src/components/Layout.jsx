import Navbar from './Navbar.jsx';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        Sports Week Tournament &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
