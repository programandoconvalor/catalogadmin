import { TestBed } from '@angular/core/testing';

import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let component: ToastComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastComponent],
    });
    component = TestBed.createComponent(ToastComponent).componentInstance;
  });

  it('uses semantic colors for each notification type', () => {
    expect(component.classesFor('error')).toContain('bg-error-50');
    expect(component.classesFor('error')).toContain('dark:bg-error-500/15');
    expect(component.classesFor('success')).toContain('bg-success-50');
    expect(component.classesFor('warning')).toContain('bg-warning-50');
    expect(component.classesFor('info')).toContain('bg-blue-light-50');
  });

  it('colors the dismiss control to match its notification', () => {
    expect(component.dismissClassesFor('error')).toContain('text-error-600');
    expect(component.dismissClassesFor('success')).toContain(
      'text-success-600',
    );
    expect(component.dismissClassesFor('warning')).toContain(
      'text-warning-600',
    );
    expect(component.dismissClassesFor('info')).toContain(
      'text-blue-light-600',
    );
  });
});
