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
      success:
        'border-success-500 bg-success-50 text-success-700 dark:border-success-400 dark:bg-success-500/15 dark:text-success-400',
      error:
        'border-error-500 bg-error-50 text-error-700 dark:border-error-400 dark:bg-error-500/15 dark:text-error-400',
      warning:
        'border-warning-500 bg-warning-50 text-warning-700 dark:border-warning-400 dark:bg-warning-500/15 dark:text-warning-400',
      info:
        'border-blue-light-500 bg-blue-light-50 text-blue-light-700 dark:border-blue-light-400 dark:bg-blue-light-500/15 dark:text-blue-light-400',
    }[type];
  }

  dismissClassesFor(type: NotificationType): string {
    return {
      success:
        'text-success-600 hover:bg-success-100 hover:text-success-700 focus-visible:ring-success-500 dark:text-success-400 dark:hover:bg-success-500/15 dark:hover:text-success-300 dark:focus-visible:ring-success-400',
      error:
        'text-error-600 hover:bg-error-100 hover:text-error-700 focus-visible:ring-error-500 dark:text-error-400 dark:hover:bg-error-500/15 dark:hover:text-error-300 dark:focus-visible:ring-error-400',
      warning:
        'text-warning-600 hover:bg-warning-100 hover:text-warning-700 focus-visible:ring-warning-500 dark:text-warning-400 dark:hover:bg-warning-500/15 dark:hover:text-warning-300 dark:focus-visible:ring-warning-400',
      info:
        'text-blue-light-600 hover:bg-blue-light-100 hover:text-blue-light-700 focus-visible:ring-blue-light-500 dark:text-blue-light-400 dark:hover:bg-blue-light-500/15 dark:hover:text-blue-light-300 dark:focus-visible:ring-blue-light-400',
    }[type];
  }

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
