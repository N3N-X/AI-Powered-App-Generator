export interface UserData {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  role: string;
  credits: number;
  totalCreditsUsed: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    projects: number;
    builds: number;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EditFormData {
  plan: string;
  role: string;
  credits: number;
}
