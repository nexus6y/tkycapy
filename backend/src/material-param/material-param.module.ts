import { Module } from '@nestjs/common';
import { MaterialParamController } from './material-param.controller';
@Module({ controllers: [MaterialParamController] })
export class MaterialParamModule {}
