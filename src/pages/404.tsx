export default function Custom404() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
          <p className="text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        
        <a
          href="/"
          className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
