// components/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-red-600 text-white p-4 mt-12 text-center">
      <div className="container mx-auto">
        <p>© {new Date().getFullYear()} F1Metrics Advanced. All rights reserved.</p>
        {/* Add other footer content if needed */}
      </div>
    </footer>
  );
}