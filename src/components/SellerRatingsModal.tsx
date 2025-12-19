import { X, User, Package, Truck, MessageCircle, Calendar, Loader2 } from 'lucide-react';
import { StarRating } from './StarRating';
//import type { Rating } from '@/types';
import { useRatings } from '@/hooks/usePapi';

interface SellerRatingsModalProps {
  seller: string;
  sellerId: number;
  onClose: () => void;
}

export function SellerRatingsModal({ seller, sellerId, onClose }: SellerRatingsModalProps) {
  // TODO: Fetch ratings for this specific seller using sellerId
  const { ratings, loading, error } = useRatings((_: number) => seller, sellerId);


  // Calculate average scores
  const avgArticle = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.article, 0) / ratings.length : 0;
  const avgShipping = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.shipping, 0) / ratings.length : 0;
  const avgComm = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.communication, 0) / ratings.length : 0;
  const overallAvg = ratings.length > 0 ? ((avgArticle + avgShipping + avgComm) / 3).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <User size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{seller}</h2>
                <p className="text-indigo-200 text-sm">{ratings.length} ratings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Average scores summary */}
          {ratings.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{overallAvg}</div>
                <div className="text-xs text-indigo-200">Overall</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Package size={16} className="mx-auto mb-1" />
                <div className="font-semibold">{avgArticle.toFixed(1)}</div>
                <div className="text-xs text-indigo-200">Article</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Truck size={16} className="mx-auto mb-1" />
                <div className="font-semibold">{avgShipping.toFixed(1)}</div>
                <div className="text-xs text-indigo-200">Shipping</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <MessageCircle size={16} className="mx-auto mb-1" />
                <div className="font-semibold">{avgComm.toFixed(1)}</div>
                <div className="text-xs text-indigo-200">Comm.</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No ratings found for this seller
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map(rating => (
                <div key={rating.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={12} />
                      {rating.date}
                    </div>
                    <div className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      {((rating.article + rating.shipping + rating.communication) / 3).toFixed(1)} ★
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">{rating.comment}</p>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[
                      { icon: Package, label: 'Article', value: rating.article },
                      { icon: Truck, label: 'Shipping', value: rating.shipping },
                      { icon: MessageCircle, label: 'Comm.', value: rating.communication },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex flex-col items-center p-2 bg-white rounded-lg">
                        <Icon size={14} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 mb-1">{label}</span>
                        <StarRating value={value} readonly size={12} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
