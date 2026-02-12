import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '@interfaces/common/decorators/current-user.decorator';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { RUCHER_REPOSITORY, RUCHE_REPOSITORY, INSPECTION_REPOSITORY } from '@shared/constants';

export const RESOURCE_TYPE_KEY = 'resourceType';

export type ResourceType = 'rucher' | 'ruche' | 'inspection';

export function SetResourceType(type: ResourceType): ClassDecorator & MethodDecorator {
  type ClassOrConstructor = object | (new (...args: unknown[]) => unknown);

  return (...args: unknown[]): void => {
    const [target, , descriptor] = args as [
      ClassOrConstructor,
      string | symbol | undefined,
      PropertyDescriptor | undefined,
    ];

    const metadataTarget: object =
      (descriptor && (descriptor.value as unknown as object)) ?? (target as object);

    Reflect.defineMetadata(RESOURCE_TYPE_KEY, type, metadataTarget);
  };
}

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionRepository: IInspectionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: JwtPayload;
      params: Record<string, string>;
    }>();
    const user = request.user;
    const params = request.params;

    const resourceType = this.reflector.getAllAndOverride<ResourceType | undefined>(
      RESOURCE_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resourceType) {
      return true;
    }

    const resourceId = params['id'];
    if (!resourceId) {
      return true;
    }

    const isOwner = await this.checkOwnership(resourceType, resourceId, user.sub);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }

  private async checkOwnership(
    type: ResourceType,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    switch (type) {
      case 'rucher': {
        const rucher = await this.rucherRepository.findById(resourceId);
        return rucher?.userId === userId;
      }
      case 'ruche': {
        const ruche = await this.rucheRepository.findById(resourceId);
        if (!ruche) return false;
        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        return rucher?.userId === userId;
      }
      case 'inspection': {
        const inspection = await this.inspectionRepository.findById(resourceId);
        if (!inspection) return false;
        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) return false;
        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        return rucher?.userId === userId;
      }
      default:
        return false;
    }
  }
}
