import { useState } from 'react';
import { RatingsList } from './components/RatingsList';
import { SubmitRating } from './components/SubmitRating';

export default function App() {
  const [page, setPage] = useState('list');
  return page === 'list' ? <RatingsList onNavigate={setPage} /> : <SubmitRating onNavigate={setPage} />;
}
