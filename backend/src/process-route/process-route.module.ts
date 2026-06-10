import { Module } from '@nestjs/common';
import { ProcessRouteController } from './process-route.controller';

@Module({ controllers: [ProcessRouteController] })
export class ProcessRouteModule {}
