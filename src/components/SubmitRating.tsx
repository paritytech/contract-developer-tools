import { useState } from 'react';
import { ArrowLeft, Package, Truck, MessageCircle, Loader2 } from 'lucide-react';
import { useWallet, useSubmitRating } from '@/hooks/usePapi';
import { StarRating } from './StarRating';


export function SubmitRating({ onNavigate, idToShop}: { onNavigate: (p: string) => void, idToShop: (id: number) => string}) {
  const [form, setForm] = useState({ seller_id: 0, seller: '', comment: '', article: 0, shipping: 0, communication: 0 });
  const { wallet, connect, connecting } = useWallet();
  const { submit, submitting, result, error } = useSubmitRating();


  async function handleSubmit() {
    if (/*!form.seller || */ !form.article || !form.shipping || !form.communication) {
      alert('Please fill all required fields'); return;
    }
    if (!wallet) { alert('Please connect wallet first'); return; }
    await submit(form, wallet.signer);
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">✓</span></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Rating Submitted!</h2>
          <p className="text-gray-500 text-sm mb-4">Your rating has been recorded on-chain.</p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded mb-6 break-all">{result.hash}</p>
          <button onClick={() => onNavigate('list')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">View All Ratings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => onNavigate('list')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft size={20} />Back to Ratings
        </button>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-6">Submit a Rating</h1>
          {!wallet ? (
            <button onClick={connect} disabled={connecting} className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 mb-6 flex items-center justify-center gap-2">
              {connecting && <Loader2 className="animate-spin" size={20} />}
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm">Connected: {wallet.account.address.slice(0, 8)}...</div>
          )}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller Id *</label>
              <input type='number' value={form.seller_id} onChange={e => setForm({ ...form, seller_id: Number(e.target.value), seller: idToShop(Number(e.target.value))})}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter seller Id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name *</label>
              <input type="text" value={idToShop(form.seller_id)} /*onChange={e => setForm({ ...form, seller: e.target.value })} */ disabled={true}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter seller name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Share your experience..." />
            </div>
            {[
              { key: 'article', icon: Package, label: 'Article Quality *' },
              { key: 'shipping', icon: Truck, label: 'Shipping *' },
              { key: 'communication', icon: MessageCircle, label: 'Communication *' },
            ].map(({ key, icon: Icon, label }) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Icon size={18} className="text-gray-500" /><span className="text-sm font-medium">{label}</span></div>
                  <StarRating value={form[key as keyof typeof form] as number} onChange={v => setForm({ ...form, [key]: v })} />
                </div>
              </div>
            ))}
            <button onClick={handleSubmit} disabled={submitting || !wallet}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="animate-spin" size={20} />Submitting...</> : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
