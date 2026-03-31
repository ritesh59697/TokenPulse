export default function SplashScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0b0f19] text-white">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold">TokenPulse</h1>

        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

        <p className="text-sm text-gray-400">
          Loading markets...
        </p>
      </div>
    </div>
  );
}