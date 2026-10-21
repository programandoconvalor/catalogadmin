import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  NotificationService,
  NotificationType,
} from '../../../../core/notifications/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly notificationService = inject(NotificationService);

  classesFor(type: NotificationType): string {
    return {
      success: 'border-success-500 text-success-600 dark:border-success-400 dark:text-success-400',
      error: 'border-error-500 text-error-600 dark:border-error-400 dark:text-error-400',
      warning: 'border-warning-500 text-warning-600 dark:border-warning-400 dark:text-warning-400',
      info: 'border-blue-light-500 text-blue-light-600 dark:border-blue-light-400 dark:text-blue-light-400',
    }[type];
  }

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
