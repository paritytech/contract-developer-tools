import { useState } from 'react';
import { RatingsList } from './components/RatingsList';
import { SubmitRating } from './components/SubmitRating';

const seller_names: Map<number, string> = new Map();


const names = ["Alice", "Bob", "Gav", "Ionut"]
const goods = ["Book", "Coffee", "Tea", "Drug", "Movie"]
const shops = ["Shop", "Store", "Emporium", "Outlet"]

function getRandomShop(): string {

    function rndElem(arr: String[]): string {
        return String(arr[Math.floor(Math.random() * arr.length)]);
    }
    let storeName = `${rndElem(names)}'s ${rndElem(goods)} ${rndElem(shops)}`
    return storeName;
}

function getOrInsertShop(id: number): string {

  if (seller_names.has(id)) {
    return seller_names.get(id)!;
  } else {
    let shop = getRandomShop();
    seller_names.set(id, shop);
    return shop;

  }
  

}

export default function App() {
  const [page, setPage] = useState('list');

  return page === 'list' ? <RatingsList onNavigate={setPage} idToShop={getOrInsertShop}/> : <SubmitRating onNavigate={setPage}  idToShop={getOrInsertShop}/>;
}
