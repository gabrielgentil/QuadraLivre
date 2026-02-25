import { Injectable } from '@nestjs/common';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  create(dto: CreateAvailabilityDto) {
    // TODO: Implement availability creation
    return dto;
  }

  findByCourtAndDate(courtId: string, date: string) {
    // TODO: Implement find by court and date
    return [];
  }

  remove(id: string) {
    // TODO: Implement availability removal
    return { id };
  }
}
