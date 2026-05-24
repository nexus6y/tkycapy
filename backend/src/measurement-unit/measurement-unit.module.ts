import { Module } from '@nestjs/common';
import { MeasurementUnitController } from './measurement-unit.controller';
@Module({ controllers: [MeasurementUnitController] })
export class MeasurementUnitModule {}
