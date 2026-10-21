import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import {
  NotificationService,
  ToastNotification,
} from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('emits all notification types with their default titles and durations', fakeAsync(() => {
    const latest: (readonly ToastNotification[])[] = [];
    service.notifications$.subscribe((notifications) => latest.push(notifications));

    service.success('Guardado');
    service.error('Falló');
    service.warning('Revisar');
    service.info('Aviso');

    const notifications = latest[latest.length - 1];
    expect(notifications.map((notification) => notification.type)).toEqual([
      'success',
      'error',
      'warning',
      'info',
    ]);
    expect(notifications.map((notification) => notification.durationMs)).toEqual([
      3500,
      6000,
      5000,
      4000,
    ]);
    expect(notifications.map((notification) => notification.title)).toEqual([
      'Éxito',
      'Error',
      'Advertencia',
      'Información',
    ]);
    tick(6000);
  }));

  it('allows custom titles and durations', fakeAsync(() => {
    service.success('Guardado', 'Producto', 1500);

    let latest: readonly ToastNotification[] = [];
    service.notifications$.subscribe((notifications) => {
      latest = notifications;
    });
    expect(latest[0].title).toBe('Producto');
    expect(latest[0].durationMs).toBe(1500);
    tick(1500);
  }));

  it('marks a notification dismissed and removes it after the exit animation', fakeAsync(() => {
    const id = service.info('Aviso persistente', undefined, 0);
    service.dismiss(id);

    let latest: readonly ToastNotification[] = [];
    service.notifications$.subscribe((notifications) => {
      latest = notifications;
    });
    expect(latest[0].dismissed).toBeTrue();

    tick(220);
    expect(latest).toEqual([]);
  }));

  it('does not add duplicate notifications for an equivalent result', fakeAsync(() => {
    const firstId = service.success('Guardado', 'Producto');
    const duplicateId = service.success('Guardado', 'Producto');
    let latest: readonly ToastNotification[] = [];
    service.notifications$.subscribe((notifications) => {
      latest = notifications;
    });

    expect(duplicateId).toBe(firstId);
    expect(latest.length).toBe(1);
    tick(3500);
  }));
});
