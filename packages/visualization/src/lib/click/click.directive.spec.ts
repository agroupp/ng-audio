import { ClickDirective } from './click.directive';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  template: `<div click (position)="x = $event.x; y = $event.y"></div>`
})
export class HostComponent {
  x?: number;
  y?: number;
}

describe('ClickDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let bar: DebugElement;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      declarations: [ClickDirective, HostComponent]
    }).createComponent(HostComponent);
    fixture.detectChanges();
    bar = fixture.debugElement.query(By.directive(ClickDirective));
    bar.nativeElement.getBoundingClientRect = jest.fn<DOMRect, DOMRect[]>();
    bar.nativeElement.getBoundingClientRect.mockReturnValue({ width: 100, height: 10, x: 10, y: 10 });
    fixture.detectChanges();
  });

  it('should set `x` and `y` to 0, when clicked in the beginning', () => {
    const mouseEvent = new MouseEvent('click', { screenX: 10, screenY: 10 });
    (bar.nativeElement as HTMLDivElement).dispatchEvent(mouseEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.x).toEqual(0);
    expect(fixture.componentInstance.y).toEqual(0);
  });

  it('should set `x` to 0.25 and `y` to 0.5, when clicked in the first quarter and vertiacally in the middle', () => {
    const mouseEvent = new MouseEvent('click', { screenX: 35, screenY: 15 });
    (bar.nativeElement as HTMLDivElement).dispatchEvent(mouseEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.x).toEqual(0.25);
    expect(fixture.componentInstance.y).toEqual(0.5);
  });

  it('should set `x` and `y` to 0.5, when clicked in the middle', () => {
    const mouseEvent = new MouseEvent('click', { screenX: 60, screenY: 15 });
    (bar.nativeElement as HTMLDivElement).dispatchEvent(mouseEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.x).toEqual(0.5);
    expect(fixture.componentInstance.y).toEqual(0.5);
  });

  it('should set `x` to 0.75 and `y` to 0.5, when clicked in the last quarter and vertiacally in the middle', () => {
    const mouseEvent = new MouseEvent('click', { screenX: 85, screenY: 15 });
    (bar.nativeElement as HTMLDivElement).dispatchEvent(mouseEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.x).toEqual(0.75);
    expect(fixture.componentInstance.y).toEqual(0.5);
  });

  it('should set `x` and `y` to 1, when clicked in the end', () => {
    const mouseEvent = new MouseEvent('click', { screenX: 110, screenY: 20 });
    (bar.nativeElement as HTMLDivElement).dispatchEvent(mouseEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.x).toEqual(1);
    expect(fixture.componentInstance.y).toEqual(1);
  });
});
