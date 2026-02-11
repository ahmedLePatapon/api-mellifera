import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '@shared/types';

export interface ApiResponse<T> {
    data: T;
    statusCode: number;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'items' in value &&
        'total' in value &&
        'page' in value &&
        'limit' in value &&
        'totalPages' in value &&
        Array.isArray((value as PaginatedResult<unknown>).items)
    );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<ApiResponse<T>> {
        const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;

        return next.handle().pipe(
            map((data) => {
                if (isPaginatedResult(data)) {
                    return {
                        data: data.items as unknown as T,
                        statusCode,
                        meta: {
                            total: data.total,
                            page: data.page,
                            limit: data.limit,
                            totalPages: data.totalPages,
                        },
                    };
                }

                return {
                    data,
                    statusCode,
                };
            }),
        );
    }
}
