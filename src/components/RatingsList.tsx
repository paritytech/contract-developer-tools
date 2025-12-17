import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useRatings } from '@/hooks/usePapi';
import { RatingCard } from './RatingCard';

export function RatingsList({ onNavigate, idToShop}: { onNavigate: (p: string) => void , idToShop: (id: number) => string}) {
  const [filter, setFilter] = useState('');
  const { ratings, loading, error } = useRatings(idToShop, filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Seller Ratings</h1>
            <p className="text-gray-500 text-sm">On-chain verified reviews</p>
          </div>
          <button onClick={() => onNavigate('submit')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            <Plus size={20} />Add Rating
          </button>
        </div>
        {/*

        <input
          type="text"
          placeholder="Filter by seller name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        */}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No ratings found</div>
        ) : (
          <div className="space-y-4">{ratings.map(r => <RatingCard key={r.id} rating={r} />)}</div>
        )}
      </div>
    </div>
  );
}
