import { Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

import { Coordinates } from '@ng-audio/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[click]'
})
export class ClickDirective implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @Output() position = new EventEmitter<Coordinates>();

  constructor(private readonly el: ElementRef) {
    fromEvent<MouseEvent>(el.nativeElement, 'click')
      .pipe(
        map<MouseEvent, Coordinates>(event => ({ x: event.x, y: event.y })),
        tap(coord => {
          if (!el.nativeElement || !(el.nativeElement as HTMLElement).getBoundingClientRect) {
            return;
          }
          const rect = (el.nativeElement as HTMLElement).getBoundingClientRect();
          this.position.next({
            x: rect.width ? (coord.x - rect.x) / rect.width : 0,
            y: rect.height ? (coord.y - rect.y) / rect.height : 0
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
