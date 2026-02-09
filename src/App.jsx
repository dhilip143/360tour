import { useEffect, useState } from "react";
import Tour from "/src/component/Tour.jsx";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center overflow-hidden relative">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-400/30 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-400/25 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Main Loading Container */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-8 py-12 rounded-3xl 
                       bg-black/50 backdrop-blur-xl shadow-2xl border border-white/20 max-w-md mx-4">
          
          {/* Floating Cube */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 w-24 h-24 bg-blue-500/80 rounded-2xl animate-spin-slow shadow-2xl"></div>
            <div className="absolute inset-2 w-20 h-20 bg-blue-400/90 rounded-xl animate-spin-reverse shadow-xl"></div>
            <div className="absolute inset-4 w-16 h-16 bg-white/30 backdrop-blur-sm rounded-lg animate-pulse"></div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
              360° Tour Loading
            </h1>
            <p className="text-lg text-gray-300 font-medium tracking-wide">
              Preparing immersive experience...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-blue-500 rounded-full animate-grow shadow-lg"></div>
          </div>

          {/* Dots Animation */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes spin-reverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes grow {
            0% { width: 0%; }
            50%, 100% { width: 100%; }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
          .animate-spin-reverse {
            animation: spin-reverse 2s linear infinite;
          }
          .animate-grow {
            animation: grow 2.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return <Tour />;
}

export default App;
