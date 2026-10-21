import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  durationMs: number;
  dismissed: boolean;
}

const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 3500,
  error: 6000,
  warning: 5000,
  info: 4000,
};

const DEFAULT_TITLES: Record<NotificationType, string> = {
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
  info: 'Información',
};

const EXIT_ANIMATION_DURATION_MS = 220;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<
    readonly ToastNotification[]
  >([]);
  readonly notifications$: Observable<readonly ToastNotification[]> =
    this.notificationsSubject.asObservable();

  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string, title?: string, durationMs?: number): number {
    return this.show('success', message, title, durationMs);
  }

  error(message: string, title?: string, durationMs?: number): number {
    return this.show('error', message, title, durationMs);
  }

  warning(message: string, title?: string, durationMs?: number): number {
    return this.show('warning', message, title, durationMs);
  }

  info(message: string, title?: string, durationMs?: number): number {
    return this.show('info', message, title, durationMs);
  }

  dismiss(id: number): void {
    const notification = this.notificationsSubject.value.find(
      (item) => item.id === id,
    );
    if (!notification || notification.dismissed) {
      return;
    }

    this.clearTimer(id);
    this.notificationsSubject.next(
      this.notificationsSubject.value.map((item) =>
        item.id === id ? { ...item, dismissed: true } : item,
      ),
    );
    this.timers.set(
      id,
      setTimeout(() => this.remove(id), EXIT_ANIMATION_DURATION_MS),
    );
  }

  private show(
    type: NotificationType,
    message: string,
    title?: string,
    durationMs = DEFAULT_DURATIONS[type],
  ): number {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new RangeError('La duración del Toast debe ser un número no negativo.');
    }

    const current = this.notificationsSubject.value;
    const duplicate = current.find(
      (item) =>
        !item.dismissed &&
        item.type === type &&
        item.title === (title || DEFAULT_TITLES[type]) &&
        item.message === message,
    );
    if (duplicate) {
      return duplicate.id;
    }

    const id = ++this.nextId;
    const notification: ToastNotification = {
      id,
      type,
      title: title || DEFAULT_TITLES[type],
      message,
      durationMs,
      dismissed: false,
    };
    this.notificationsSubject.next([...current, notification]);

    if (durationMs > 0) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), durationMs));
    }

    return id;
  }

  private remove(id: number): void {
    this.clearTimer(id);
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter((item) => item.id !== id),
    );
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
