export default function TokenModal({ token, onClose }) {
  if (!token) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111827] text-white p-6 rounded-lg w-[480px] relative">

        <button
          className="absolute right-4 top-4 text-gray-400"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {token.name} ({token.symbol})
        </h2>

        <div className="space-y-2 text-sm">
          <p>Price: ${token.current_price}</p>
          <p>Market Cap: ${token.market_cap}</p>
          <p>24h Change: {token.price_change_percentage_24h}%</p>
          <p>Volume: ${token.total_volume}</p>
        </div>

      </div>
    </div>
  );
}