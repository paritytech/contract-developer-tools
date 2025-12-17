export interface Rating {
  id: number;
  seller_id: number;
  seller: string;
  date: string;
  comment: string;
  article: number;
  shipping: number;
  communication: number;
}

export interface RatingInput {
  seller_id:number;
  seller: string;
  comment: string;
  article: number;
  shipping: number;
  communication: number;
}

export interface SubmitResult {
  success: boolean;
  hash: string;
}
