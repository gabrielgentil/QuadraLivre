import { Injectable } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  findByUser(userId: string) {
    // TODO: Implement find notifications by user
    return [];
  }

  markAsRead(id: string) {
    // TODO: Implement mark notification as read
    return { id };
  }

  send(sendNotificationDto: SendNotificationDto) {
    // TODO: Implement send notification
    return sendNotificationDto;
  }
}
