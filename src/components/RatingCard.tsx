import { User, Calendar, Package, Truck, MessageCircle } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Rating } from '@/types';

export function RatingCard({ rating }: { rating: Rating }) {
  const avg = ((rating.article + rating.shipping + rating.communication) / 3).toFixed(1);
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-full">
            <User size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{rating.seller}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar size={12} />{rating.date}
            </div>
          </div>
        </div>
        <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">{avg} ★</div>
      </div>
      <p className="text-gray-600 mb-4 text-sm">{rating.comment}</p>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[
          { icon: Package, label: 'Article', value: rating.article },
          { icon: Truck, label: 'Shipping', value: rating.shipping },
          { icon: MessageCircle, label: 'Comm.', value: rating.communication },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
            <Icon size={16} className="text-gray-500 mb-1" />
            <span className="text-xs text-gray-500 mb-1">{label}</span>
            <StarRating value={value} readonly />
          </div>
        ))}
      </div>
    </div>
  );
}
