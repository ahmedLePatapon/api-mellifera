export interface PaginationParams {
    page: number;
    limit: number;
}

export interface SortParams {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
